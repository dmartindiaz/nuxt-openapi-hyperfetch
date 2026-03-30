import type { GeneratorConfig } from '../cli/config.js';

/**
 * Configuration options for the nuxt-openapi-hyperfetch Nuxt module.
 * Extends the CLI GeneratorConfig so the same fields work in both nxh.config.js and nuxt.config.ts.
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
   * Generate headless UI connector composables on top of useAsyncData.
   * Connectors provide ready-made logic for tables, pagination, forms and delete actions.
   * Requires useAsyncData to also be in generators.
   * @default false
   */
  createUseAsyncDataConnectors?: boolean;
}
