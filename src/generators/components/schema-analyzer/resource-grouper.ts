import { pascalCase, camelCase } from 'change-case';
import type { EndpointInfo, OpenApiSpec, ResourceInfo, ResourceMap } from './types.js';
import { extractEndpoints } from './intent-detector.js';
import {
  mapFieldsFromSchema,
  buildZodSchema,
  mapColumnsFromSchema,
} from './schema-field-mapper.js';

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

// ─── Pick the "best" endpoint for each intent ─────────────────────────────────

/**
 * When a resource has multiple endpoints with the same intent, pick the
 * simplest one (fewest path params, then shortest path).
 *
 * Example: if both GET /pets and GET /users/{id}/pets detect as 'list',
 * we prefer GET /pets (0 path params, shorter path).
 */
function pickBest(endpoints: EndpointInfo[]): EndpointInfo {
  return endpoints.sort(
    (a, b) => a.pathParams.length - b.pathParams.length || a.path.length - b.path.length
  )[0];
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

  // 2. Group by tag / prefix
  const groups = new Map<string, EndpointInfo[]>();
  for (const ep of allEndpoints) {
    const key = tagOrPrefix(ep);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(ep);
  }

  // 3. Build one ResourceInfo per group
  const resourceMap: ResourceMap = new Map();

  for (const [tag, endpoints] of groups) {
    const byIntent = groupByIntent(endpoints);

    const listEp = byIntent.list ? pickBest(byIntent.list) : undefined;
    const detailEp = byIntent.detail ? pickBest(byIntent.detail) : undefined;
    const createEp = byIntent.create ? pickBest(byIntent.create) : undefined;
    const updateEp = byIntent.update ? pickBest(byIntent.update) : undefined;
    const deleteEp = byIntent.delete ? pickBest(byIntent.delete) : undefined;

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

    const resourceName = pascalCase(tag);

    // Infer the SDK model type name from the original $ref component name.
    // Priority: detail response > list items > list response (may be envelope object).
    const itemTypeName =
      (detailEp?.responseSchema as any)?.['x-ref-name'] ??
      (listEp?.responseSchema as any)?.items?.['x-ref-name'] ??
      (listEp?.responseSchema as any)?.['x-ref-name'] ??
      undefined;

    const info: ResourceInfo = {
      name: resourceName,
      tag,
      composableName: toConnectorName(tag),
      itemTypeName,
      endpoints,
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

    // Map key uses camelCase of the tag (e.g. 'petStore') to be a valid JS identifier.
    // resource.name uses PascalCase ('PetStore') for use in type/class names.
    // resource.tag preserves the original casing from the spec ('petStore' or 'pet_store').
    resourceMap.set(camelCase(tag), info);
  }

  return resourceMap;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

type IntentGroups = Partial<Record<EndpointInfo['intent'], EndpointInfo[]>>;

/**
 * Group endpoints by their detected intent.
 * Endpoints with intent 'unknown' (e.g. custom actions like POST /pets/{id}/upload)
 * are silently skipped — they do not map to a standard CRUD connector.
 */
function groupByIntent(endpoints: EndpointInfo[]): IntentGroups {
  const result: IntentGroups = {};
  for (const ep of endpoints) {
    if (ep.intent === 'unknown') {
      continue;
    }
    if (!result[ep.intent]) {
      result[ep.intent] = [];
    }
    result[ep.intent]!.push(ep);
  }
  return result;
}
