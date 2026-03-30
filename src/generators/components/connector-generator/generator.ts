import * as path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { format } from 'prettier';
import { analyzeSpec } from '../schema-analyzer/index.js';
import {
  generateConnectorFile,
  connectorFileName,
  generateConnectorIndexFile,
} from './templates.js';
import type { ConnectorGeneratorOptions } from './types.js';
import { type Logger, createClackLogger } from '../../../cli/logger.js';

// Runtime files that must be copied to the user's project
const RUNTIME_FILES = [
  'connector-types.ts',
  'useListConnector.ts',
  'useDetailConnector.ts',
  'useFormConnector.ts',
  'useDeleteConnector.ts',
  'zod-error-merger.ts',
] as const;

/**
 * Format TypeScript source with Prettier.
 * Falls back to unformatted code on error.
 */
async function formatCode(code: string, logger: Logger): Promise<string> {
  try {
    return await format(code, { parser: 'typescript' });
  } catch (error) {
    logger.log.warn(`Prettier formatting failed: ${String(error)}`);
    return code;
  }
}

/**
 * Generate headless connector composables from an OpenAPI spec.
 *
 * Steps:
 *  1. Analyze the spec → ResourceMap (Schema Analyzer)
 *  2. For each resource: generate connector source, format, write
 *  3. Write an index barrel file
 *  4. Copy runtime helpers to the user's project
 */
export async function generateConnectors(
  options: ConnectorGeneratorOptions,
  logger: Logger = createClackLogger()
): Promise<void> {
  const spinner = logger.spinner();

  const outputDir = path.resolve(options.outputDir);
  const composablesRelDir = options.composablesRelDir ?? '../use-async-data';
  const runtimeRelDir = options.runtimeRelDir ?? '../runtime';

  // ── 1. Analyze spec ───────────────────────────────────────────────────────
  spinner.start('Analyzing OpenAPI spec');
  const resourceMap = analyzeSpec(options.inputSpec);
  spinner.stop(`Found ${resourceMap.size} resource(s)`);

  if (resourceMap.size === 0) {
    logger.log.warn('No resources found in spec — nothing to generate');
    return;
  }

  // ── 2. Prepare output directory ───────────────────────────────────────────
  // emptyDir (not ensureDir) so stale connectors from previous runs are removed.
  // If the resource got renamed in the spec the old file would otherwise linger.
  spinner.start('Preparing output directory');
  await fs.emptyDir(outputDir);
  spinner.stop('Output directory ready');

  // ── 3. Generate connector files ───────────────────────────────────────────
  spinner.start('Generating connector composables');
  let successCount = 0;
  let errorCount = 0;
  const generatedNames: string[] = [];

  for (const resource of resourceMap.values()) {
    try {
      const code = generateConnectorFile(resource, composablesRelDir, '../..', runtimeRelDir);
      const formatted = await formatCode(code, logger);
      const fileName = connectorFileName(resource.composableName);
      const filePath = path.join(outputDir, fileName);

      await fs.writeFile(filePath, formatted, 'utf-8');
      generatedNames.push(resource.composableName);
      successCount++;
    } catch (error) {
      logger.log.error(`Error generating ${resource.composableName}: ${String(error)}`);
      errorCount++;
    }
  }

  spinner.stop(`Generated ${successCount} connector(s)`);

  // ── 4. Write barrel index ─────────────────────────────────────────────────
  if (generatedNames.length > 0) {
    try {
      const indexCode = generateConnectorIndexFile(generatedNames);
      const formattedIndex = await formatCode(indexCode, logger);
      await fs.writeFile(path.join(outputDir, 'index.ts'), formattedIndex, 'utf-8');
    } catch (error) {
      logger.log.warn(`Could not write connector index: ${String(error)}`);
    }
  }

  // ── 5. Copy runtime helpers ───────────────────────────────────────────────
  // Runtime files (useListConnector, useFormConnector …) live in src/ and must
  // be physical .ts files in the user's project so Nuxt/Vite can type-check them.
  //
  // Path resolution trick:
  //   •  During development (ts-node / tsx):  __dirname ≈ src/generators/components/connector-generator/
  //   •  After `tsc` build:                   __dirname ≈ dist/generators/components/connector-generator/
  //
  // In both cases we need to land in src/generators/shared/runtime/, so we step
  // up 4 levels and then re-enter src/ explicitly.  This works because the repo
  // always keeps src/ alongside dist/ in the published package (see "files" in package.json).
  spinner.start('Copying runtime files');
  const runtimeDir = path.resolve(outputDir, runtimeRelDir);
  await fs.ensureDir(runtimeDir); // ensureDir (not emptyDir) — other runtime files may exist there

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const runtimeSrcDir = path.resolve(__dirname, '../../../../src/generators/shared/runtime');

  for (const file of RUNTIME_FILES) {
    const src = path.join(runtimeSrcDir, file);
    const dest = path.join(runtimeDir, file);
    await fs.copyFile(src, dest);
  }

  spinner.stop('Runtime files copied');

  // ── 6. Summary ────────────────────────────────────────────────────────────
  if (errorCount > 0) {
    logger.log.warn(`Completed with ${errorCount} error(s)`);
  }
  logger.log.success(`Generated ${successCount} connector(s) in ${outputDir}`);
}
