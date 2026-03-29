/**
 * Schema Analyzer — entry point
 *
 * Usage:
 *   import { analyzeSpec } from './schema-analyzer/index.js'
 *   const resourceMap = analyzeSpec('./swagger.yaml')
 */

export { readOpenApiSpec } from './openapi-reader.js';
export { detectIntent, extractEndpoints } from './intent-detector.js';
export { buildResourceMap } from './resource-grouper.js';
export {
  mapFieldsFromSchema,
  mapColumnsFromSchema,
  buildZodSchema,
  zodExpressionFromProp,
} from './schema-field-mapper.js';
export type {
  OpenApiSpec,
  OpenApiSchema,
  OpenApiPropertySchema,
  OpenApiOperation,
  OpenApiParameter,
  EndpointInfo,
  ResourceInfo,
  ResourceMap,
  FormFieldDef,
  ColumnDef,
  Intent,
  FieldType,
  ColumnType,
} from './types.js';

import { readOpenApiSpec } from './openapi-reader.js';
import { buildResourceMap } from './resource-grouper.js';
import type { ResourceMap } from './types.js';

/**
 * Convenience function: read a spec file and return the full ResourceMap.
 */
export function analyzeSpec(specPath: string): ResourceMap {
  const spec = readOpenApiSpec(specPath);
  return buildResourceMap(spec);
}
