import * as path from 'path';
import { p, logSuccess, logError } from './cli/logger.js';

export const generateOpenApiFiles = async (input: string, output: string) => {
  try {
    const inputPath = path.resolve(input);
    const outputPath = path.resolve(output);

    p.log.info(`Input: ${inputPath}`);
    p.log.info(`Output: ${outputPath}`);

    const { createClient } = await import('@hey-api/openapi-ts');
    await createClient({
      input: inputPath,
      output: outputPath,
      plugins: ['@hey-api/typescript', '@hey-api/sdk'],
    });

    logSuccess(`Files generated successfully in ${outputPath}`);
  } catch (error) {
    logError(`Error generating files: ${String(error)}`);
    process.exit(1);
  }
};
