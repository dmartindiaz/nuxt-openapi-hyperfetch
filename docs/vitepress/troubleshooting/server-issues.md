# Server Issues

This page covers problems with the `nuxtServer` generator and its optional BFF scaffolding.

## Routes are not generated

The server layer is generated only when `nuxtServer` is enabled.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],
  openapi: {
    input: './swagger.yaml',
    generators: ['nuxtServer'],
  },
})
```

By default, routes are written to:

```text
server/routes/api
```

If you expect generated handlers somewhere else, set `serverRoutePath` explicitly.

## Routes are generated in an unexpected place

`nuxtServer` writes to the resolved `serverRoutePath`, not under `openapi/`.

```ts
export default defineNuxtConfig({
  openapi: {
    input: './swagger.yaml',
    generators: ['nuxtServer'],
    serverRoutePath: 'server/routes/api',
  },
})
```

If your app still expects an older `server/api` layout, update the app routing assumptions or set `serverRoutePath` to the directory you actually want.

## Upstream calls fail from generated routes

Generated handlers resolve the backend base URL from runtime config.

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    apiBaseUrl: process.env.API_BASE_URL || '',
    apiSecret: process.env.API_SECRET || '',
  },
})
```

If `apiBaseUrl` is missing, the generated route handlers cannot reach the upstream API.

## Auth context is not doing anything

When `enableBff` is on, the generator can scaffold:

- `server/auth/context.ts`
- `server/auth/types.ts`
- `server/bff/transformers/*`

Those files are starting points, not complete auth implementations. If requests still behave as unauthenticated, implement your real auth lookup inside `server/auth/context.ts`.

## Transformers are not changing the response

In BFF mode, generated routes try to load resource transformers from `server/bff/transformers/`.

If your response is unchanged, check that:

1. `enableBff` was enabled when the routes were generated
2. the transformer file exists for that resource
3. the transformer exports the expected function
4. your custom logic returns the transformed value instead of the original one

## Custom BFF files disappeared after regeneration

The generator preserves auth and transformer stubs when they already exist. Generated routes themselves are overwritten, but the BFF customization files are intended to survive regeneration.

If custom files disappear, verify that you edited the preserved auth or transformer files, not generated route handlers.

## Route handlers compile, but runtime auth headers are missing

There are two common cases:

### Browser-to-upstream auth

If the browser calls the upstream API directly, use `useApiHeaders()` or `getGlobalApiCallbacks` in the client layer.

### Server-to-upstream auth

If the generated Nitro route is responsible for upstream access, use runtime config, auth context, or transformer logic in the server layer instead of expecting client callback plugins to run there.

## Dynamic route behavior looks wrong

Generated route names are derived from the OpenAPI path and method. If a dynamic segment looks odd, the first place to inspect is the OpenAPI path itself.

For example, inconsistent path parameter naming in the spec can produce handlers that do not match the field names you expected in the app.

## Server route output is stale after spec changes

If route files do not reflect the current spec:

1. confirm `nuxtServer` is still enabled
2. delete the generated route directory under `serverRoutePath`
3. rerun `nuxt dev` or `nuxt build`

If `enableAutoGeneration` is disabled, development file changes will not regenerate routes automatically.

## Errors from Nitro should be explicit

Generated handlers are designed to throw Nuxt or Nitro errors rather than returning ad hoc error objects. If your app swallows errors or reshapes them inconsistently, inspect any local wrapper you added around the generated server routes.

## Checklist

When `nuxtServer` fails, verify in this order:

1. `generators` includes `'nuxtServer'`
2. `serverRoutePath` is the directory you actually expect
3. `runtimeConfig.apiBaseUrl` is configured
4. optional BFF auth and transformer files are implemented when `enableBff` is used
5. route output has been regenerated after the latest spec change

## Related pages

- [Build issues](/troubleshooting/build-issues)
- [Runtime errors](/troubleshooting/runtime-errors)
- [Architecture: BFF pattern](/architecture/patterns/bff-pattern)
