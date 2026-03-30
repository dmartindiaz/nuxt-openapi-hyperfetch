import { pascalCase } from 'change-case';
import type {
  ColumnDef,
  ColumnType,
  FieldType,
  FormFieldDef,
  OpenApiPropertySchema,
  OpenApiSchema,
} from './types.js';

// ─── Column mapping ───────────────────────────────────────────────────────────

/**
 * Derive table ColumnDef[] from a response schema (list or detail).
 * When the response schema is an array, we read the items schema.
 */
export function mapColumnsFromSchema(schema: OpenApiSchema): ColumnDef[] {
  // If the response is an array, inspect the items object schema
  const objectSchema = schema.type === 'array' && schema.items ? schema.items : schema;

  if (!objectSchema.properties) {
    return [];
  }

  return Object.entries(objectSchema.properties).map(([key, prop]) => ({
    key,
    label: pascalCase(key)
      .replace(/([A-Z])/g, ' $1')
      .trim(),
    type: columnTypeFromProp(prop),
  }));
}

function columnTypeFromProp(prop: OpenApiPropertySchema): ColumnType {
  if (prop.enum) {
    return 'badge';
  }
  if (prop.type === 'boolean') {
    return 'boolean';
  }
  if (prop.type === 'integer' || prop.type === 'number') {
    return 'number';
  }
  if (prop.format === 'date' || prop.format === 'date-time') {
    return 'date';
  }
  return 'text';
}

// ─── Form field mapping ───────────────────────────────────────────────────────

/**
 * Derive FormFieldDef[] from a request body schema.
 * readOnly fields are included as hidden: true (developer can override).
 */
export function mapFieldsFromSchema(schema: OpenApiSchema): FormFieldDef[] {
  if (!schema.properties) {
    return [];
  }

  const required = new Set(schema.required ?? []);

  return Object.entries(schema.properties).map(([key, prop]) => {
    const isRequired = required.has(key);
    const fieldType = fieldTypeFromProp(prop);

    return {
      key,
      label: labelFromKey(key),
      type: fieldType,
      required: isRequired,
      hidden: prop.readOnly === true,
      options: optionsFromProp(prop),
      placeholder: undefined,
      zodExpression: zodExpressionFromProp(prop, isRequired),
    };
  });
}

function labelFromKey(key: string): string {
  // Split camelCase/PascalCase into words and capitalise the first letter.
  // 'photoUrls' → 'Photo Urls',  'firstName' → 'First Name'
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function fieldTypeFromProp(prop: OpenApiPropertySchema): FieldType {
  if (prop.readOnly) {
    return 'input'; // will be hidden anyway
  }

  if (prop.enum) {
    return 'select';
  }
  if (prop.type === 'boolean') {
    return 'checkbox';
  }
  if (prop.type === 'integer' || prop.type === 'number') {
    return 'number';
  }

  if (prop.type === 'string') {
    if (prop.format === 'date' || prop.format === 'date-time') {
      return 'datepicker';
    }
    if (typeof prop.maxLength === 'number' && prop.maxLength > 200) {
      return 'textarea';
    }
    return 'input';
  }

  // array, object → input as fallback
  return 'input';
}

function optionsFromProp(prop: OpenApiPropertySchema): FormFieldDef['options'] {
  if (!prop.enum) {
    return undefined;
  }
  return prop.enum.map((v) => ({ label: String(v), value: v }));
}

// ─── Zod expression generation ────────────────────────────────────────────────

/**
 * Generate a Zod expression string for a single OpenAPI property.
 *
 * Returns a SOURCE CODE STRING (e.g. 'z.string().min(3)') that will be
 * embedded inside the generated connector file, not evaluated here.
 *
 * Validation constraints (minLength, maximum, enum…) are read directly
 * from the OpenAPI property schema and chained onto the Zod expression.
 */
export function zodExpressionFromProp(prop: OpenApiPropertySchema, isRequired: boolean): string {
  let expr = baseZodExpr(prop);

  if (!isRequired) {
    expr += '.optional()';
  }

  return expr;
}

function baseZodExpr(prop: OpenApiPropertySchema): string {
  // Enum
  if (prop.enum && prop.enum.length > 0) {
    const values = prop.enum.map((v) => JSON.stringify(v)).join(', ');
    return `z.enum([${values}])`;
  }

  switch (prop.type) {
    case 'string':
      return stringZodExpr(prop);

    case 'integer':
      return integerZodExpr(prop);

    case 'number':
      return numberZodExpr(prop);

    case 'boolean':
      return 'z.boolean()';

    case 'array':
      return arrayZodExpr(prop);

    case 'object':
      return 'z.record(z.unknown())';

    default:
      // $ref already resolved, unknown type → permissive
      return 'z.unknown()';
  }
}

function stringZodExpr(prop: OpenApiPropertySchema): string {
  const expr = 'z.string()';

  if (prop.format === 'email') {
    return `${expr}.email()`;
  }
  if (prop.format === 'uri' || prop.format === 'url') {
    return `${expr}.url()`;
  }
  if (prop.format === 'uuid') {
    return `${expr}.uuid()`;
  }
  if (prop.format === 'date' || prop.format === 'date-time') {
    return `${expr}.datetime()`;
  }

  let chained = expr;
  if (typeof prop.minLength === 'number') {
    chained += `.min(${prop.minLength})`;
  }
  if (typeof prop.maxLength === 'number') {
    chained += `.max(${prop.maxLength})`;
  }

  return chained;
}

function integerZodExpr(prop: OpenApiPropertySchema): string {
  let expr = 'z.number().int()';
  if (typeof prop.minimum === 'number') {
    expr += `.min(${prop.minimum})`;
  }
  if (typeof prop.maximum === 'number') {
    expr += `.max(${prop.maximum})`;
  }
  return expr;
}

function numberZodExpr(prop: OpenApiPropertySchema): string {
  let expr = 'z.number()';
  if (typeof prop.minimum === 'number') {
    expr += `.min(${prop.minimum})`;
  }
  if (typeof prop.maximum === 'number') {
    expr += `.max(${prop.maximum})`;
  }
  return expr;
}

function arrayZodExpr(prop: OpenApiPropertySchema): string {
  const itemExpr = prop.items ? baseZodExpr(prop.items) : 'z.unknown()';
  let expr = `z.array(${itemExpr})`;
  if (typeof prop.minItems === 'number') {
    expr += `.min(${prop.minItems})`;
  }
  if (typeof prop.maxItems === 'number') {
    expr += `.max(${prop.maxItems})`;
  }
  return expr;
}

// ─── Full Zod object schema string ───────────────────────────────────────────

/**
 * Build a complete z.object({...}) string from a request body schema.
 *
 * ⚠️  This returns a SOURCE CODE STRING, not a real Zod object.
 * It is embedded verbatim inside the generated connector file so that
 * the user's project (which has zod installed) can evaluate it at runtime.
 *
 * Example output:
 *   z.object({
 *     name: z.string().min(1),
 *     status: z.enum(['available','pending','sold']).optional(),
 *   })
 */
export function buildZodSchema(schema: OpenApiSchema): string {
  if (!schema.properties) {
    return 'z.object({})';
  }

  const required = new Set(schema.required ?? []);

  const lines = Object.entries(schema.properties).map(([key, prop]) => {
    const expr = zodExpressionFromProp(prop, required.has(key));
    const readOnly = prop.readOnly ? ' // readOnly — excluded from form' : '';
    return `  ${key}: ${expr},${readOnly}`;
  });

  return `z.object({\n${lines.join('\n')}\n})`;
}
