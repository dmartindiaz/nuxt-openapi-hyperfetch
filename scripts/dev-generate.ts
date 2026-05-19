import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { generateOpenApiFiles } from '../src/generate.ts';
import { generateConnectors } from '../src/generators/connectors/generator.ts';
import { generateUseFetchComposables } from '../src/generators/use-fetch/generator.ts';
import { generateUseAsyncDataComposables } from '../src/generators/use-async-data/generator.ts';
import { createConsoleLogger, logError, logInfo, logSuccess } from '../src/utils/logger.ts';

const DEFAULT_DEV_OPENAPI_FILES = ['dev-openapi.json', 'dev-openapi.yaml', 'dev-openapi.yml'] as const;

type DevCommand = 'openapi' | 'use-fetch' | 'use-async-data' | 'connectors' | 'all' | 'help';

interface DevOptions {
  input?: string;
  output: string;
  baseUrl?: string;
  skipOpenApi: boolean;
}

function resolveDefaultInput(cwd: string): string {
  for (const candidate of DEFAULT_DEV_OPENAPI_FILES) {
    const candidatePath = path.resolve(cwd, candidate);
    if (existsSync(candidatePath)) {
      return `./${candidate}`;
    }
  }

  throw new Error(
    `No default OpenAPI development file found. Expected one of: ${DEFAULT_DEV_OPENAPI_FILES.join(', ')}`
  );
}

function printHelp() {
  console.log(`
Usage:
  npm run dev:generate:all
  npm run dev:generate:openapi
  npm run dev:generate:use-fetch
  npm run dev:generate:use-async-data
  npm run dev:generate:connectors

Extra args:
  --input <path>       OpenAPI spec path. Default: first match of ./dev-openapi.json, ./dev-openapi.yaml, ./dev-openapi.yml
  --output <path>      Generated output root. Default: ./openapi
  --base-url <url>     Base URL injected into generated composables
  --skip-openapi       Reuse existing generated OpenAPI output

Examples:
  npm run dev:generate:use-fetch -- --skip-openapi
  npm run dev:generate:all -- --input ./dev-openapi.json --output ./openapi
  npm run dev:generate:use-async-data -- --base-url https://api.example.com
  npm run dev:generate:connectors -- --skip-openapi
`);
}

function parseCommand(raw?: string): DevCommand {
  switch (raw) {
    case 'openapi':
    case 'use-fetch':
    case 'use-async-data':
    case 'connectors':
    case 'all':
      return raw;
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      return 'help';
    default:
      throw new Error(`Unknown command: ${raw}`);
  }
}

function parseOptions(args: string[]): DevOptions {
  const options: DevOptions = {
    output: './openapi',
    skipOpenApi: false,
  };

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];

    switch (arg) {
      case '--input':
        options.input = args[++index] ?? options.input;
        break;
      case '--output':
        options.output = args[++index] ?? options.output;
        break;
      case '--base-url':
        options.baseUrl = args[++index] ?? options.baseUrl;
        break;
      case '--skip-openapi':
        options.skipOpenApi = true;
        break;
      case '--help':
      case '-h':
        return options;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

async function run() {
  const [rawCommand, ...rawArgs] = process.argv.slice(2);
  const command = parseCommand(rawCommand);

  if (command === 'help') {
    printHelp();
    return;
  }

  const options = parseOptions(rawArgs);
  const logger = createConsoleLogger();
  const resolvedInputOption = options.input ?? resolveDefaultInput(process.cwd());
  const inputPath = path.resolve(process.cwd(), resolvedInputOption);
  const outputPath = path.resolve(process.cwd(), options.output);
  const generateOptions = options.baseUrl ? { baseUrl: options.baseUrl } : undefined;

  logInfo(`Dev command: ${command}`);
  logInfo(`Spec: ${inputPath}`);
  logInfo(`Output: ${outputPath}`);

  const shouldGenerateOpenApi = !options.skipOpenApi || command === 'openapi';

  if (shouldGenerateOpenApi) {
    await generateOpenApiFiles(inputPath, outputPath);
  } else {
    logInfo('Skipping OpenAPI generation and reusing existing output');
  }

  if (command === 'openapi') {
    logSuccess('OpenAPI output generated');
    return;
  }

  if (command === 'use-fetch' || command === 'all') {
    await generateUseFetchComposables(
      outputPath,
      path.join(outputPath, 'composables', 'use-fetch'),
      generateOptions,
      logger
    );
  }

  if (command === 'use-async-data' || command === 'connectors' || command === 'all') {
    await generateUseAsyncDataComposables(
      outputPath,
      path.join(outputPath, 'composables', 'use-async-data'),
      generateOptions,
      logger
    );
  }

  if (command === 'connectors' || command === 'all') {
    await generateConnectors(
      {
        inputSpec: inputPath,
        outputDir: path.join(outputPath, 'composables', 'connectors'),
        composablesRelDir: '../use-async-data/composables',
        runtimeRelDir: '../../runtime',
        baseUrl: options.baseUrl,
      },
      logger
    );
  }

  logSuccess(`Development generation finished for ${command}`);
}

run().catch((error) => {
  logError(String(error));
  process.exit(1);
});
