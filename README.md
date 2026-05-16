<p align="center">
  <img src="https://raw.githubusercontent.com/dmartindiaz/nuxt-openapi-hyperfetch/main/public/nuxt-openapi-hyperfetch-logo.png" alt="Nuxt OpenAPI Hyperfetch logo" width="260" />
</p>

<p align="center">
  <strong>Nuxt-only OpenAPI generation.</strong><br/>
  Configure one module and generate a typed OpenAPI client, Nuxt composables, optional server routes, and headless connectors.
</p>

<p align="center">
  <a href="https://nuxt-openapi-hyperfetch.netlify.app/">Documentation</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#generators">Generators</a> ·
  <a href="#contributing">Contributing</a>
</p>

---

## Installation

Install the module in your Nuxt project.

```bash
npm install nuxt-openapi-hyperfetch
```

If you use `connectors`, also install `zod`:

```bash
npm install zod
```

Peer dependencies:

- Nuxt 3 or 4
- `@nuxt/kit`
- `zod` when using `connectors`

## What It Generates

The module uses an OpenAPI document as input and generates a layered output.

Base output under `openapi/`:

- typed SDK functions
- generated OpenAPI types
- generated client files and barrel exports

Optional higher-level layers:

- `useFetch` composables
- `useAsyncData` composables
- `nuxtServer` Nitro routes
- headless CRUD connectors

Default generated root:

```text
openapi/
  index.ts
  sdk.gen.ts
  types.gen.ts
  client.gen.ts
  client/
  core/
  composables/
```

When `nuxtServer` is enabled, route handlers are generated outside `openapi/`, under `server/routes/api` by default.

## Quick Start

Register the module and point it to your OpenAPI file.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],

  openapi: {
    input: './swagger.yaml',
    output: './openapi',
    generators: ['useFetch', 'useAsyncData'],
    enableAutoImport: true,
  },
})
```

Then start Nuxt normally:

```bash
npm run dev
```

Generation runs during the Nuxt build lifecycle.

Current module defaults:

- `output: './openapi'`
- `generators: ['useFetch', 'useAsyncData']`
- `enableDevBuild: true`
- `enableProductionBuild: true`
- `enableAutoGeneration: false`
- `enableAutoImport: true`

## Generated Composables

Generated names follow the OpenAPI `operationId`.

Example with `useAsyncData`:

```vue
<script setup lang="ts">
const { data: pet, error } = await useAsyncDataGetPetById({
  path: {
    petId: 123,
  },
})
</script>

<template>
  <div v-if="error">Request failed</div>
  <div v-else>{{ pet?.name }}</div>
</template>
```

If you enable `useFetch`, the module also generates the parallel `openapi/composables/use-fetch/` tree.

## Generators

Generators are additive. Choose the smallest set that matches your app.

| Generator | Output | Use it for |
| --------- | ------ | ---------- |
| `useFetch` | `openapi/composables/use-fetch/` | straightforward component-level requests |
| `useAsyncData` | `openapi/composables/use-async-data/` | async flows, cache keys, raw variants, connector foundation |
| `nuxtServer` | `server/routes/api/` by default | server-owned API access and BFF patterns |
| `connectors` | `openapi/composables/connectors/` | headless CRUD helpers built on top of `useAsyncData` |

Examples:

```ts
openapi: {
  input: './swagger.yaml',
  generators: ['useFetch', 'useAsyncData'],
}
```

```ts
openapi: {
  input: './swagger.yaml',
  generators: ['useAsyncData', 'connectors'],
}
```

```ts
openapi: {
  input: './swagger.yaml',
  generators: ['nuxtServer'],
  serverRoutePath: 'server/routes/api',
  enableBff: true,
}
```

## Connectors

When `connectors` is enabled, the module generates resource-oriented headless CRUD helpers on top of `useAsyncData`.

```ts
const { getAll, get, create, update, del } = usePetsConnector()
```

Connectors are useful when your app repeatedly builds list, detail, create, update, and delete flows around the same resource model.

## Base URL Configuration

Generated composables and connectors can resolve their base URL from `runtimeConfig.public.apiBaseUrl`.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://api.example.com',
    },
  },
})
```

If you do not want a global fallback, you can still pass `baseURL` per call.

## Global Headers and Callbacks

The generated runtime can integrate with two lightweight extension points:

- `useApiHeaders()` or `$getApiHeaders` for shared request headers
- `getGlobalApiCallbacks` for shared request lifecycle callbacks

This keeps auth and cross-cutting request behavior in your Nuxt app instead of hardcoding it into generated output.

## Local Development

This repository includes a small development harness for contributor workflows:

```bash
npm run dev:generate:all
npm run dev:generate:openapi
npm run dev:generate:use-fetch
npm run dev:generate:use-async-data
```

These scripts are for repository development and smoke-testing generator changes.

## Documentation

- [Documentation site](https://nuxt-openapi-hyperfetch.netlify.app/)
- [Getting Started](./docs/vitepress/guide/getting-started.md)
- [Choosing a Generator](./docs/vitepress/guide/choosing-a-generator.md)
- [Connectors](./docs/vitepress/connectors/index.md)
- [Troubleshooting](./docs/vitepress/troubleshooting/index.md)
- [Contributing](./CONTRIBUTING.md)

## Contributing

```bash
npm install
npm run build
npm run validate
```

If your change affects generated output, also run the relevant `dev:generate:*` command and inspect `openapi/`.

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

Apache-2.0. See [LICENSE](./LICENSE).
