import * as path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { format } from 'prettier';
import {
  getApiFiles as getApiFilesOfficial,
  parseApiFile as parseApiFileOfficial,
} from './parser.js';
import {
  getApiFiles as getApiFilesHeyApi,
  parseApiFile as parseApiFileHeyApi,
} from '../shared/parsers/heyapi-parser.js';
import { generateComposableFile, generateIndexFile, type GenerateOptions } from './templates.js';
import type { MethodInfo } from './types.js';
import { type Logger, createClackLogger } from '../../cli/logger.js';

/**
 * Main function to generate useFetch composables
 */
export async function generateUseFetchComposables(
  inputDir: string,
  outputDir: string,
  options?: GenerateOptions,
  logger: Logger = createClackLogger()
): Promise<void> {
  const mainSpinner = logger.spinner();

  // Select parser based on chosen backend
  const getApiFiles = options?.backend === 'heyapi' ? getApiFilesHeyApi : getApiFilesOfficial;
  const parseApiFile = options?.backend === 'heyapi' ? parseApiFileHeyApi : parseApiFileOfficial;

  // 1. Get all API files
  mainSpinner.start('Scanning API files');
  const apiFiles = getApiFiles(inputDir);
  mainSpinner.stop(`Found ${apiFiles.length} API file(s)`);

  if (apiFiles.length === 0) {
    throw new Error('No API files found in the input directory');
  }

  // 2. Parse each API file
  mainSpinner.start('Parsing API files');
  const allMethods: MethodInfo[] = [];

  for (const file of apiFiles) {
    const fileName = path.basename(file);
    try {
      const apiInfo = parseApiFile(file);
      allMethods.push(...apiInfo.methods);
    } catch (error) {
      logger.log.error(`Error parsing ${fileName}: ${String(error)}`);
    }
  }

  mainSpinner.stop(`Found ${allMethods.length} methods to generate`);

  if (allMethods.length === 0) {
    logger.log.warn('No methods found to generate');
    return;
  }

  // 3. Clean and create output directories
  mainSpinner.start('Preparing output directories');
  const composablesDir = path.join(outputDir, 'composables');
  const runtimeDir = path.join(outputDir, 'runtime');
  const sharedRuntimeDir = path.join(path.dirname(outputDir), 'shared', 'runtime');
  await fs.emptyDir(composablesDir);
  await fs.ensureDir(runtimeDir);
  await fs.ensureDir(sharedRuntimeDir);
  mainSpinner.stop('Output directories ready');

  // 4. Copy runtime helpers
  mainSpinner.start('Copying runtime files');
  // Derive __dirname equivalent for ESM
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // When compiled, __dirname points to dist/generators/use-fetch/
  // We need to go back to src/ to get the original .ts files

  // Copy useApiRequest.ts
  const runtimeSource = path.resolve(
    __dirname,
    '../../../src/generators/use-fetch/runtime/useApiRequest.ts'
  );
  const runtimeDest = path.join(runtimeDir, 'useApiRequest.ts');
  await fs.copyFile(runtimeSource, runtimeDest);

  // Copy shared apiHelpers.ts
  const sharedHelpersSource = path.resolve(
    __dirname,
    '../../../src/generators/shared/runtime/apiHelpers.ts'
  );
  const sharedHelpersDest = path.join(sharedRuntimeDir, 'apiHelpers.ts');
  await fs.copyFile(sharedHelpersSource, sharedHelpersDest);
  mainSpinner.stop('Runtime files copied');

  // 5. Calculate relative import path from composables to APIs
  const relativePath = calculateRelativeImportPath(composablesDir, inputDir);

  // 6. Generate each composable
  mainSpinner.start('Generating composables');
  let successCount = 0;
  let errorCount = 0;

  for (const method of allMethods) {
    try {
      const code = generateComposableFile(method, relativePath, options);
      const formattedCode = await formatCode(code, logger);
      const fileName = `${method.composableName}.ts`;
      const filePath = path.join(composablesDir, fileName);

      await fs.writeFile(filePath, formattedCode, 'utf-8');
      successCount++;
    } catch (error) {
      logger.log.error(`Error generating ${method.composableName}: ${String(error)}`);
      errorCount++;
    }
  }

  // 7. Generate index.ts
  const indexCode = generateIndexFile(allMethods.map((m) => m.composableName));
  const formattedIndex = await formatCode(indexCode, logger);
  await fs.writeFile(path.join(outputDir, 'index.ts'), formattedIndex, 'utf-8');
  mainSpinner.stop(`Generated ${successCount} composables`);

  // 8. Summary
  if (errorCount > 0) {
    logger.log.warn(`Completed with ${errorCount} error(s)`);
  }
  logger.log.success(`Generated ${successCount} useFetch composable(s) in ${outputDir}`);
}

/**
 * Calculate relative import path from composables to APIs
 */
function calculateRelativeImportPath(composablesDir: string, inputDir: string): string {
  // Import from the root index.ts which exports apis, models, and runtime
  let relativePath = path.relative(composablesDir, inputDir);

  // Convert Windows paths to Unix-style
  relativePath = relativePath.replace(/\\/g, '/');

  // Ensure it starts with './' or '../'
  if (!relativePath.startsWith('.')) {
    relativePath = './' + relativePath;
  }

  // Remove .ts extension and trailing /
  relativePath = relativePath.replace(/\.ts$/, '').replace(/\/$/, '');

  return relativePath;
}

/**
 * Format code with Prettier
 */
async function formatCode(code: string, logger: Logger): Promise<string> {
  try {
    return await format(code, {
      parser: 'typescript',
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 80,
      tabWidth: 2,
    });
  } catch {
    logger.log.warn('Could not format code with Prettier');
    return code;
  }
}
