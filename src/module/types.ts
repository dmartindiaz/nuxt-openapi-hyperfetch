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
   * Backward-compatible connectors flag.
   * Prefer `generators: ['connectors']` so module and CLI behave the same.
   * When true, connectors are generated and useAsyncData is added automatically.
   * @default false
   */
  createUseAsyncDataConnectors?: boolean;
}
