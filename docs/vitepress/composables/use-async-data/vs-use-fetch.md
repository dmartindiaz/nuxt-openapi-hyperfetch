# useAsyncData vs useFetch

Both generators wrap the same OpenAPI operations. Choose based on how much control you need from the Nuxt side.

## Quick comparison

| Feature | useFetch | useAsyncData |
|---------|----------|--------------|
| Simplicity | Higher | Higher control |
| Raw response variant | No | Yes |
| Headers and status access | No | Yes, through `Raw` |
| Shared callbacks | Yes | Yes |
| Global callbacks | Yes | Yes |
| `pick` and `transform` | Yes | Yes |
| Pagination support | Yes | Yes |
| Cache identity control | Nuxt behavior | Generated key plus optional `cacheKey` |

## Prefer `useFetch` when

- You only need the response body
- The page flow is straightforward
- You want the most familiar Nuxt `useFetch` style
- You do not need raw response metadata

```ts
const { data: pet } = useFetchGetPetById({
  path: { petId: 123 },
})
```

## Prefer `useAsyncData` when

- You need headers or status codes through the raw variant
- Cache identity matters and you may want `cacheKey`
- You want the generated watch behavior for reactive GET params
- You want to standardize around `useAsyncData` semantics

```ts
const { data: response } = useAsyncDataGetPetsRaw()
console.log(response.value?.headers)
```

## Reactive params

`useFetch` follows Nuxt's native behavior.

Generated `useAsyncData` wrappers add watch wiring for reactive URL and param sources, and default that behavior off for mutations unless you opt in with `watch: true`.

## Cache control

`useAsyncData` can override the generated key through `cacheKey`:

```ts
const { data } = useAsyncDataGetPets(
  { query: { status: 'available' } },
  {
    cacheKey: 'pets-shared',
  }
)
```

## Rule of thumb

Start with `useFetch` for ordinary pages and actions. Move to `useAsyncData` when you need raw metadata, explicit cache identity, or you prefer `useAsyncData` semantics for the flow.

## Related guides

- [useFetch](/composables/use-fetch/)
- [useAsyncData](/composables/use-async-data/)
