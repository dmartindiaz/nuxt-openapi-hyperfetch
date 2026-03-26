import * as path from 'path';
import fs from 'fs-extra';
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
  generateServerRouteFile,
  generateRouteFilePath,
  generateRoutesIndexFile,
} from './templates.js';
import {
  generateAuthContextStub,
  generateAuthTypesStub,
  generateTransformerStub,
  generateTransformerExamples,
  generateBffReadme,
} from './bff-templates.js';
import type { MethodInfo } from './types.js';
import { type Logger, createClackLogger } from '../../cli/logger.js';

/**
 * Main function to generate Nuxt Server Routes
 */
export async function generateNuxtServerRoutes(
  inputDir: string,
  serverRoutePath: string,
  options?: {
    enableBff?: boolean;
    backend?: string;
  },
  logger: Logger = createClackLogger()
): Promise<void> {
  const mainSpinner = logger.spinner();

  // Select parser based on chosen backend
  const getApiFiles = options?.backend === 'heyapi' ? getApiFilesHeyApi : getApiFilesOfficial;
  const parseApiFile = options?.backend === 'heyapi' ? parseApiFileHeyApi : parseApiFileOfficial;

  const enableBff = options?.enableBff ?? false;

  if (enableBff) {
    logger.log.info('BFF Mode: Enabled (transformers + auth)');
  }

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

  mainSpinner.stop(`Found ${allMethods.length} routes to generate`);

  if (allMethods.length === 0) {
    logger.log.warn('No methods found to generate');
    return;
  }

  // 3. Clean and create output directory
  mainSpinner.start('Preparing output directory');
  await fs.emptyDir(serverRoutePath);
  mainSpinner.stop('Output directory ready');

  // 4. Generate BFF structure if enabled
  if (enableBff) {
    await generateBffStructure(allMethods, serverRoutePath, inputDir, logger);
  }

  // 5. Calculate relative import path from server routes to APIs
  const relativePath = calculateRelativeImportPath(serverRoutePath, inputDir);

  // 6. Generate each server route
  mainSpinner.start('Generating server routes');
  let successCount = 0;
  let errorCount = 0;

  for (const method of allMethods) {
    try {
      // Extract resource name from path
      const resource = extractResourceFromPath(method.path);

      const code = generateServerRouteFile(method, relativePath, {
        enableBff: enableBff,
        resource: resource,
      });
      const formattedCode = await formatCode(code, logger);
      const routeFilePath = generateRouteFilePath(method);
      const fullPath = path.join(serverRoutePath, routeFilePath);

      // Ensure directory exists
      await fs.ensureDir(path.dirname(fullPath));

      await fs.writeFile(fullPath, formattedCode, 'utf-8');
      successCount++;
    } catch (error) {
      logger.log.error(`Error generating ${method.path} [${method.httpMethod}]: ${String(error)}`);
      errorCount++;
    }
  }
  mainSpinner.stop(`Generated ${successCount} server routes`);

  // 7. Generate configuration files
  mainSpinner.start('Generating configuration files');

  // Generate routes index (documentation)
  const routesIndexCode = generateRoutesIndexFile(allMethods);
  const formattedRoutesIndex = await formatCode(routesIndexCode, logger);
  await fs.writeFile(path.join(serverRoutePath, '_routes.ts'), formattedRoutesIndex, 'utf-8');
  mainSpinner.stop('Configuration files generated');

  // 8. Summary and Next Steps
  if (errorCount > 0) {
    logger.log.warn(`Completed with ${errorCount} error(s)`);
  }
  logger.log.success(`Generated ${successCount} server route(s) in ${serverRoutePath}`);

  // Build next steps message
  let nextSteps = '1. Configure API_BASE_URL and API_SECRET in your .env\n';
  nextSteps += '2. Update nuxt.config.ts with runtimeConfig (add apiBaseUrl and apiSecret)';

  if (enableBff) {
    nextSteps += '\n3. Implement authentication in server/auth/context.ts';
    nextSteps += '\n4. Add business logic to transformers in server/bff/transformers/';
    nextSteps += '\n5. See server/bff/README.md for BFF documentation';
    nextSteps += '\n6. Start your Nuxt dev server and test the routes';
  } else {
    nextSteps += '\n3. Start your Nuxt dev server and test the routes';
  }

  logger.note(nextSteps, 'Next steps');
}

/**
 * Calculate relative import path from server routes to APIs
 */
function calculateRelativeImportPath(serverRoutePath: string, inputDir: string): string {
  // Use Nuxt's ~ alias (project root) so the path is stable regardless of serverRoutePath depth
  const projectRoot = process.cwd();
  const relativeInputDir = path.relative(projectRoot, path.resolve(inputDir));
  // Convert Windows paths to Unix-style
  return '~/' + relativeInputDir.replace(/\\/g, '/');
}

/**
 * Format code with Prettier
 */
async function formatCode(code: string, logger: Logger): Promise<string> {
  try {
    return await format(code, {
      parser: 'typescript',
      semi: false,
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 100,
    });
  } catch {
    logger.log.warn('Prettier formatting failed, using unformatted code');
    return code;
  }
}

/**
 * Generate BFF structure (auth + transformers)
 */
async function generateBffStructure(
  allMethods: MethodInfo[],
  serverRoutePath: string,
  inputDir: string,
  logger: Logger
): Promise<void> {
  const bffSpinner = logger.spinner();
  bffSpinner.start('Generating BFF structure (auth + transformers)');

  const serverRoot = path.dirname(serverRoutePath);

  // 1. Generate auth files (only if they don't exist)
  const authDir = path.join(serverRoot, 'auth');
  await fs.ensureDir(authDir);

  const authContextPath = path.join(authDir, 'context.ts');
  if (!fs.existsSync(authContextPath)) {
    const authContextCode = generateAuthContextStub();
    const formattedAuthContext = await formatCode(authContextCode, logger);
    await fs.writeFile(authContextPath, formattedAuthContext, 'utf-8');
  }

  const authTypesPath = path.join(authDir, 'types.ts');
  if (!fs.existsSync(authTypesPath)) {
    const authTypesCode = generateAuthTypesStub();
    const formattedAuthTypes = await formatCode(authTypesCode, logger);
    await fs.writeFile(authTypesPath, formattedAuthTypes, 'utf-8');
  }

  // 2. Generate transformer stubs (only if they don't exist)
  const bffDir = path.join(serverRoot, 'bff');
  const transformersDir = path.join(bffDir, 'transformers');
  await fs.ensureDir(transformersDir);

  // Group methods by resource
  const methodsByResource = new Map<string, MethodInfo[]>();
  for (const method of allMethods) {
    const resource = extractResourceFromPath(method.path);
    if (!methodsByResource.has(resource)) {
      methodsByResource.set(resource, []);
    }
    methodsByResource.get(resource)!.push(method);
  }

  // Generate transformer for each resource
  for (const [resource, methods] of methodsByResource.entries()) {
    const transformerPath = path.join(transformersDir, `${resource}.ts`);
    if (!fs.existsSync(transformerPath)) {
      const transformerCode = generateTransformerStub(resource, methods, inputDir);
      const formattedTransformer = await formatCode(transformerCode, logger);
      await fs.writeFile(transformerPath, formattedTransformer, 'utf-8');
    }
  }

  // 3. Generate examples file (always regenerated)
  const examplesPath = path.join(bffDir, '_transformers.example.ts');
  const examplesCode = generateTransformerExamples();
  const formattedExamples = await formatCode(examplesCode, logger);
  await fs.writeFile(examplesPath, formattedExamples, 'utf-8');

  // 4. Generate BFF README (always regenerated)
  const bffReadmePath = path.join(bffDir, 'README.md');
  const bffReadmeCode = generateBffReadme();
  await fs.writeFile(bffReadmePath, bffReadmeCode, 'utf-8');

  bffSpinner.stop('BFF structure generated');
}

/**
 * Extract resource name from API path
 * Examples:
 *   /pet -> pet
 *   /pet/{id} -> pet
 *   /store/inventory -> store
 *   /user/login -> user
 */
function extractResourceFromPath(path: string): string {
  // Remove leading slash
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  // Get first segment
  const firstSegment = cleanPath.split('/')[0];

  // Remove any path params
  return firstSegment.replace(/\{[^}]+\}/g, '').toLowerCase();
}
