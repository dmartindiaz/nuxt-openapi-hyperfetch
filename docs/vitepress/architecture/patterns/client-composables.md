# Client Composable Patterns

Generated client composables are wrapper layers on top of the base SDK output.

## Output structure

When enabled, the module writes client composables into:

- `openapi/composables/use-fetch`
- `openapi/composables/use-async-data`
- `openapi/composables/shared/runtime`

## Param shape pattern

Generated wrappers follow the SDK request shape instead of flattening params.

Typical request objects are grouped by transport concern:

- `path`
- `query`
- `body`
- `headers` when needed by the underlying SDK call

Example:

```ts
useFetchGetPetById({
  path: { petId: 123 },
})
```

## Shared runtime pattern

Both client families reuse shared helpers for:

- `onRequest`, `onSuccess`, `onError`, `onFinish`
- global callbacks from `$getGlobalApiCallbacks`
- global headers from `useApiHeaders()` or `$getApiHeaders`
- `pick` before `transform`
- pagination state and request injection

## Family split

### `useFetch`

Best for the simplest Nuxt data-fetching integration.

Pattern:

- native `useFetch` ergonomics
- shared runtime features
- top-level pagination helpers

### `useAsyncData`

Best when cache identity or raw response metadata matters.

Pattern:

- generated cache identity from key + resolved URL + params
- optional `cacheKey` override
- raw variant support
- pagination helpers inside `pagination.value`

## Auto-import pattern

When `enableAutoImport` is enabled, the module registers generated composable directories automatically so pages and components can use them without manual imports.

## Related guides

- [Composables overview](/composables/)
- [useFetch](/composables/use-fetch/)
- [useAsyncData](/composables/use-async-data/)
