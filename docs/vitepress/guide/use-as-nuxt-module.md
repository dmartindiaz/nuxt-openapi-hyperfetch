# Use as Nuxt Module

This package is configured directly in `nuxt.config.ts` through the `openapi` key.

## Minimal configuration

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],
  openapi: {
    input: './swagger.yaml',
  },
})
```

That is enough to generate:

- the OpenAPI SDK into `./openapi`
- `useFetch` composables
- `useAsyncData` composables

## Typical configuration

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],
  openapi: {
    input: './swagger.yaml',
    output: './openapi',
    baseUrl: 'https://api.example.com',
    generators: ['useFetch', 'useAsyncData', 'nuxtServer', 'connectors'],
    serverRoutePath: 'server/routes/api',
    enableBff: false,
    enableDevBuild: true,
    enableProductionBuild: true,
    enableAutoGeneration: false,
    enableAutoImport: true,
    connectors: {
      enabled: true,
      strategy: 'manual',
    },
  },
})
```

## When generation runs

- `enableDevBuild: true` generates files before `nuxt dev` starts building.
- `enableProductionBuild: true` generates files before `nuxt build`.
- `enableAutoGeneration: true` watches the input file in development and regenerates when it changes.

## Module options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `input` | `string` | Yes | - | Path to the local OpenAPI document consumed by the module. |
| `output` | `string` | No | `./openapi` | Root directory for the generated SDK and composables. |
| `baseUrl` | `string` | No | - | Base URL injected into generated client composables. |
| `generators` | `Array<'useFetch' \| 'useAsyncData' \| 'nuxtServer' \| 'connectors'>` | No | `['useFetch', 'useAsyncData']` | Select which outputs to generate. |
| `serverRoutePath` | `string` | No | `server/routes/api` | Output directory for generated `nuxtServer` routes. |
| `enableBff` | `boolean` | No | `false` | Enables BFF helpers for `nuxtServer` generation. |
| `connectors` | `object` | No | - | Advanced connector configuration for `manual` or `hybrid` strategies. |
| `createUseAsyncDataConnectors` | `boolean` | No | `false` | Backward-compatible flag that also triggers connector generation. |
| `enableDevBuild` | `boolean` | No | `true` | Generate before development builds. |
| `enableProductionBuild` | `boolean` | No | `true` | Generate before production builds. |
| `enableAutoGeneration` | `boolean` | No | `false` | Regenerate when the input file changes in development. |
| `enableAutoImport` | `boolean` | No | `true` | Auto-import generated composables and connectors in Nuxt. |

## Generator selection notes

- `connectors` depends on `useAsyncData`. If connectors are requested, `useAsyncData` is added automatically.
- `nuxtServer` writes route handlers into `serverRoutePath`; it does not place them inside `openapi/`.
- If you only want the SDK plus one composable family, keep `generators` small.

## Related

- [Getting Started](/guide/getting-started)
- [Choosing a Generator](/guide/choosing-a-generator)
- [Generating Composables](/guide/generating-composables)
