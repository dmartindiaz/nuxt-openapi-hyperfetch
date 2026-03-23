/**
 * Centralized messages and text content for CLI
 */
import type { GeneratorBackend } from './types.js';

/**
 * Main messages used throughout the CLI
 */
export const MESSAGES = {
  // Intro/Outro messages
  intro: '🎨 Nuxt Swagger Generator',
  outro: {
    success: '🎉 All done! Your files are ready.',
    cancelled: '👋 Operation cancelled.',
    noComposables: '✓ OpenAPI files generated successfully!\nNo composables selected.',
  },

  // Prompt messages
  prompts: {
    selectBackend: 'Select the OpenAPI code generator:',
    inputPath: 'Enter the path to your OpenAPI/Swagger file:',
    outputPath: 'Enter the output directory for generated files:',
    selectComposables: 'Select which composables you want to generate:',
    serverPath: 'Where do you want to generate server routes?',
    customPath: 'Enter custom server route path:',
    enableBff: 'Enable BFF (Backend for Frontend) with transformers and auth?',
  },

  // Process step messages
  steps: {
    generatingOpenApi: 'Generating OpenAPI files',
  },
};

/**
 * Predefined choices for select/multiselect prompts
 */
export const CHOICES = {
  // Generator backend options
  backends: [
    {
      value: 'official' as const,
      label: 'OpenAPI Generator (official)',
      hint: 'Requires Java 11+',
    },
    {
      value: 'heyapi' as const,
      label: '@hey-api/openapi-ts (Node.js)',
      hint: 'No Java required',
    },
  ] satisfies { value: GeneratorBackend; label: string; hint: string }[],

  // Composables selection
  composables: [
    {
      value: 'useFetch',
      label: 'useFetch - Nuxt useFetch composables',
      hint: 'Recommended for most use cases',
    },
    {
      value: 'useAsyncData',
      label: 'useAsyncData - Nuxt useAsyncData composables',
    },
    {
      value: 'nuxtServer',
      label: 'Nuxt Server Routes - Generate server/api/* proxy routes',
    },
  ],

  // Server path options
  serverPaths: [
    {
      value: 'server/api',
      label: 'server/api (recommended)',
      hint: 'Standard Nuxt server directory',
    },
    {
      value: 'src/server/api',
      label: 'src/server/api',
    },
    {
      value: 'custom',
      label: 'Custom path...',
    },
  ],
};

/**
 * Default values for prompts
 */
export const DEFAULTS = {
  inputPath: './swagger.yaml',
  outputPath: './swagger',
  serverPath: 'server/api',
  customPath: './server/api',
  enableBff: true,
};
