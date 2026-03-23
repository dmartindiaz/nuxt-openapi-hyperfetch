/**
 * TypeScript types for CLI prompts and responses
 */

/**
 * Generator backend selector
 */
export type GeneratorBackend = 'official' | 'heyapi';

/**
 * Initial input and output paths
 */
export interface InitialInputs {
  inputPath: string;
  outputPath: string;
}

/**
 * Composables selection (checkbox response)
 */
export interface ComposablesSelection {
  composables: Array<'useFetch' | 'useAsyncData' | 'nuxtServer'>;
}

/**
 * Server route path configuration
 */
export interface ServerRouteConfig {
  serverPath: string;
  customPath?: string;
}

/**
 * BFF (Backend for Frontend) configuration
 */
export interface BffConfig {
  enableBff: boolean;
}

/**
 * Valid composable types
 */
export type ComposableType = 'useFetch' | 'useAsyncData' | 'nuxtServer';
