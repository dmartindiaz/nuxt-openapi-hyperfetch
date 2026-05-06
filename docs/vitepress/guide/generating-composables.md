# Generating Composables

Generation is driven by your Nuxt module configuration.

There is no separate public CLI workflow in the current package. You choose the outputs in `nuxt.config.ts`, then Nuxt triggers generation during the build lifecycle.

## Minimal setup

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],
  openapi: {
    input: './swagger.yaml',
    output: './openapi',
    generators: ['useFetch', 'useAsyncData'],
  },
})
```

## When generation happens

- `npm run dev` or `npx nuxt dev`: generation runs before the development build when `enableDevBuild` is enabled.
- `npm run build` or `npx nuxt build`: generation runs before the production build when `enableProductionBuild` is enabled.
- With `enableAutoGeneration: true`, changes to the configured input file trigger regeneration in development.

## Choosing generated outputs

### Generate the default client layer

```ts
openapi: {
  input: './swagger.yaml',
}
```

This generates the SDK plus `useFetch` and `useAsyncData` composables.

### Generate only `useAsyncData`

```ts
openapi: {
  input: './swagger.yaml',
  generators: ['useAsyncData'],
}
```

### Add server routes

```ts
openapi: {
  input: './swagger.yaml',
  generators: ['useAsyncData', 'nuxtServer'],
  serverRoutePath: 'server/routes/api',
}
```

### Add connectors

```ts
openapi: {
  input: './swagger.yaml',
  generators: ['useAsyncData', 'connectors'],
  connectors: {
    enabled: true,
    strategy: 'manual',
  },
}
```

## Output structure

The generated SDK and client layers live under the configured `output` directory.

Example with `output: './openapi'`:

```text
openapi/
  client/
  core/
  client.gen.ts
  index.ts
  sdk.gen.ts
  types.gen.ts
  composables/
    use-fetch/
      composables/
      runtime/
      index.ts
    use-async-data/
      composables/
      runtime/
      index.ts
    connectors/
```

If `nuxtServer` is enabled, server handlers are generated separately into `serverRoutePath`.

## Generated names come from `operationId`

If your OpenAPI operation is named `getPetById`, you should expect composables such as:

- `useFetchGetPetById`
- `useAsyncDataGetPetById`
- `useAsyncDataGetPetByIdRaw`

Stable and descriptive `operationId` values make the generated API much easier to work with.

## Regeneration strategy

- Treat generated files as build artifacts.
- Change the OpenAPI document first, then regenerate.
- Do not hand-edit generated composables unless you are intentionally changing generator output or runtime templates in the package itself.

## Related

- [Choosing a Generator](/guide/choosing-a-generator)
- [Use as Nuxt Module](/guide/use-as-nuxt-module)
- [Core Concepts](/guide/core-concepts)
