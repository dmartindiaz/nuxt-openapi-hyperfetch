import type { GeneratorConfig } from '../config/types.js';

/**
 * Configuration options for the nuxt-openapi-hyperfetch Nuxt module.
 * Extends the shared generator config used by the Nuxt module.
 */
export interface ModuleOptions extends GeneratorConfig {
  /**
   * Generate composables before the dev server starts.
   * @default true
   */
  enableDevBuild?: boolean;

  /**
   * Generate composables before the production build.
   * @default true
   */
  enableProductionBuild?: boolean;

  /**
   * Watch the input file and regenerate composables on change (dev mode only).
   * @default false
   */
  enableAutoGeneration?: boolean;

  /**
   * Automatically import generated useFetch/useAsyncData composables project-wide.
   * @default true
   */
  enableAutoImport?: boolean;

  /**
   * Backward-compatible connectors flag
   * Prefer `generators: ['connectors']` so the module stays declarative
   * When true, connectors are generated and useAsyncData is added automatically.
   * @default false
   */
  createUseAsyncDataConnectors?: boolean;
}
