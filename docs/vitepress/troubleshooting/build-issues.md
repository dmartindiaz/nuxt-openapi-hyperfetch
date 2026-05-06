# Build Issues

This page covers module setup, dependency, and build failures in the current Nuxt workflow.

## Generation does not start

### `openapi.input` is missing

If `input` is not configured, the module skips generation entirely.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],
  openapi: {
    input: './swagger.yaml',
  },
})
```

The Nuxt terminal should stop showing the module warning once `input` is set.

### Build hooks are disabled

Generation runs through Nuxt build hooks.

- `enableDevBuild` controls generation before `nuxt dev`
- `enableProductionBuild` controls generation before `nuxt build`

If one of those flags is `false`, that phase will not generate anything.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],
  openapi: {
    input: './swagger.yaml',
    enableDevBuild: true,
    enableProductionBuild: true,
  },
})
```

## Generated files are missing during TypeScript build

If TypeScript or Vite cannot resolve generated imports, usually one of these is true:

- the module never generated output because the hook did not run
- `output` points to a different directory than expected
- the app still imports from an old non-module path

Current default output root:

```text
openapi/
```

Typical generated client directories:

```text
openapi/composables/use-fetch/
openapi/composables/use-async-data/
openapi/composables/connectors/
```

If the directory is stale or partially generated, delete `openapi/` and rerun `nuxt dev` or `nuxt build`.

## Auto-imports are not available

Generated composables are auto-imported only when:

- `enableAutoImport !== false`
- the corresponding generator is enabled

```ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],
  openapi: {
    input: './swagger.yaml',
    generators: ['useFetch', 'useAsyncData'],
    enableAutoImport: true,
  },
})
```

If auto-import is off, import directly from the generated output.

## `nuxtServer` routes are not generated

The server layer is opt-in.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],
  openapi: {
    input: './swagger.yaml',
    generators: ['nuxtServer'],
    serverRoutePath: 'server/routes/api',
  },
})
```

If `nuxtServer` is not in `generators`, nothing is written to the server route directory.

## Connectors are not generated

Connectors are generated only when requested.

Use one of these:

- include `'connectors'` in `generators`
- set `createUseAsyncDataConnectors: true`
- provide meaningful `connectors` config

Also note that connectors depend on `useAsyncData`. The module adds that generator automatically when needed, but if generation never runs, connectors never appear.

## Wrong runtime base URL

The client runtime falls back to `runtimeConfig.public.apiBaseUrl`.

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://api.example.com',
    },
  },
})
```

If you still configure a legacy runtime key instead of `apiBaseUrl`, generated requests will not pick it up automatically.

## Nitro build cannot resolve generated route output

When `nuxtServer` is enabled, generated handlers live under `serverRoutePath`, defaulting to:

```text
server/routes/api
```

Check that:

- `serverRoutePath` matches the directory your app expects
- no custom alias points to an older custom server layout
- the route directory is not excluded by project tooling

## Dependency and environment issues

### Peer dependency errors

This package expects a compatible Nuxt version. If install fails on peer resolution, align the Nuxt version first instead of forcing the install immediately.

### Node version issues

If install or build fails because of the Node engine, switch to a supported Node LTS version before debugging the module itself.

### Corrupted dependency tree

If the build fails with unrelated resolution errors:

1. remove `node_modules`
2. remove the lockfile used by your package manager
3. reinstall dependencies
4. rerun `nuxt dev` or `nuxt build`

## Cache and stale output issues

If the app keeps seeing old generated code:

1. delete `openapi/`
2. delete `.nuxt/` and `.output/`
3. restart the Nuxt process

This is especially useful after changing:

- `operationId` values
- generator selection
- output paths
- shared runtime code in the module itself

## TypeScript configuration issues

The project should extend Nuxt's generated TypeScript config.

```json
{
  "extends": "./.nuxt/tsconfig.json"
}
```

If the app overrides module resolution aggressively, generated imports can fail even when the output exists.

## Checklist

When a build fails, verify in this order:

1. `openapi.input` exists
2. the right generators are enabled
3. the expected output directories actually exist
4. `runtimeConfig.public.apiBaseUrl` is set if client requests need a base URL
5. `serverRoutePath` is correct when `nuxtServer` is enabled
6. caches and stale generated files have been cleared

## Related pages

- [Generation errors](/troubleshooting/generation-errors)
- [Composables issues](/troubleshooting/composables-issues)
- [Server issues](/troubleshooting/server-issues)
