/**
 * Types for the new Connector Generator.
 *
 * The Connector Generator reads the ResourceMap produced by the Schema Analyzer
 * and writes one `use{Resource}Connector.ts` file per resource using $fetch for mutations.
 */

import type { ConnectorsConfig } from '../../config/types.js';

export interface ConnectorGeneratorOptions {
  /** Absolute or relative path to the OpenAPI YAML/JSON spec */
  inputSpec: string;
  /** Directory where connector files will be written. E.g. ./composables/connectors */
  outputDir: string;
  /**
   * Directory where the useAsyncData composables live (only used for getAll/list),
   * expressed as a path relative to outputDir. Defaults to '../use-async-data/composables'.
   */
  composablesRelDir?: string;
  /**
   * Directory where runtime helpers will be copied to, expressed relative to
   * outputDir. Defaults to '../runtime'.
   */
  runtimeRelDir?: string;
  /**
   * Base URL for API requests. If not provided, connectors will read from
   * useRuntimeConfig().public.apiBaseUrl at runtime.
   */
  baseUrl?: string;
  /** Advanced connectors configuration (manual/hybrid, custom resources, overloads). */
  connectorsConfig?: ConnectorsConfig;
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
