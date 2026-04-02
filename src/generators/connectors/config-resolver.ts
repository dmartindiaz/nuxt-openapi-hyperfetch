import { camelCase, pascalCase } from 'change-case';
import type {
  ConnectorsConfig,
  ConnectorOperationConfig,
  ConnectorOperationName,
  ConnectorResourceConfig,
} from '../../config/types.js';
import type {
  EndpointInfo,
  OpenApiSchema,
  ResourceInfo,
  ResourceMap,
} from '../components/schema-analyzer/types.js';
import {
  mapColumnsFromSchema,
  mapFieldsFromSchema,
  buildZodSchema,
} from '../components/schema-analyzer/index.js';

function toConnectorName(tag: string): string {
  const pascal = pascalCase(tag);
  const plural = /(?:s|x|z|ch|sh)$/i.test(pascal) ? `${pascal}es` : `${pascal}s`;
  return `use${plural}Connector`;
}

function cloneResource(resource: ResourceInfo): ResourceInfo {
  return {
    ...resource,
    endpoints: [...resource.endpoints],
    columns: [...resource.columns],
    formFields: {
      ...(resource.formFields.create ? { create: [...resource.formFields.create] } : {}),
      ...(resource.formFields.update ? { update: [...resource.formFields.update] } : {}),
    },
    zodSchemas: { ...resource.zodSchemas },
  };
}

function getRefNameFromSchema(schema?: OpenApiSchema): string | undefined {
  if (!schema) {
    return undefined;
  }

  const directRef = schema['x-ref-name'];
  if (typeof directRef === 'string') {
    return directRef;
  }

  const items = schema.items;
  if (items && typeof items === 'object') {
    const itemRef = items['x-ref-name'];
    if (typeof itemRef === 'string') {
      return itemRef;
    }
  }

  return undefined;
}

function rebuildDerived(resource: ResourceInfo): void {
  const schemaForColumns =
    resource.listEndpoint?.responseSchema ?? resource.detailEndpoint?.responseSchema;
  resource.columns = schemaForColumns ? mapColumnsFromSchema(schemaForColumns) : [];

  resource.formFields = {
    ...(resource.createEndpoint?.requestBodySchema
      ? { create: mapFieldsFromSchema(resource.createEndpoint.requestBodySchema) }
      : {}),
    ...(resource.updateEndpoint?.requestBodySchema
      ? { update: mapFieldsFromSchema(resource.updateEndpoint.requestBodySchema) }
      : {}),
  };

  resource.zodSchemas = {
    ...(resource.createEndpoint?.requestBodySchema
      ? { create: buildZodSchema(resource.createEndpoint.requestBodySchema) }
      : {}),
    ...(resource.updateEndpoint?.requestBodySchema
      ? { update: buildZodSchema(resource.updateEndpoint.requestBodySchema) }
      : {}),
  };

  resource.itemTypeName =
    getRefNameFromSchema(resource.detailEndpoint?.responseSchema) ??
    getRefNameFromSchema(resource.listEndpoint?.responseSchema) ??
    undefined;
}

function expectedMethodsForOperation(
  operationName: ConnectorOperationName
): Array<EndpointInfo['method']> {
  switch (operationName) {
    case 'getAll':
    case 'get':
      return ['GET'];
    case 'create':
      return ['POST'];
    case 'update':
      return ['PUT', 'PATCH'];
    case 'delete':
      return ['DELETE'];
  }
}

function selectByIntent(
  operationName: ConnectorOperationName,
  candidates: EndpointInfo[]
): EndpointInfo[] {
  if (operationName === 'getAll') {
    const preferred = candidates.filter((c) => c.intent === 'list');
    return preferred.length > 0 ? preferred : candidates;
  }
  if (operationName === 'get') {
    const preferred = candidates.filter((c) => c.intent === 'detail');
    return preferred.length > 0 ? preferred : candidates;
  }
  if (operationName === 'update') {
    const put = candidates.filter((c) => c.method === 'PUT');
    return put.length > 0 ? put : candidates;
  }
  return candidates;
}

function buildEndpointIndex(resourceMap: ResourceMap): {
  byOperationId: Map<string, EndpointInfo>;
  byPath: Map<string, EndpointInfo[]>;
} {
  const byOperationId = new Map<string, EndpointInfo>();
  const byPath = new Map<string, EndpointInfo[]>();

  for (const resource of resourceMap.values()) {
    for (const endpoint of resource.endpoints) {
      byOperationId.set(endpoint.operationId, endpoint);
      const list = byPath.get(endpoint.path) ?? [];
      list.push(endpoint);
      byPath.set(endpoint.path, list);
    }
  }

  return { byOperationId, byPath };
}

function resolveEndpoint(
  operationName: ConnectorOperationName,
  operationConfig: ConnectorOperationConfig,
  endpointIndex: ReturnType<typeof buildEndpointIndex>,
  resourceName: string
): EndpointInfo {
  if (operationConfig.operationId && operationConfig.path) {
    throw new Error(
      `[connectors] Resource "${resourceName}" operation "${operationName}" cannot define both operationId and path`
    );
  }

  if (!operationConfig.operationId && !operationConfig.path) {
    throw new Error(
      `[connectors] Resource "${resourceName}" operation "${operationName}" must define operationId or path`
    );
  }

  if (operationConfig.operationId) {
    const endpoint = endpointIndex.byOperationId.get(operationConfig.operationId);
    if (!endpoint) {
      throw new Error(
        `[connectors] Resource "${resourceName}" operation "${operationName}" references unknown operationId "${operationConfig.operationId}"`
      );
    }
    return endpoint;
  }

  const candidates = endpointIndex.byPath.get(operationConfig.path!) ?? [];
  if (candidates.length === 0) {
    throw new Error(
      `[connectors] Resource "${resourceName}" operation "${operationName}" references unknown path "${operationConfig.path}"`
    );
  }

  const validMethods = expectedMethodsForOperation(operationName);
  const byMethod = candidates.filter((c) => validMethods.includes(c.method));
  if (byMethod.length === 0) {
    throw new Error(
      `[connectors] Resource "${resourceName}" operation "${operationName}" path "${operationConfig.path}" has no compatible method (${validMethods.join('/')})`
    );
  }

  const prioritized = selectByIntent(operationName, byMethod);
  return prioritized[0];
}

function setOperationEndpoint(
  resource: ResourceInfo,
  operationName: ConnectorOperationName,
  endpoint: EndpointInfo
): void {
  switch (operationName) {
    case 'getAll':
      resource.listEndpoint = endpoint;
      break;
    case 'get':
      resource.detailEndpoint = endpoint;
      break;
    case 'create':
      resource.createEndpoint = endpoint;
      break;
    case 'update':
      resource.updateEndpoint = endpoint;
      break;
    case 'delete':
      resource.deleteEndpoint = endpoint;
      break;
  }

  if (!resource.endpoints.some((ep) => ep.operationId === endpoint.operationId)) {
    resource.endpoints.push(endpoint);
  }
}

function createResourceSkeleton(resourceKey: string): ResourceInfo {
  return {
    name: pascalCase(resourceKey),
    tag: resourceKey,
    composableName: toConnectorName(resourceKey),
    endpoints: [],
    columns: [],
    formFields: {},
    zodSchemas: {},
  };
}

function applyResourceOverrides(
  target: ResourceInfo,
  resourceName: string,
  config: ConnectorResourceConfig,
  endpointIndex: ReturnType<typeof buildEndpointIndex>
): ResourceInfo {
  const operations = config.operations ?? {};

  for (const [operationName, operationConfig] of Object.entries(operations) as Array<
    [ConnectorOperationName, ConnectorOperationConfig | undefined]
  >) {
    if (!operationConfig) {
      continue;
    }

    const endpoint = resolveEndpoint(operationName, operationConfig, endpointIndex, resourceName);
    setOperationEndpoint(target, operationName, endpoint);
  }

  rebuildDerived(target);
  return target;
}

function normalizeConfig(
  config?: ConnectorsConfig
): Required<Pick<ConnectorsConfig, 'strategy'>> & ConnectorsConfig {
  return {
    strategy: config?.strategy ?? 'hybrid',
    ...config,
  };
}

export function resolveConnectorResourceMap(
  baseResourceMap: ResourceMap,
  connectorsConfig?: ConnectorsConfig
): ResourceMap {
  if (!connectorsConfig) {
    return baseResourceMap;
  }

  const normalized = normalizeConfig(connectorsConfig);
  const resourceConfigs = normalized.resources ?? {};
  const endpointIndex = buildEndpointIndex(baseResourceMap);

  if (normalized.strategy === 'manual') {
    const manualMap: ResourceMap = new Map();

    for (const [resourceName, resourceConfig] of Object.entries(resourceConfigs)) {
      const resourceKey = camelCase(resourceName);
      const baseResource = baseResourceMap.get(resourceKey);
      const target = baseResource
        ? cloneResource(baseResource)
        : createResourceSkeleton(resourceName);

      applyResourceOverrides(target, resourceName, resourceConfig, endpointIndex);
      manualMap.set(resourceKey, target);
    }

    return manualMap;
  }

  const hybridMap: ResourceMap = new Map(
    [...baseResourceMap.entries()].map(([key, value]) => [key, cloneResource(value)])
  );

  for (const [resourceName, resourceConfig] of Object.entries(resourceConfigs)) {
    const resourceKey = camelCase(resourceName);
    const target = hybridMap.get(resourceKey) ?? createResourceSkeleton(resourceName);
    applyResourceOverrides(target, resourceName, resourceConfig, endpointIndex);
    hybridMap.set(resourceKey, target);
  }

  return hybridMap;
}
