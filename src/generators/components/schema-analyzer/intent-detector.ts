import type { EndpointInfo, Intent, OpenApiOperation, OpenApiPropertySchema } from './types.js';

// HTTP methods we care about
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH']);
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

// ─── Path analysis helpers ────────────────────────────────────────────────────

/** Returns path parameter names found in a path, e.g. '/pets/{id}' → ['id'] */
function extractPathParams(path: string): string[] {
  const matches = path.match(/\{([^}]+)\}/g) ?? [];
  return matches.map((m) => m.slice(1, -1));
}

/** True when the path ends with a path parameter: /pets/{id} */
function endsWithPathParam(path: string): boolean {
  return /\/\{[^}]+\}$/.test(path);
}

// ─── Response schema analysis ─────────────────────────────────────────────────

/**
 * Return the resolved schema for the first 2xx response that has
 * an application/json body, or undefined.
 */
function getSuccessResponseSchema(operation: OpenApiOperation): OpenApiPropertySchema | undefined {
  if (!operation.responses) {
    return undefined;
  }

  for (const [statusCode, response] of Object.entries(operation.responses)) {
    const code = parseInt(statusCode, 10);
    if (isNaN(code) || code < 200 || code >= 300) {
      continue;
    }

    const jsonContent = response.content?.['application/json'];
    if (jsonContent?.schema) {
      return jsonContent.schema;
    }
  }

  return undefined;
}

/** True when schema represents an array (type: array, or items present) */
function isArraySchema(schema: OpenApiPropertySchema): boolean {
  return schema.type === 'array' || schema.items !== undefined;
}

// ─── Request body schema ──────────────────────────────────────────────────────

function getRequestBodySchema(operation: OpenApiOperation): OpenApiPropertySchema | undefined {
  if (!operation.requestBody?.content) {
    return undefined;
  }

  const jsonContent = operation.requestBody.content['application/json'];
  if (jsonContent?.schema) {
    return jsonContent.schema;
  }

  // Fallback to form-urlencoded
  const formContent = operation.requestBody.content['application/x-www-form-urlencoded'];
  return formContent?.schema;
}

// ─── Intent detection ─────────────────────────────────────────────────────────

/**
 * Detect the CRUD intent of a single endpoint.
 *
 * Priority:
 * 1. x-nxh-intent extension on the operation (developer override)
 * 2. HTTP method + path pattern + response schema
 */
export function detectIntent(
  method: HttpMethod,
  path: string,
  operation: OpenApiOperation
): Intent {
  // 1. Developer override via OpenAPI extension
  const override = operation['x-nxh-intent'];
  if (override) {
    return override;
  }

  const hasPathParam = extractPathParams(path).length > 0;
  const responseSchema = getSuccessResponseSchema(operation);

  switch (method) {
    case 'DELETE':
      return 'delete';

    case 'POST':
      // POST /resource  → create
      // POST /resource/{id}/action → unknown (custom action, not CRUD)
      return !endsWithPathParam(path) ? 'create' : 'unknown';

    case 'PUT':
    case 'PATCH':
      return 'update';

    case 'GET': {
      // A GET without a JSON response (e.g. binary download) is not a CRUD intent
      if (!responseSchema) {
        return 'unknown';
      }

      // Array response ( type: 'array' OR has 'items' ) → always a list
      if (isArraySchema(responseSchema)) {
        return 'list';
      }

      // Object response — distinguish list vs detail by path structure:
      //   GET /pets/{id}  → has path param → detail (single item fetch)
      //   GET /pets       → no path param  → list (likely paginated envelope: { data: [], total: n })
      if (hasPathParam) {
        return 'detail';
      }

      return 'list';
    }

    default:
      return 'unknown';
  }
}

// ─── Endpoint extraction ──────────────────────────────────────────────────────

/**
 * Extract all endpoints from a single path item as EndpointInfo[].
 * The spec must already be $ref-resolved before calling this.
 */
export function extractEndpoints(
  path: string,
  pathItem: Record<string, OpenApiOperation>
): EndpointInfo[] {
  const results: EndpointInfo[] = [];
  const pathParams = extractPathParams(path);

  for (const method of HTTP_METHODS) {
    const operation: OpenApiOperation | undefined = pathItem[method.toLowerCase()];

    if (!operation) {
      continue;
    }

    const intent = detectIntent(method, path, operation);

    const endpoint: EndpointInfo = {
      // Fallback operationId when the spec omits it: 'get_/pets/{id}' → 'get__pets__id_'
      // This rarely produces a ideal composable name, but avoids a crash.
      operationId: operation.operationId ?? `${method.toLowerCase()}_${path.replace(/\//g, '_')}`,
      method,
      path,
      tags: operation.tags ?? [],
      summary: operation.summary,
      description: operation.description,
      intent,
      hasPathParams: pathParams.length > 0,
      pathParams,
    };

    // Attach response schema for GET intents
    if (method === 'GET') {
      const schema = getSuccessResponseSchema(operation);
      if (schema) {
        endpoint.responseSchema = schema as import('./types.js').OpenApiSchema;
      }
    }

    // Attach request body schema for mutating methods
    if (MUTATING_METHODS.has(method)) {
      const schema = getRequestBodySchema(operation);
      if (schema) {
        endpoint.requestBodySchema = schema as import('./types.js').OpenApiSchema;
      }
    }

    results.push(endpoint);
  }

  return results;
}
