/**
 * Types for the Schema Analyzer — Fase 1 of the Connector Generator.
 *
 * The Schema Analyzer reads an OpenAPI YAML/JSON spec directly and produces
 * a ResourceMap: one ResourceInfo per tag/path-prefix group of endpoints.
 */

// ─── Intent ─────────────────────────────────────────────────────────────────

export type Intent = 'list' | 'detail' | 'create' | 'update' | 'delete' | 'unknown';

// ─── OpenAPI raw schema types (minimal surface we need) ─────────────────────

export interface OpenApiPropertySchema {
  type?: string;
  format?: string;
  enum?: string[];
  items?: OpenApiPropertySchema;
  $ref?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  properties?: Record<string, OpenApiPropertySchema>;
  required?: string[];
  description?: string;
  example?: unknown;
  additionalProperties?: OpenApiPropertySchema | boolean;
  allOf?: OpenApiPropertySchema[];
  oneOf?: OpenApiPropertySchema[];
  anyOf?: OpenApiPropertySchema[];
  /** Injected by the $ref resolver — original component schema name, e.g. 'Pet' */
  'x-ref-name'?: string;
}

export interface OpenApiSchema extends OpenApiPropertySchema {
  required?: string[];
  properties?: Record<string, OpenApiPropertySchema>;
}

export interface OpenApiParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  schema?: OpenApiPropertySchema;
  description?: string;
}

export interface OpenApiOperation {
  operationId?: string;
  tags?: string[];
  summary?: string;
  description?: string;
  parameters?: OpenApiParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: OpenApiPropertySchema }>;
  };
  responses?: Record<
    string,
    {
      description?: string;
      content?: Record<string, { schema?: OpenApiPropertySchema }>;
    }
  >;
  /** Developer override — detected intent for this endpoint */
  'x-nxh-intent'?: Intent;
}

export interface OpenApiPathItem {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  put?: OpenApiOperation;
  patch?: OpenApiOperation;
  delete?: OpenApiOperation;
}

export interface OpenApiSpec {
  openapi: string;
  info: { title: string; version: string };
  tags?: Array<{ name: string; description?: string }>;
  paths: Record<string, OpenApiPathItem>;
  components?: {
    schemas?: Record<string, OpenApiPropertySchema>;
  };
}

// ─── Analyzed endpoint ───────────────────────────────────────────────────────

export interface EndpointInfo {
  operationId: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  tags: string[];
  summary?: string;
  description?: string;
  intent: Intent;
  /** Resolved (no $ref) request body schema for POST/PUT/PATCH */
  requestBodySchema?: OpenApiSchema;
  /** Resolved (no $ref) successful response schema (first 2xx) */
  responseSchema?: OpenApiSchema;
  hasPathParams: boolean;
  pathParams: string[];
  /** True when the operation has at least one query parameter */
  hasQueryParams: boolean;
}

// ─── Form field definition ───────────────────────────────────────────────────

export type FieldType = 'input' | 'textarea' | 'select' | 'checkbox' | 'datepicker' | 'number';

export interface FormFieldDef {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  hidden?: boolean;
  /** Zod expression string, e.g. 'z.string().min(1)' */
  zodExpression: string;
}

// ─── Table column definition ─────────────────────────────────────────────────

export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'badge';

export interface ColumnDef {
  key: string;
  label: string;
  type: ColumnType;
}

// ─── Resource ────────────────────────────────────────────────────────────────

export interface ResourceInfo {
  /** Normalized resource name, PascalCase. E.g. 'Pet', 'Store' */
  name: string;
  /** Tag name as it appears in the spec. E.g. 'pet', 'store' */
  tag: string;
  /** Generated connector composable name. E.g. 'usePetsConnector' */
  composableName: string;

  endpoints: EndpointInfo[];

  /** The one endpoint detected as list (GET array) */
  listEndpoint?: EndpointInfo;
  /** The one endpoint detected as detail (GET single object) */
  detailEndpoint?: EndpointInfo;
  /** The one endpoint detected as create (POST) */
  createEndpoint?: EndpointInfo;
  /** The one endpoint detected as update (PUT/PATCH) */
  updateEndpoint?: EndpointInfo;
  /** The one endpoint detected as delete (DELETE) */
  deleteEndpoint?: EndpointInfo;

  /**
   * Inferred item model type name (e.g. 'Pet', 'Order') derived from the
   * response schema's original $ref component name. Used for SDK type imports.
   * Undefined when the response type is anonymous/primitive.
   */
  itemTypeName?: string;

  /** Columns inferred from the list/detail response schema */
  columns: ColumnDef[];

  /** Form fields inferred from the request body schema */
  formFields: {
    create?: FormFieldDef[];
    update?: FormFieldDef[];
  };

  /**
   * Zod schema object expression strings, ready to embed in generated code.
   * E.g. "z.object({\n  name: z.string().min(1),\n  ....\n})"
   */
  zodSchemas: {
    create?: string;
    update?: string;
  };
}

/** One entry per tag (or path-prefix fallback) */
export type ResourceMap = Map<string, ResourceInfo>;
