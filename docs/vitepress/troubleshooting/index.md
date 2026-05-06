# Troubleshooting

This section covers the failure modes that still matter in the current Nuxt-only module workflow.

## Start with the symptom

### Generation and build

- Module does not generate anything -> [Build issues](/troubleshooting/build-issues)
- OpenAPI parsing fails -> [Generation errors](/troubleshooting/generation-errors)
- Generated code fails TypeScript checks -> [Type errors](/troubleshooting/type-errors)

### Generated client layer

- Generated composables are missing or not auto-imported -> [Composables issues](/troubleshooting/composables-issues)
- Requests fail at runtime -> [Runtime errors](/troubleshooting/runtime-errors)

### Generated server layer

- `nuxtServer` routes are missing or broken -> [Server issues](/troubleshooting/server-issues)

### Performance

- Build or regeneration is too slow -> [Performance](/troubleshooting/performance)

## Current product assumptions

The guidance in this folder assumes the current package shape:

- configuration lives in `nuxt.config.ts` under `openapi`
- SDK and client outputs are generated under `openapi/` by default
- generated client composables live under `openapi/composables/`
- `nuxtServer` writes Nitro routes to `serverRoutePath`, defaulting to `server/routes/api`
- the shared client runtime reads `runtimeConfig.public.apiBaseUrl` when `baseURL` is not passed per call

## Common problems

### Generation never runs

Most often one of these is true:

- `openapi.input` is missing, so the module skips generation
- the current command is `nuxt dev` but `enableDevBuild` is `false`
- the current command is `nuxt build` but `enableProductionBuild` is `false`

See [Build issues](/troubleshooting/build-issues).

### Generated composables are not found

Most often one of these is true:

- the needed generator is not enabled
- the symbol name is based on a different `operationId` than expected
- the app is importing from an old path instead of the generated `openapi/` tree

See [Composables issues](/troubleshooting/composables-issues).

### Requests fail even though generation succeeded

Most often one of these is true:

- `runtimeConfig.public.apiBaseUrl` is missing
- authentication is not wired through `useApiHeaders()` or `getGlobalApiCallbacks`
- the browser is calling an upstream API directly and hitting CORS restrictions

See [Runtime errors](/troubleshooting/runtime-errors).

### `nuxtServer` output is missing or broken

Most often one of these is true:

- `generators` does not include `nuxtServer`
- `serverRoutePath` points somewhere unexpected
- `apiBaseUrl` or optional BFF files are not configured after generation

See [Server issues](/troubleshooting/server-issues).

## What to include in a bug report

When reporting an issue, include:

1. package version
2. Nuxt version
3. Node version
4. relevant `openapi` section from `nuxt.config.ts`
5. whether the failure happens in `nuxt dev`, `nuxt build`, or both
6. a minimal OpenAPI excerpt that reproduces the problem
7. the generated output path involved, such as `openapi/composables/use-fetch` or `server/routes/api`

## Debugging hints

- Watch the Nuxt terminal for messages prefixed with `[nuxt-openapi-hyperfetch]`.
- Confirm that the expected generator is enabled before debugging the output.
- When in doubt, delete the generated output directory and let the module regenerate it from the current spec.

## Sections

- [Build issues](/troubleshooting/build-issues)
- [Generation errors](/troubleshooting/generation-errors)
- [Composables issues](/troubleshooting/composables-issues)
- [Runtime errors](/troubleshooting/runtime-errors)
- [Server issues](/troubleshooting/server-issues)
- [Type errors](/troubleshooting/type-errors)
- [Performance](/troubleshooting/performance)
