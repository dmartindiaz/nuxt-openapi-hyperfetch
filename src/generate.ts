import { execSync } from 'child_process';
import * as path from 'path';
import { p, logSuccess, logError } from './cli/logger.js';

/**
 * Check if Java is installed. Returns true if found, false otherwise.
 */
export function checkJavaInstalled(): boolean {
  try {
    execSync('java -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export const generateOpenApiFiles = (input: string, output: string) => {
  try {
    const inputPath = path.resolve(input);
    const outputPath = path.resolve(output);

    p.log.info(`Input: ${inputPath}`);
    p.log.info(`Output: ${outputPath}`);

    execSync(
      `npx @openapitools/openapi-generator-cli generate -i "${inputPath}" -g typescript-fetch -o "${outputPath}"`,
      { stdio: 'inherit' }
    );

    logSuccess(`Files generated successfully in ${outputPath}`);
  } catch (error) {
    logError(`Error generating files: ${String(error)}`);
    process.exit(1);
  }
};

export const generateHeyApiFiles = async (input: string, output: string) => {
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
