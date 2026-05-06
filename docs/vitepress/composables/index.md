# Composables

The module can generate two Nuxt composable families from the same OpenAPI operations:

- `useFetch` wrappers built on top of Nuxt's `useFetch`
- `useAsyncData` wrappers built on top of Nuxt's `useAsyncData`

Both families use the generated OpenAPI types, so the wrapper params follow the SDK shape for each operation. For routes with path params, that usually means objects such as `params.path.petId`, not flat `{ petId }` arguments.

## Shared capabilities

Generated composables add a small runtime layer on top of Nuxt. That layer currently provides:

- Typed params and typed response data from the generated SDK
- Lifecycle callbacks: `onRequest`, `onSuccess`, `onError`, `onFinish`
- Global callback rules from a Nuxt plugin that provides `$getGlobalApiCallbacks`
- Global headers from either `useApiHeaders()` or a Nuxt plugin that provides `$getApiHeaders`
- Request modification from `onRequest` by returning `headers`, `body`, or `query`
- `pick`, applied before `transform`
- Optional pagination helpers
- `baseURL` fallback from `runtimeConfig.public.apiBaseUrl`

::: tip Nuxt reference
The wrappers still expose the underlying Nuxt behavior for options such as `server`, `lazy`, `immediate`, `dedupe`, and `watch`.

- [Nuxt useFetch Documentation](https://nuxt.com/docs/api/composables/use-fetch)
- [Nuxt useAsyncData Documentation](https://nuxt.com/docs/api/composables/use-async-data)
:::

## Choosing a family

### `useFetch`

Use `useFetch` wrappers when you want the simplest Nuxt integration and only need the response body.

```ts
const { data, pending, error, refresh } = useFetchGetPetById({
  path: { petId: 123 },
})
```

Best fit:

- Standard page data loading
- Straightforward CRUD actions
- Forms triggered with `immediate: false`
- Cases where the response body is enough

[Learn more about useFetch](/composables/use-fetch/)

### `useAsyncData`

Use `useAsyncData` wrappers when you need the raw response variant, computed cache identity, or more control over reactivity.

```ts
const { data, pending, error, refresh } = useAsyncDataGetPetById({
  path: { petId: 123 },
})
```

Best fit:

- Flows that need headers or status codes through the `Raw` variant
- Requests where cache identity matters
- Flows that benefit from `useAsyncData` semantics
- Advanced pagination or response-processing paths

[Learn more about useAsyncData](/composables/use-async-data/)

## Raw responses

Only the `useAsyncData` generator produces a `Raw` variant per operation.

```ts
const { data: response } = useAsyncDataGetPetsRaw()

console.log(response.value?.status)
console.log(response.value?.headers.get('X-Total-Count'))
console.log(response.value?.data)
```

The raw response shape is:

```ts
interface RawResponse<T> {
  data: T
  headers: Headers
  status: number
  statusText: string
}
```

[Learn more about raw responses](/composables/use-async-data/raw-responses)

## Callback model

Local callbacks run per request:

```ts
useFetchGetPetById(
  {
    path: { petId: 123 },
  },
  {
    onRequest: ({ headers }) => ({
      headers: {
        ...headers,
        'X-Request-ID': crypto.randomUUID(),
      },
    }),
    onSuccess: (pet) => {
      console.log('Loaded', pet.name)
    },
    onError: (error) => {
      console.error(error)
    },
  }
)
```

Global callbacks are configured through a Nuxt plugin:

```ts
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  return {
    provide: {
      getGlobalApiCallbacks: () => ({
        onError: (error) => {
          if (error.status === 401) {
            navigateTo('/login')
          }
        },
      }),
    },
  }
})
```

At runtime, global rules are merged before local callbacks. Local callbacks still run unless a matching global rule explicitly returns `false` for that lifecycle stage.

[Learn more about callbacks](/composables/features/callbacks/overview)

## Quick comparison

| Feature | `useFetch` | `useAsyncData` |
|---------|------------|----------------|
| Typed params and responses | Yes | Yes |
| Lifecycle callbacks | Yes | Yes |
| Global callbacks | Yes | Yes |
| Global headers | Yes | Yes |
| `pick` before `transform` | Yes | Yes |
| Pagination helpers | Yes | Yes |
| Raw response variant | No | Yes |
| Built on | `useFetch` | `useAsyncData` |
| Best fit | Most endpoints | Advanced response flows |

## Next steps

- [useFetch overview](/composables/use-fetch/)
- [useAsyncData overview](/composables/use-async-data/)
- [Shared features](/composables/features/)
- [Pagination](/composables/use-async-data/pagination)
