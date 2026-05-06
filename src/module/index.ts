import { defineNuxtModule, addImportsDir } from '@nuxt/kit';
import * as path from 'path';
import { generateOpenApiFiles } from '../generate.js';
import { generateUseFetchComposables } from '../generators/use-fetch/generator.js';
import { generateUseAsyncDataComposables } from '../generators/use-async-data/generator.js';
import { generateNuxtServerRoutes } from '../generators/nuxt-server/generator.js';
import { generateConnectors } from '../generators/connectors/generator.js';
import { normalizeGenerators } from '../config/generators.js';
import { isConnectorsRequested } from '../config/connectors.js';
import { createConsoleLogger } from '../utils/logger.js';
import type { ModuleOptions } from './types.js';

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-openapi-hyperfetch',
    configKey: 'openapi',
  },

  defaults: {
    output: './openapi',
    generators: ['useFetch', 'useAsyncData'],
    enableDevBuild: true,
    enableProductionBuild: true,
    enableAutoGeneration: false,
    enableAutoImport: true,
    createUseAsyncDataConnectors: false,
  },

  setup(options: ModuleOptions, nuxt) {
    // --- Guard: input is required ---
    if (!options.input) {
      console.warn(
        '[nuxt-openapi-hyperfetch] No input configured — skipping generation.\n' +
          "Add `openapi: { input: './swagger.yaml' }` to your nuxt.config.ts"
      );
      return;
    }

    const resolvedInput = path.resolve(nuxt.options.rootDir, options.input);
    const resolvedOutput = path.resolve(nuxt.options.rootDir, options.output!);
    const composablesOutputDir = path.join(resolvedOutput, 'composables');
    const normalized = normalizeGenerators(
      options.generators ?? ['useFetch', 'useAsyncData'],
      options.createUseAsyncDataConnectors
    );
    const selectedGenerators = normalized.composables;
    const generateConnectorsFlag = normalized.generateConnectors;
    const connectorsRequested = isConnectorsRequested(options);
    const logger = createConsoleLogger();

    // --- Core generation function ---
    const runGeneration = async () => {
      logger.log.info('Generating OpenAPI composables...');

      // 1. Generate OpenAPI SDK files
      await generateOpenApiFiles(resolvedInput, resolvedOutput);

      // 2. Run selected composable generators
      const genOptions = options.baseUrl ? { baseUrl: options.baseUrl } : undefined;

      if (selectedGenerators.includes('useFetch')) {
        await generateUseFetchComposables(
          resolvedOutput,
          path.join(composablesOutputDir, 'use-fetch'),
          genOptions,
          logger
        );
      }

      if (selectedGenerators.includes('useAsyncData')) {
        await generateUseAsyncDataComposables(
          resolvedOutput,
          path.join(composablesOutputDir, 'use-async-data'),
          genOptions,
          logger
        );
      }

      if (selectedGenerators.includes('nuxtServer')) {
        const serverRoutePath = path.resolve(
          nuxt.options.rootDir,
          options.serverRoutePath ?? 'server/routes/api'
        );
        await generateNuxtServerRoutes(
          resolvedOutput,
          serverRoutePath,
          { enableBff: options.enableBff },
          logger
        );
      }

      // 3. Generate headless connectors if requested (requires useAsyncData)
      if (
        (generateConnectorsFlag || connectorsRequested) &&
        selectedGenerators.includes('useAsyncData')
      ) {
        const connectorsOutputDir = path.join(composablesOutputDir, 'connectors');
        await generateConnectors(
          {
            inputSpec: resolvedInput,
            outputDir: connectorsOutputDir,
            composablesRelDir: '../use-async-data/composables',
            runtimeRelDir: '../../runtime',
            connectorsConfig: options.connectors,
          },
          logger
        );
      }
    };

    // --- Hooks: dev build / production build ---
    const isDev = nuxt.options.dev;
    if ((isDev && options.enableDevBuild) || (!isDev && options.enableProductionBuild)) {
      nuxt.hook('build:before', runGeneration);
    }

    // --- Hook: auto-regeneration on input file change (dev only) ---
    if (options.enableAutoGeneration) {
      nuxt.hook('builder:watch', async (event: string, watchedPath: string) => {
        const absWatchedPath = path.resolve(nuxt.options.rootDir, watchedPath);
        if (absWatchedPath === resolvedInput && (event === 'change' || event === 'add')) {
          logger.log.info(`Detected change in ${watchedPath}, regenerating composables...`);
          await runGeneration();
        }
      });
    }

    // --- Auto-import: register composable directories ---
    if (options.enableAutoImport !== false) {
      if (selectedGenerators.includes('useFetch')) {
        addImportsDir(path.join(composablesOutputDir, 'use-fetch', 'composables'));
      }
      if (selectedGenerators.includes('useAsyncData')) {
        addImportsDir(path.join(composablesOutputDir, 'use-async-data', 'composables'));
      }
      if (
        (generateConnectorsFlag || connectorsRequested) &&
        selectedGenerators.includes('useAsyncData')
      ) {
        addImportsDir(path.join(composablesOutputDir, 'connectors'));
      }
    }
  },
});

export type { ModuleOptions };
