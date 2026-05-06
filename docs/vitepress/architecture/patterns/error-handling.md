# Error Handling Pattern

The project has three main error-handling layers.

## 1. Generation-time errors

`src/generate.ts` wraps SDK generation and exits the process when `@hey-api/openapi-ts` fails.

This keeps build failures explicit and prevents partially generated output from being treated as successful.

## 2. Client runtime errors

Generated client wrappers surface request failures through Nuxt composable state and optional lifecycle callbacks.

Key parts of the pattern:

- local `onError`
- global `onError` rules from `$getGlobalApiCallbacks`
- `skipGlobalCallbacks` for per-request exceptions
- `onFinish` for cleanup regardless of outcome

The wrappers do not replace Nuxt error refs; callbacks are additive behavior.

## 3. Server route errors

Generated `nuxtServer` handlers catch backend failures and rethrow them as `createError(...)` values for Nitro.

That keeps server output aligned with Nuxt's standard error flow.

## Practical pattern

Use each layer for the right concern:

- build-time validation for broken specs or generation failures
- client callbacks for UI behavior and request-side effects
- Nitro `createError` for server route responses

## Related guides

- [Callbacks](/composables/features/callbacks/overview)
- [Global callbacks](/composables/features/global-callbacks/overview)
- [Server route pattern](/architecture/patterns/server-composables)
