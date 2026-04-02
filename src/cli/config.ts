import fs from 'fs-extra';
import { join } from 'path';
import { pathToFileURL } from 'url';
import * as p from '@clack/prompts';
import type { GeneratorConfig, GeneratorType } from '../config/types.js';

const { existsSync } = fs;

async function importConfigModule(configPath: string): Promise<unknown> {
  try {
    const module = await import(pathToFileURL(configPath).href);
    return module.default || module;
  } catch (error) {
    if (!configPath.endsWith('.ts')) {
      throw error;
    }

    const { createJiti } = await import('jiti');
    const jiti = createJiti(import.meta.url, { interopDefault: true });
    const module = jiti(configPath);
    return module?.default || module;
  }
}

/**
 * Load configuration from nxh.config.{ts,js,mjs}, nuxt-openapi-hyperfetch.{ts,js,mjs}, or package.json
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<GeneratorConfig | null> {
  // Try different config file names
  const configFiles = [
    'nxh.config.ts',
    'nxh.config.js',
    'nxh.config.mjs',
    'nuxt-openapi-hyperfetch.ts',
    'nuxt-openapi-hyperfetch.js',
    'nuxt-openapi-hyperfetch.mjs',
  ];

  for (const configFile of configFiles) {
    const configPath = join(cwd, configFile);
    if (existsSync(configPath)) {
      try {
        const config = await importConfigModule(configPath);
        return config as GeneratorConfig;
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
