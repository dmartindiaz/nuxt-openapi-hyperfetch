/**
 * Types for the Connector Generator — Fase 3.
 *
 * The Connector Generator reads the ResourceMap produced by the Schema Analyzer
 * and writes one `use{Resource}Connector.ts` file per resource.
 */

export interface ConnectorGeneratorOptions {
  /** Absolute or relative path to the OpenAPI YAML/JSON spec */
  inputSpec: string;
  /** Directory where connector files will be written. E.g. ./composables/connectors */
  outputDir: string;
  /**
   * Directory where the useAsyncData composables live, expressed as a path
   * relative to outputDir. Defaults to '../use-async-data'.
   */
  composablesRelDir?: string;
  /**
   * Directory where runtime helpers will be copied to, expressed relative to
   * outputDir. Defaults to '../runtime'.
   */
  runtimeRelDir?: string;
}

export interface ConnectorFileInfo {
  /** PascalCase resource name. E.g. 'Pet' */
  resourceName: string;
  /** Generated composable function name. E.g. 'usePetsConnector' */
  composableName: string;
  /** Output filename (kebab-case). E.g. 'use-pets-connector.ts' */
  fileName: string;
  /** Formatted TypeScript source ready to be written to disk */
  content: string;
}
