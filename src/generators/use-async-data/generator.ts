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
import {
  generateComposableFile,
  generateRawComposableFile,
  generateIndexFile,
  type GenerateOptions,
} from './templates.js';
import type { MethodInfo } from './types.js';
import { p, logSuccess, logError } from '../../cli/logger.js';

/**
 * Main function to generate useAsyncData composables
 */
export async function generateUseAsyncDataComposables(
  inputDir: string,
  outputDir: string,
  options?: GenerateOptions
): Promise<void> {
  const mainSpinner = p.spinner();

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
      logError(`Error parsing ${fileName}: ${error}`);
    }
  }

  mainSpinner.stop(`Found ${allMethods.length} methods to generate`);

  if (allMethods.length === 0) {
    p.log.warn('No methods found to generate');
    return;
  }

  // 3. Clean and create output directories
  mainSpinner.start('Preparing output directories');
  const composablesDir = path.join(outputDir, 'composables');
  const runtimeDir = path.join(outputDir, 'runtime');
  const sharedRuntimeDir = path.join(outputDir, 'shared', 'runtime');
  await fs.emptyDir(composablesDir);
  await fs.ensureDir(runtimeDir);
  await fs.ensureDir(sharedRuntimeDir);
  mainSpinner.stop('Output directories ready');

  // 4. Copy runtime helpers
  mainSpinner.start('Copying runtime files');
  // Derive __dirname equivalent for ESM
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // When compiled, __dirname points to dist/generators/use-async-data/
  // We need to go back to src/ to get the original .ts files

  // Copy useApiAsyncData.ts
  const runtimeSource = path.resolve(
    __dirname,
    '../../../src/generators/use-async-data/runtime/useApiAsyncData.ts'
  );
  const runtimeDest = path.join(runtimeDir, 'useApiAsyncData.ts');
  await fs.copyFile(runtimeSource, runtimeDest);

  // Copy useApiAsyncDataRaw.ts
  const runtimeRawSource = path.resolve(
    __dirname,
    '../../../src/generators/use-async-data/runtime/useApiAsyncDataRaw.ts'
  );
  const runtimeRawDest = path.join(runtimeDir, 'useApiAsyncDataRaw.ts');
  await fs.copyFile(runtimeRawSource, runtimeRawDest);

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

  // 6. Generate each composable (normal + Raw if available)
  mainSpinner.start('Generating composables');
  let successCount = 0;
  let errorCount = 0;
  const generatedComposableNames: string[] = [];

  for (const method of allMethods) {
    // Generate normal version
    try {
      const code = generateComposableFile(method, relativePath, options);
      const formattedCode = await formatCode(code);
      const composableName = method.composableName.replace(/^useFetch/, 'useAsyncData');
      const fileName = `${composableName}.ts`;
      const filePath = path.join(composablesDir, fileName);

      await fs.writeFile(filePath, formattedCode, 'utf-8');
      generatedComposableNames.push(composableName);
      successCount++;
    } catch (error) {
      logError(`Error generating ${method.composableName}: ${error}`);
      errorCount++;
    }

    // Generate Raw version if available
    if (method.hasRawMethod && method.rawMethodName) {
      try {
        const code = generateRawComposableFile(method, relativePath, options);
        const formattedCode = await formatCode(code);
        const composableName = `useAsyncData${method.rawMethodName.replace(/Raw$/, '')}Raw`;
        const fileName = `${composableName}.ts`;
        const filePath = path.join(composablesDir, fileName);

        await fs.writeFile(filePath, formattedCode, 'utf-8');
        generatedComposableNames.push(composableName);
        successCount++;
      } catch (error) {
        logError(`Error generating ${method.composableName} (Raw): ${error}`);
        errorCount++;
      }
    }
  }

  // 7. Generate index.ts
  const indexCode = generateIndexFile(generatedComposableNames);
  const formattedIndex = await formatCode(indexCode);
  await fs.writeFile(path.join(outputDir, 'index.ts'), formattedIndex, 'utf-8');
  mainSpinner.stop(`Generated ${successCount} composables`);

  // 8. Summary
  if (errorCount > 0) {
    p.log.warn(`Completed with ${errorCount} error(s)`);
  }
  logSuccess(`Generated ${successCount} useAsyncData composable(s) in ${outputDir}`);
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
async function formatCode(code: string): Promise<string> {
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
    p.log.warn('Could not format code with Prettier');
    return code;
  }
}
