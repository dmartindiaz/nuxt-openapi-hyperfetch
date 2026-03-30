import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { load as loadYaml } from 'js-yaml';
import type { OpenApiSpec, OpenApiPropertySchema } from './types.js';

/**
 * Read an OpenAPI spec from a YAML or JSON file.
 * Returns the parsed spec with all $ref values resolved inline.
 */
export function readOpenApiSpec(filePath: string): OpenApiSpec {
  const absPath = path.resolve(filePath);
  const content = readFileSync(absPath, 'utf-8');

  const raw = filePath.endsWith('.json')
    ? (JSON.parse(content) as OpenApiSpec)
    : (loadYaml(content) as OpenApiSpec);

  if (!raw || typeof raw !== 'object' || !raw.openapi || !raw.paths) {
    throw new Error(`Invalid OpenAPI spec: ${absPath}`);
  }

  return resolveRefs(raw, raw) as OpenApiSpec;
}

// ─── $ref resolver ────────────────────────────────────────────────────────────

/**
 * Recursively walk the document and replace every { $ref: '#/...' } with the
 * referenced value (deep-cloned to avoid circular references).
 * Only local JSON Pointer refs (#/...) are supported.
 */
function resolveRefs(node: unknown, root: OpenApiSpec, visited = new Set<string>()): unknown {
  if (node === null || typeof node !== 'object') {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map((item) => resolveRefs(item, root, visited));
  }

  const obj = node as Record<string, unknown>;

  if (typeof obj['$ref'] === 'string') {
    const ref = obj['$ref'];

    if (visited.has(ref)) {
      // Circular ref protection — return empty object rather than infinite loop
      return {};
    }

    const resolved = resolvePointer(root, ref);
    const newVisited = new Set(visited);
    newVisited.add(ref);
    return resolveRefs(resolved, root, newVisited);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = resolveRefs(value, root, visited);
  }
  return result;
}

/**
 * Resolve a JSON Pointer like '#/components/schemas/Pet' against the root doc.
 */
function resolvePointer(root: unknown, ref: string): unknown {
  if (!ref.startsWith('#/')) {
    throw new Error(`Only local $ref values are supported (got: ${ref})`);
  }

  const parts = ref
    .slice(2)
    .split('/')
    .map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));

  let current: Record<string, unknown> = root as Record<string, unknown>;
  for (const part of parts) {
    if (current === null || typeof current !== 'object' || !(part in current)) {
      throw new Error(`Cannot resolve $ref: ${ref}`);
    }
    current = current[part] as Record<string, unknown>;
  }
  return current;
}

/**
 * Resolve a single inline schema that may still have $ref (convenience helper
 * used by other modules that receive already-partially-resolved specs).
 */
export function resolveSchema(
  schema: OpenApiPropertySchema,
  root: OpenApiSpec
): OpenApiPropertySchema {
  return resolveRefs(schema, root) as OpenApiPropertySchema;
}
