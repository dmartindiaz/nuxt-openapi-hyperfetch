import type { GeneratorType } from './types.js';

export type ComposableGeneratorType = 'useFetch' | 'useAsyncData' | 'nuxtServer';

export interface NormalizedGenerators {
  composables: ComposableGeneratorType[];
  generateConnectors: boolean;
}

const COMPOSABLE_GENERATOR_ORDER: readonly ComposableGeneratorType[] = [
  'useFetch',
  'useAsyncData',
  'nuxtServer',
] as const;

export function normalizeGenerators(
  generators?: GeneratorType[],
  createUseAsyncDataConnectors?: boolean
): NormalizedGenerators {
  const requested = new Set(generators ?? []);
  const generateConnectors = requested.has('connectors') || createUseAsyncDataConnectors === true;

  const composables: ComposableGeneratorType[] = COMPOSABLE_GENERATOR_ORDER.filter((generator) =>
    requested.has(generator)
  );

  if (generateConnectors && !composables.includes('useAsyncData')) {
    composables.push('useAsyncData');
  }

  return { composables, generateConnectors };
}
