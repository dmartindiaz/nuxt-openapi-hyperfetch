export type GeneratorType = 'useFetch' | 'useAsyncData' | 'nuxtServer' | 'connectors';
export type ConnectorStrategy = 'manual' | 'hybrid';
export type ConnectorOperationName = 'getAll' | 'get' | 'create' | 'update' | 'delete';

export interface ConnectorOperationConfig {
  operationId?: string;
  path?: string;
}

export interface ConnectorResourceConfig {
  operations?: Partial<Record<ConnectorOperationName, ConnectorOperationConfig>>;
}

export interface ConnectorsConfig {
  enabled?: boolean;
  strategy?: ConnectorStrategy;
  resources?: Record<string, ConnectorResourceConfig>;
}

/** Shared configuration contract used by the generated OpenAPI module flow. */
export interface GeneratorConfig {
  /** Path or URL to OpenAPI specification */
  input?: string;
  /** Output directory for generated files */
  output?: string;
  /** Base URL for API requests */
  baseUrl?: string;
  /** Generation mode: client or server */
  mode?: 'client' | 'server';
  /** Generate only specific tags */
  tags?: string[];
  /** Exclude specific tags */
  excludeTags?: string[];
  /** Preview changes without writing files */
  dryRun?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Watch mode - regenerate on file changes */
  watch?: boolean;
  /** Generator types to use */
  generators?: GeneratorType[];
  /** Server route path (for nuxtServer mode) */
  serverRoutePath?: string;
  /** Enable BFF pattern (for nuxtServer mode) */
  enableBff?: boolean;
  /**
   * Generate headless UI connector composables on top of useAsyncData.
   * Requires useAsyncData to also be generated.
   */
  createUseAsyncDataConnectors?: boolean;
  /** Advanced connectors generation contract (manual/hybrid, custom resources, overloads). */
  connectors?: ConnectorsConfig;
}
