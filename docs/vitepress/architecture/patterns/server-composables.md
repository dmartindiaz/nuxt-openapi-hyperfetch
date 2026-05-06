# Server Route Pattern

This page keeps the historical filename, but the current `nuxtServer` generator produces Nitro route files directly.

## Current behavior

When `nuxtServer` is enabled, the module parses the generated API layer and writes route handlers into the configured `serverRoutePath`.

Default pattern:

- input: generated API files under `openapi/`
- output: `server/routes/api` unless overridden

## File naming pattern

Routes are derived from the OpenAPI path and HTTP method.

Examples:

- `/pet` + `GET` -> `pet/index.get.ts`
- `/pet/{petId}` + `GET` -> `pet/[pet].get.ts` or simplified dynamic segment form based on the current generator rules
- `/store/inventory` + `GET` -> `store/inventory.get.ts`

## Handler pattern

Generated handlers:

- read path params from the event
- read query and body when needed
- resolve `runtimeConfig.apiBaseUrl`
- call `$fetch` against the backend API
- wrap failures with `createError`

Simplified shape:

```ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  return await $fetch(`${config.apiBaseUrl}/...`)
})
```

## Why direct route generation

The current code chooses direct Nitro handlers instead of generating server-side composable helpers. That keeps the output immediately runnable inside a Nuxt server tree.

## Related guides

- [BFF pattern](/architecture/patterns/bff-pattern)
- [ADR 003](/architecture/decisions/003-server-composables)
