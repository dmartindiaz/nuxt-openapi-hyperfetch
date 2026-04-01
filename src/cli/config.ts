import fs from 'fs-extra';
import { join } from 'path';
import * as p from '@clack/prompts';
import type { GeneratorBackend, ConfigGenerator } from './types.js';

const { existsSync } = fs;

export type GeneratorType = 'useFetch' | 'useAsyncData' | 'nuxtServer' | 'connectors';
export type ComposableGeneratorType = 'useFetch' | 'useAsyncData' | 'nuxtServer';

export interface NormalizedGenerators {
  composables: ComposableGeneratorType[];
  generateConnectors: boolean;
}

const COMPOSABLE_GENERATOR_ORDER: readonly ComposableGeneratorType[] = [
  'useFetch',
  'useAsyncData',
  'nuxtServer',
] as const;

/**
 * Configuration options for the generator
 */
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
  /** Overwrite existing files without prompting */
  overwrite?: boolean;
  /** Preview changes without writing files */
  dryRun?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Watch mode - regenerate on file changes */
  watch?: boolean;
  /**
   * Generator types to use.
   * Semantics:
   * - 'connectors' implies 'useAsyncData' automatically
   * - ['useAsyncData'] generates only useAsyncData
   * - ['useAsyncData', 'connectors'] generates both
   */
  generators?: GeneratorType[];
  /** Server route path (for nuxtServer mode) */
  serverRoutePath?: string;
  /** Enable BFF pattern (for nuxtServer mode) */
  enableBff?: boolean;
  /** Generator backend: official (Java) or heyapi (Node.js) */
  backend?: GeneratorBackend;
  /**
   * Generation engine to use.
   * - 'openapi': @openapitools/openapi-generator-cli (requires Java 11+)
   * - 'heyapi': @hey-api/openapi-ts (Node.js native, no Java required)
   * When set, the CLI will not ask which engine to use.
   */
  generator?: ConfigGenerator;
  /**
   * Backward-compatible connectors flag.
   * Prefer `generators: ['connectors']` for declarative behavior.
   * When true, connectors are generated and useAsyncData is added automatically.
   * @default false
   */
  createUseAsyncDataConnectors?: boolean;
}

/**
 * Load configuration from nxh.config.js, nuxt-openapi-generator.config.js, or package.json
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<GeneratorConfig | null> {
  // Try different config file names
  const configFiles = [
    'nxh.config.js',
    'nxh.config.mjs',
    'nuxt-openapi-hyperfetch.js',
    'nuxt-openapi-hyperfetch.mjs',
  ];

  for (const configFile of configFiles) {
    const configPath = join(cwd, configFile);
    if (existsSync(configPath)) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const config = await import(`file://${configPath}`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        const exportedConfig = config.default || config;
        return exportedConfig as GeneratorConfig;
      } catch (error) {
        p.log.warn(`Failed to load config from ${configFile}: ${String(error)}`);
      }
    }
  }

  // Try package.json
  const packageJsonPath = join(cwd, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const packageJson = await import(`file://${packageJsonPath}`, {
        assert: { type: 'json' },
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (packageJson.default?.['nuxt-openapi-hyperfetch']) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return packageJson.default['nuxt-openapi-hyperfetch'] as GeneratorConfig;
      }
    } catch {
      // Silently ignore package.json errors
    }
  }

  return null;
}

/**
 * Merge CLI options with config file, CLI takes precedence
 */
export function mergeConfig(
  fileConfig: GeneratorConfig | null,
  cliOptions: Partial<GeneratorConfig>
): GeneratorConfig {
  return {
    ...fileConfig,
    ...cliOptions,
    // Handle arrays specially - CLI should override completely
    tags: cliOptions.tags || fileConfig?.tags,
    excludeTags: cliOptions.excludeTags || fileConfig?.excludeTags,
    generators: cliOptions.generators || fileConfig?.generators,
  };
}

/**
 * Parse comma-separated tags string into array
 */
export function parseTags(tagsString?: string): string[] | undefined {
  if (!tagsString) {
    return undefined;
  }
  return tagsString
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Parse generators string into array
 */
export function parseGenerators(generatorsString?: string): GeneratorType[] | undefined {
  if (!generatorsString) {
    return undefined;
  }
  const parts = generatorsString.split(',').map((g) => g.trim());
  return parts.filter((g): g is GeneratorType =>
    ['useFetch', 'useAsyncData', 'nuxtServer', 'connectors'].includes(g)
  );
}

/**
 * Normalize generator selection so connectors can be requested declaratively.
 * Rules:
 * - If `connectors` is selected, `useAsyncData` is added automatically.
 * - If `createUseAsyncDataConnectors` is true, connectors are enabled and
 *   `useAsyncData` is added automatically.
 */
export function normalizeGenerators(
  generators?: GeneratorType[],
  createUseAsyncDataConnectors?: boolean
): NormalizedGenerators {
  const requested = new Set(generators ?? []);
  const generateConnectors = requested.has('connectors') || createUseAsyncDataConnectors === true;

  const composables: ComposableGeneratorType[] = COMPOSABLE_GENERATOR_ORDER.filter((generator) =>
    requested.has(generator)
  );

  if (generateConnectors && !composables.includes('useAsyncData')) {
    composables.push('useAsyncData');
  }

  return { composables, generateConnectors };
}
