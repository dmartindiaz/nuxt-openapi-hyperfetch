#!/usr/bin/env node
import { Command } from 'commander';
import * as p from '@clack/prompts';
import { generateOpenApiFiles, generateHeyApiFiles, checkJavaInstalled } from './generate.js';
import { generateUseFetchComposables } from './generators/use-fetch/generator.js';
import { generateUseAsyncDataComposables } from './generators/use-async-data/generator.js';
import { generateNuxtServerRoutes } from './generators/nuxt-server/generator.js';
import { generateConnectors } from './generators/components/connector-generator/generator.js';
import {
  promptInitialInputs,
  promptInputPath,
  promptComposablesSelection,
  promptServerRoutePath,
  promptBffConfig,
  promptGeneratorBackend,
} from './cli/prompts.js';
import { MESSAGES } from './cli/messages.js';
import { displayLogo } from './cli/logo.js';
import { loadConfig, mergeConfig, parseTags, parseGenerators } from './cli/config.js';

const program = new Command();

program.name('nxh').description('Nuxt OpenAPI Hyperfetch generator').version('1.0.0');

interface GenerateOptions {
  input?: string;
  output?: string;
  baseUrl?: string;
  mode?: 'client' | 'server';
  tags?: string;
  excludeTags?: string;
  overwrite?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  watch?: boolean;
  generators?: string;
  serverRoutePath?: string;
  enableBff?: boolean;
  backend?: string;
}

program
  .command('generate')
  .description('Generate all nuxt files and composables from OpenAPI spec')
  .option('-i, --input <path>', 'OpenAPI file path or URL')
  .option('-o, --output <path>', 'Output directory')
  .option('--base-url <url>', 'Base URL for API requests')
  .option('--mode <mode>', 'Generation mode: client or server', 'client')
  .option('--tags <tags>', 'Generate only specific tags (comma-separated)')
  .option('--exclude-tags <tags>', 'Exclude specific tags (comma-separated)')
  .option('--overwrite', 'Overwrite existing files without prompting', false)
  .option('--dry-run', 'Preview changes without writing files', false)
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--watch', 'Watch mode - regenerate on file changes', false)
  .option('--generators <types>', 'Generators to use: useFetch,useAsyncData,nuxtServer')
  .option('--server-route-path <path>', 'Server route path (for nuxtServer mode)')
  .option('--enable-bff', 'Enable BFF pattern (for nuxtServer mode)', false)
  .option('--backend <type>', 'Generator backend: official (Java) or heyapi (Node.js)')
  .action(async (options: GenerateOptions) => {
    try {
      // Load config file
      const fileConfig = await loadConfig();

      if (options.verbose && fileConfig) {
        p.log.info('Loaded configuration from file');
      }

      // Parse and merge configuration
      const config = mergeConfig(fileConfig, {
        input: options.input,
        output: options.output,
        baseUrl: options.baseUrl,
        mode: options.mode,
        tags: parseTags(options.tags),
        excludeTags: parseTags(options.excludeTags),
        overwrite: options.overwrite,
        dryRun: options.dryRun,
        verbose: options.verbose,
        watch: options.watch,
        generators: parseGenerators(options.generators),
        serverRoutePath: options.serverRoutePath,
        enableBff: options.enableBff,
        backend:
          options.backend === 'official' || options.backend === 'heyapi'
            ? options.backend
            : undefined,
      });

      if (config.verbose) {
        console.log('Configuration:', config);
      }

      // Show logo and intro
      displayLogo();
      p.intro(MESSAGES.intro);

      if (config.dryRun) {
        p.log.warn('🔍 DRY RUN MODE - No files will be written');
      }

      // 0. Select generator engine (first question)
      // Resolve engine from config.generator (user-facing) or config.backend (CLI flag)
      // config.generator: 'openapi' | 'heyapi'  →  map 'openapi' to internal 'official'
      const resolvedBackend =
        config.generator === 'openapi'
          ? 'official'
          : config.generator === 'heyapi'
            ? 'heyapi'
            : config.backend;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const backend = await promptGeneratorBackend(resolvedBackend);

      // Check Java availability when official backend is selected
      if (backend === 'official' && !checkJavaInstalled()) {
        p.log.error(
          'Java not found. The OpenAPI Generator requires Java 11 or higher.\n' +
            'Install it from: https://adoptium.net\n' +
            'Or switch to @hey-api/openapi-ts which requires no Java.'
        );
        p.outro('Aborted.');
        process.exit(1);
      }

      // 1. Determine composables to generate FIRST
      let composables: ('useFetch' | 'useAsyncData' | 'nuxtServer')[];

      if (config.generators) {
        composables = config.generators;
        if (config.verbose) {
          console.log(`Using generators from config: ${composables.join(', ')}`);
        }
      } else {
        const result = await promptComposablesSelection();
        composables = result.composables;
      }

      if (composables.length === 0) {
        p.outro(MESSAGES.outro.noComposables);
        return;
      }

      // 2. Ask for paths based on which generators were selected
      const needsComposables = composables.some((c) => c === 'useFetch' || c === 'useAsyncData');
      const needsNuxtServer = composables.includes('nuxtServer');

      let inputPath: string;
      let outputPath: string;

      if (needsComposables) {
        // useFetch/useAsyncData: ask for both input (OpenAPI spec) and output (composables dir)
        const inputs = await promptInitialInputs(config.input, config.output);
        inputPath = inputs.inputPath;
        outputPath = inputs.outputPath;
      } else {
        // nuxtServer only: ask just for the OpenAPI spec, use default/config for output
        inputPath = await promptInputPath(config.input);
        outputPath = config.output ?? './swagger';
      }

      // 3. Ask for server route path if nuxtServer is selected
      let serverRoutePath = config.serverRoutePath || '';
      let enableBff = config.enableBff || false;

      if (needsNuxtServer && !config.serverRoutePath) {
        serverRoutePath = await promptServerRoutePath();
        const bffConfig = await promptBffConfig();
        enableBff = bffConfig.enableBff;
      }

      // Generate OpenAPI files
      const s = p.spinner();
      s.start(MESSAGES.steps.generatingOpenApi);

      if (!config.dryRun) {
        if (backend === 'heyapi') {
          await generateHeyApiFiles(inputPath, outputPath);
        } else {
          generateOpenApiFiles(inputPath, outputPath);
        }
        s.stop('OpenAPI files generated');
      } else {
        s.stop('Would generate OpenAPI files (skipped in dry-run)');
      }

      // Generate selected composables
      const composablesOutputDir = `${outputPath}/composables`;

      for (const composable of composables) {
        const spinner = p.spinner();
        spinner.start(`Generating ${composable}...`);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const generateOptions = { baseUrl: config.baseUrl, backend };

        try {
          switch (composable) {
            case 'useFetch':
              if (!config.dryRun) {
                await generateUseFetchComposables(
                  outputPath,
                  `${composablesOutputDir}/use-fetch`,
                  generateOptions
                );
                spinner.stop(`✓ Generated useFetch composables`);
              } else {
                spinner.stop(`Would generate useFetch composables (dry-run)`);
              }
              break;
            case 'useAsyncData':
              if (!config.dryRun) {
                await generateUseAsyncDataComposables(
                  outputPath,
                  `${composablesOutputDir}/use-async-data`,
                  generateOptions
                );
                spinner.stop(`✓ Generated useAsyncData composables`);
              } else {
                spinner.stop(`Would generate useAsyncData composables (dry-run)`);
              }
              break;
            case 'nuxtServer':
              if (!config.dryRun) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                await generateNuxtServerRoutes(outputPath, serverRoutePath, { enableBff, backend });
                spinner.stop(`✓ Generated Nuxt server routes`);
              } else {
                spinner.stop(`Would generate Nuxt server routes (dry-run)`);
              }
              break;
          }
        } catch (error) {
          spinner.stop(`✗ Failed to generate ${composable}`);
          throw error;
        }
      }

      if (config.dryRun) {
        p.outro('🔍 Dry run complete - no files were modified');
      } else {
        p.outro(MESSAGES.outro.success);
      }
    } catch (error) {
      p.log.error(`Error: ${String(error)}`);
      process.exit(1);
    }
  });

program
  .command('use-fetch')
  .description('Generate Nuxt useFetch composables from OpenAPI generated files')
  .option('-i, --input <path>', 'OpenAPI generated files directory')
  .option('-o, --output <path>', 'Output directory for composables')
  .action(async (options: { input?: string; output?: string }) => {
    if (!options.input || !options.output) {
      p.log.error('Error: You must provide both --input and --output');
      process.exit(1);
    }
    try {
      await generateUseFetchComposables(options.input, options.output);
    } catch (error) {
      p.log.error(`Error: ${String(error)}`);
      process.exit(1);
    }
  });

program
  .command('connectors')
  .description('Generate headless connector composables from an OpenAPI spec')
  .requiredOption('-i, --input <path>', 'Path to OpenAPI YAML or JSON spec')
  .requiredOption('-o, --output <path>', 'Output directory for connector composables')
  .option(
    '--composables-dir <relPath>',
    'Relative path from output dir to useAsyncData composables (default: ../use-async-data)'
  )
  .option(
    '--runtime-dir <relPath>',
    'Relative path from output dir where runtime helpers are copied (default: ../runtime)'
  )
  .action(
    async (options: {
      input: string;
      output: string;
      composablesDir?: string;
      runtimeDir?: string;
    }) => {
      try {
        displayLogo();
        p.intro('Generating connector composables…');
        await generateConnectors({
          inputSpec: options.input,
          outputDir: options.output,
          composablesRelDir: options.composablesDir,
          runtimeRelDir: options.runtimeDir,
        });
        p.outro('Done!');
      } catch (error) {
        p.log.error(`Error: ${String(error)}`);
        process.exit(1);
      }
    }
  );

program.parse();
