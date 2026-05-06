# Architecture

This section describes the current Nuxt-only architecture of `nuxt-openapi-hyperfetch`.

## Overview

The package is a Nuxt module with `configKey: 'openapi'`. During Nuxt build hooks, it:

1. Resolves the OpenAPI input file
2. Generates the base SDK with `@hey-api/openapi-ts`
3. Runs optional wrapper generators on top of that SDK
4. Registers auto-imports for generated composables when enabled

The default output root is `./openapi`.

## Main layers

### 1. Module orchestration

The module entry point coordinates the whole generation flow from `src/module/index.ts`.

It is responsible for:

- reading `openapi` options from `nuxt.config.ts`
- deciding which generators run
- wiring dev and production build hooks
- optionally watching the spec file
- auto-importing generated composables

### 2. Base SDK generation

`src/generate.ts` delegates the OpenAPI-to-SDK step to `@hey-api/openapi-ts`.

That produces the base TypeScript client under `openapi/`, including files such as:

- `index.ts`
- `sdk.gen.ts`
- `types.gen.ts`
- `client.gen.ts`
- `client/`
- `core/`

### 3. Wrapper generators

The module can then add higher-level code on top of the base SDK:

- `useFetch`
- `useAsyncData`
- `nuxtServer`
- `connectors`

`useFetch` and `useAsyncData` write under `openapi/composables/`.

`nuxtServer` writes Nitro route files into the configured server route path.

`connectors` build headless resource-oriented helpers on top of `useAsyncData`.

### 4. Shared runtime

Both composable families reuse shared runtime helpers for:

- local and global callbacks
- global headers
- `pick` and `transform`
- base URL fallback
- pagination

## Current flow

```text
OpenAPI spec
  -> Nuxt module (openapi config)
  -> @hey-api/openapi-ts base SDK
  -> optional wrapper generators
  -> openapi/ output and optional server route output
  -> auto-imported composables in the Nuxt app
```

## Optional outputs

Depending on configuration, the architecture can produce:

- client composables in `openapi/composables/use-fetch`
- client composables in `openapi/composables/use-async-data`
- connector helpers in `openapi/composables/connectors`
- Nitro routes in the configured `serverRoutePath`

## Sections

- [Design patterns](/architecture/patterns/)
- [Architecture decisions](/architecture/decisions/)

## Related guides

- [Nuxt module usage](/guide/use-as-nuxt-module)
- [Choosing a generator](/guide/choosing-a-generator)
- [Composables](/composables/)
