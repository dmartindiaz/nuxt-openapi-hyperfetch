import { pascalCase, camelCase } from 'change-case';
import type { EndpointInfo, OpenApiSpec, ResourceInfo, ResourceMap } from './types.js';
import { extractEndpoints } from './intent-detector.js';
import {
  mapFieldsFromSchema,
  buildZodSchema,
  mapColumnsFromSchema,
} from './schema-field-mapper.js';

type CrudOperation = 'list' | 'detail' | 'create' | 'update' | 'delete';

interface CrudCandidate {
  operation: CrudOperation;
  collectionPath: string;
  endpoint: EndpointInfo;
}

interface ResourceFamily {
  collectionPath: string;
  groupKey: string;
  assignedEndpoints: EndpointInfo[];
  candidates: CrudCandidate[];
}

// ─── Naming helpers ───────────────────────────────────────────────────────────

/**
 * Derive a plural connector composable name from a tag.
 * 'pet' → 'usePetsConnector'
 * 'store' → 'useStoreConnector'   (already ends in e, avoid double-s)
 */
function toConnectorName(tag: string): string {
  const pascal = pascalCase(tag);
  // Simple English plural: if ends in 's', 'x', 'z', 'ch', 'sh' → +es
  // otherwise → +s. Good enough for API resource names.
  const plural = /(?:s|x|z|ch|sh)$/i.test(pascal) ? `${pascal}es` : `${pascal}s`;
  return `use${plural}Connector`;
}

function toPathConnectorName(resourceName: string): string {
  return `use${pascalCase(resourceName)}Connector`;
}

/**
 * Primary grouping key for an endpoint: first tag, or path prefix as fallback.
 * '/pets/{id}' → 'pets'
 */
function tagOrPrefix(endpoint: EndpointInfo): string {
  if (endpoint.tags.length > 0) {
    return endpoint.tags[0];
  }
  // Path prefix: first non-empty segment, lower-cased
  const segment = endpoint.path.split('/').find((s) => s && !s.startsWith('{'));
  return segment ?? 'unknown';
}

function splitPathSegments(path: string): string[] {
  return path.split('/').filter(Boolean);
}

function isPathParam(segment: string): boolean {
  return /^\{[^}]+\}$/.test(segment);
}

function isCollectionPath(path: string): boolean {
  const segments = splitPathSegments(path);
  return segments.length > 0 && !isPathParam(segments[segments.length - 1]);
}

function getCollectionPathFromMember(path: string): string | undefined {
  const segments = splitPathSegments(path);
  if (segments.length < 2) {
    return undefined;
  }

  const last = segments[segments.length - 1];
  const previous = segments[segments.length - 2];

  if (!isPathParam(last) || isPathParam(previous)) {
    return undefined;
  }

  return `/${segments.slice(0, -1).join('/')}`;
}

function isObjectLikeSchema(schema?: EndpointInfo['responseSchema']): boolean {
  if (!schema) {
    return false;
  }

  return Boolean(
    schema.type === 'object' ||
      schema.properties ||
      schema['x-ref-name'] ||
      schema.allOf ||
      schema.oneOf ||
      schema.anyOf
  );
}

function isArrayOfObjectsSchema(schema?: EndpointInfo['responseSchema']): boolean {
  if (!schema || !schema.items) {
    return false;
  }

  return isObjectLikeSchema(schema.items);
}

function detectCrudCandidate(endpoint: EndpointInfo): CrudCandidate | undefined {
  const memberCollectionPath = getCollectionPathFromMember(endpoint.path);

  if (endpoint.method === 'GET' && memberCollectionPath && isObjectLikeSchema(endpoint.responseSchema)) {
    return {
      operation: 'detail',
      collectionPath: memberCollectionPath,
      endpoint,
    };
  }

  if ((endpoint.method === 'PUT' || endpoint.method === 'PATCH') && memberCollectionPath) {
    return {
      operation: 'update',
      collectionPath: memberCollectionPath,
      endpoint,
    };
  }

  if (endpoint.method === 'DELETE' && memberCollectionPath) {
    return {
      operation: 'delete',
      collectionPath: memberCollectionPath,
      endpoint,
    };
  }

  if (endpoint.method === 'GET' && isCollectionPath(endpoint.path) && isArrayOfObjectsSchema(endpoint.responseSchema)) {
    return {
      operation: 'list',
      collectionPath: endpoint.path,
      endpoint,
    };
  }

  if (endpoint.method === 'POST' && isCollectionPath(endpoint.path)) {
    return {
      operation: 'create',
      collectionPath: endpoint.path,
      endpoint,
    };
  }

  return undefined;
}

function isPathWithinCollection(path: string, collectionPath: string): boolean {
  return path === collectionPath || path.startsWith(`${collectionPath}/`);
}

function resourceNameFromCollectionPath(collectionPath: string): string {
  const literals = splitPathSegments(collectionPath).filter((segment) => !isPathParam(segment));
  return literals.join('-') || 'resource';
}

function selectOperationCandidate(
  candidates: CrudCandidate[]
): EndpointInfo | undefined {
  if (candidates.length === 0) {
    return undefined;
  }

  const distinctPaths = new Set(candidates.map((candidate) => candidate.endpoint.path));
  if (distinctPaths.size > 1) {
    return undefined;
  }

  return candidates[0].endpoint;
}

function selectUpdateCandidate(candidates: CrudCandidate[]): EndpointInfo | undefined {
  if (candidates.length === 0) {
    return undefined;
  }

  const distinctPaths = new Set(candidates.map((candidate) => candidate.endpoint.path));
  if (distinctPaths.size > 1) {
    return undefined;
  }

  const putCandidate = candidates.find((candidate) => candidate.endpoint.method === 'PUT');
  return putCandidate?.endpoint ?? candidates[0].endpoint;
}

function inferResourceFamilies(allEndpoints: EndpointInfo[]): Map<string, ResourceFamily> {
  const candidates = allEndpoints
    .map((endpoint) => detectCrudCandidate(endpoint))
    .filter((candidate): candidate is CrudCandidate => Boolean(candidate));

  const anchoredCollectionPaths = new Set(
    candidates
      .filter((candidate) => ['detail', 'update', 'delete'].includes(candidate.operation))
      .map((candidate) => candidate.collectionPath)
  );

  const families = new Map<string, ResourceFamily>();

  for (const candidate of candidates) {
    if (!anchoredCollectionPaths.has(candidate.collectionPath)) {
      continue;
    }

    if (!families.has(candidate.collectionPath)) {
      families.set(candidate.collectionPath, {
        collectionPath: candidate.collectionPath,
        groupKey: tagOrPrefix(candidate.endpoint),
        assignedEndpoints: [],
        candidates: [],
      });
    }

    families.get(candidate.collectionPath)!.candidates.push(candidate);
  }

  const familiesByGroup = new Map<string, ResourceFamily[]>();
  for (const family of families.values()) {
    const list = familiesByGroup.get(family.groupKey) ?? [];
    list.push(family);
    familiesByGroup.set(family.groupKey, list);
  }

  for (const endpoint of allEndpoints) {
    const groupKey = tagOrPrefix(endpoint);
    const groupFamilies = familiesByGroup.get(groupKey) ?? [];

    if (groupFamilies.length === 0) {
      continue;
    }

    if (groupFamilies.length === 1) {
      groupFamilies[0].assignedEndpoints.push(endpoint);
      continue;
    }

    const bestMatch = [...groupFamilies]
      .filter((family) => isPathWithinCollection(endpoint.path, family.collectionPath))
      .sort((a, b) => b.collectionPath.length - a.collectionPath.length)[0];

    (bestMatch ?? groupFamilies[0]).assignedEndpoints.push(endpoint);
  }

  return families;
}

// ─── Main grouper ─────────────────────────────────────────────────────────────

/**
 * Parse the entire OpenAPI spec and produce one ResourceInfo per resource.
 * A resource is a group of endpoints that share the same tag (or path prefix).
 */
export function buildResourceMap(spec: OpenApiSpec): ResourceMap {
  // 1. Collect all endpoints
  const allEndpoints: EndpointInfo[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    // pathItem is already $ref-resolved at this point
    const endpoints = extractEndpoints(
      path,
      pathItem as unknown as Record<string, import('./types.js').OpenApiOperation>
    );
    allEndpoints.push(...endpoints);
  }

  // 2. Infer canonical CRUD families
  const families = inferResourceFamilies(allEndpoints);
  const familiesByGroup = new Map<string, ResourceFamily[]>();
  for (const family of families.values()) {
    const list = familiesByGroup.get(family.groupKey) ?? [];
    list.push(family);
    familiesByGroup.set(family.groupKey, list);
  }

  // 3. Build one ResourceInfo per inferred family
  const resourceMap: ResourceMap = new Map();

  for (const family of families.values()) {
    const listEp = selectOperationCandidate(
      family.candidates.filter((candidate) => candidate.operation === 'list')
    );
    const detailEp = selectOperationCandidate(
      family.candidates.filter((candidate) => candidate.operation === 'detail')
    );
    const createEp = selectOperationCandidate(
      family.candidates.filter((candidate) => candidate.operation === 'create')
    );
    const updateEp = selectUpdateCandidate(
      family.candidates.filter((candidate) => candidate.operation === 'update')
    );
    const deleteEp = selectOperationCandidate(
      family.candidates.filter((candidate) => candidate.operation === 'delete')
    );

    if (!listEp && !detailEp && !createEp && !updateEp && !deleteEp) {
      continue;
    }

    // Infer columns from list > detail response schema
    const schemaForColumns = listEp?.responseSchema ?? detailEp?.responseSchema;
    const columns = schemaForColumns ? mapColumnsFromSchema(schemaForColumns) : [];

    // Form fields + Zod schemas
    const createFields = createEp?.requestBodySchema
      ? mapFieldsFromSchema(createEp.requestBodySchema)
      : undefined;
    const updateFields = updateEp?.requestBodySchema
      ? mapFieldsFromSchema(updateEp.requestBodySchema)
      : undefined;

    const createZod = createEp?.requestBodySchema
      ? buildZodSchema(createEp.requestBodySchema)
      : undefined;
    const updateZod = updateEp?.requestBodySchema
      ? buildZodSchema(updateEp.requestBodySchema)
      : undefined;

    // Infer the SDK model type name from the original $ref component name.
    // Priority: detail response > list items > list response (may be envelope object).
    const itemTypeName =
      (detailEp?.responseSchema as any)?.['x-ref-name'] ??
      (listEp?.responseSchema as any)?.items?.['x-ref-name'] ??
      (listEp?.responseSchema as any)?.['x-ref-name'] ??
      undefined;

    const isSingleFamilyForGroup = (familiesByGroup.get(family.groupKey)?.length ?? 0) === 1;
    const resourceKeyName = isSingleFamilyForGroup
      ? family.groupKey
      : resourceNameFromCollectionPath(family.collectionPath);
    const resourceName = pascalCase(resourceKeyName);

    const info: ResourceInfo = {
      name: resourceName,
      tag: resourceKeyName,
      composableName: isSingleFamilyForGroup
        ? toConnectorName(resourceKeyName)
        : toPathConnectorName(resourceKeyName),
      itemTypeName,
      endpoints: family.assignedEndpoints,
      listEndpoint: listEp,
      detailEndpoint: detailEp,
      createEndpoint: createEp,
      updateEndpoint: updateEp,
      deleteEndpoint: deleteEp,
      columns,
      formFields: {
        ...(createFields ? { create: createFields } : {}),
        ...(updateFields ? { update: updateFields } : {}),
      },
      zodSchemas: {
        ...(createZod ? { create: createZod } : {}),
        ...(updateZod ? { update: updateZod } : {}),
      },
    };

    // Map key uses camelCase of the public resource key so it stays stable in config.
    resourceMap.set(camelCase(resourceKeyName), info);
  }

  return resourceMap;
}
