/**
 * All CLI prompts using @clack/prompts
 * Each function handles a specific prompt flow and returns typed data
 */
import * as p from '@clack/prompts';
import { checkCancellation, validateNonEmpty } from './utils.js';
import { MESSAGES, CHOICES, DEFAULTS } from './messages.js';
import type {
  InitialInputs,
  ComposablesSelection,
  BffConfig,
  ComposableType,
  GeneratorBackend,
} from './types.js';

/**
 * Ask which OpenAPI generator backend to use
 */
export async function promptGeneratorBackend(
  provided?: GeneratorBackend
): Promise<GeneratorBackend> {
  if (provided) {
    return provided;
  }
  const result = await p.select({
    message: MESSAGES.prompts.selectBackend,
    options: CHOICES.backends,
    initialValue: 'official' as const,
  });
  checkCancellation(result);
  return result as GeneratorBackend;
}

/**
 * Ask for input and output paths
 * Only asks for paths that weren't provided via CLI arguments
 */
export async function promptInitialInputs(
  inputProvided?: string,
  outputProvided?: string
): Promise<InitialInputs> {
  let inputPath = inputProvided;
  let outputPath = outputProvided;

  // Ask for input path if not provided
  if (!inputPath) {
    const result = await p.text({
      message: MESSAGES.prompts.inputPath,
      placeholder: DEFAULTS.inputPath,
      defaultValue: DEFAULTS.inputPath,
    });
    checkCancellation(result);
    inputPath = result as string;
  }

  // Ask for output path if not provided
  if (!outputPath) {
    const result = await p.text({
      message: MESSAGES.prompts.outputPath,
      placeholder: DEFAULTS.outputPath,
      defaultValue: DEFAULTS.outputPath,
    });
    checkCancellation(result);
    outputPath = result as string;
  }

  return { inputPath, outputPath };
}

/**
 * Ask for the input path only (used when only nuxtServer is selected)
 */
export async function promptInputPath(provided?: string): Promise<string> {
  if (provided) {
    return provided;
  }
  const result = await p.text({
    message: MESSAGES.prompts.inputPath,
    placeholder: DEFAULTS.inputPath,
    defaultValue: DEFAULTS.inputPath,
  });
  checkCancellation(result);
  return result as string;
}

/**
 * Ask which composables to generate (multiselect)
 * Allows user to select none, one, or multiple composables
 */
export async function promptComposablesSelection(): Promise<ComposablesSelection> {
  const result = await p.multiselect({
    message: MESSAGES.prompts.selectComposables,
    options: CHOICES.composables,
    initialValues: ['useFetch'], // useFetch checked by default
    required: false, // Allow empty selection
  });
  checkCancellation(result);

  return { composables: result as ('useFetch' | 'useAsyncData' | 'nuxtServer')[] };
}

/**
 * Ask for server route path
 * If user selects 'custom', prompts for custom path
 * Returns the final path to use
 */
export async function promptServerRoutePath(): Promise<string> {
  // First, ask for the path type
  const pathResult = await p.select({
    message: MESSAGES.prompts.serverPath,
    options: CHOICES.serverPaths,
    initialValue: DEFAULTS.serverPath,
  });
  checkCancellation(pathResult);

  // If custom selected, ask for custom path
  if (pathResult === 'custom') {
    const customResult = await p.text({
      message: MESSAGES.prompts.customPath,
      placeholder: DEFAULTS.customPath,
      defaultValue: DEFAULTS.customPath,
      validate: validateNonEmpty,
    });
    checkCancellation(customResult);
    return customResult as string;
  }

  return pathResult as string;
}

/**
 * Ask about BFF (Backend for Frontend) support
 * Returns whether BFF should be enabled
 */
export async function promptBffConfig(): Promise<BffConfig> {
  const result = await p.confirm({
    message: MESSAGES.prompts.enableBff,
    initialValue: DEFAULTS.enableBff,
  });
  checkCancellation(result);

  return { enableBff: result as boolean };
}

/**
 * Ask whether to generate headless UI connectors on top of useAsyncData.
 * Only called when useAsyncData was selected and no config value is present.
 */
export async function promptConnectors(): Promise<boolean> {
  const result = await p.confirm({
    message: CHOICES.connectorsPrompt,
    initialValue: false,
  });
  checkCancellation(result);
  return result as boolean;
}
