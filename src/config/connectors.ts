import type { ConnectorsConfig, GeneratorConfig, GeneratorType } from './types.js';

export type RuntimeComposableGenerator = 'useFetch' | 'useAsyncData' | 'nuxtServer';

export function hasConnectorsConfig(connectors?: ConnectorsConfig): boolean {
  if (!connectors) {
    return false;
  }

  if (connectors.enabled === true) {
    return true;
  }

  if (connectors.strategy !== undefined) {
    return true;
  }

  return Object.keys(connectors.resources ?? {}).length > 0;
}

export function isConnectorsRequested(
  config: Pick<GeneratorConfig, 'generators' | 'createUseAsyncDataConnectors' | 'connectors'>
): boolean {
  return (
    config.createUseAsyncDataConnectors === true ||
    (config.generators ?? []).includes('connectors') ||
    hasConnectorsConfig(config.connectors)
  );
}

export function toRuntimeComposableGenerators(
  generators?: GeneratorType[]
): RuntimeComposableGenerator[] {
  return (generators ?? []).filter(
    (g): g is RuntimeComposableGenerator =>
      g === 'useFetch' || g === 'useAsyncData' || g === 'nuxtServer'
  );
}

export function ensureUseAsyncDataForConnectors(
  composables: RuntimeComposableGenerator[],
  connectorsRequested: boolean
): RuntimeComposableGenerator[] {
  if (!connectorsRequested || composables.includes('useAsyncData')) {
    return composables;
  }
  return [...composables, 'useAsyncData'];
}
