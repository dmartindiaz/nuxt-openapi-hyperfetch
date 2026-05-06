# useAsyncData Composables

Generated `useAsyncData` composables wrap Nuxt's `useAsyncData` and add the same shared runtime features as `useFetch`, plus a `Raw` variant for full response access.

## What you get

- Typed params and typed response data
- Auto-generated cache identity from operation key, resolved URL, and params
- Optional `cacheKey` override through the composable options
- Lifecycle callbacks
- Global callback rules and global headers
- `pick` and `transform`
- Optional pagination helpers
- A `Raw` variant that returns `data`, `headers`, `status`, and `statusText`

::: tip Nuxt reference
For the complete behavior of `data`, `pending`, `error`, `refresh`, `server`, `lazy`, `dedupe`, and native caching semantics, see the Nuxt docs:

[Nuxt useAsyncData Documentation](https://nuxt.com/docs/api/composables/use-async-data)
:::

## Standard variant

```ts
const { data, pending, error } = useAsyncDataGetPets()
```

This is the usual choice when you want the response body only.

## Raw variant

```ts
const { data: response } = useAsyncDataGetPetsRaw()

console.log(response.value?.status)
console.log(response.value?.headers)
console.log(response.value?.data)
```

Use the raw variant when you need response metadata such as pagination headers, rate-limit headers, or ETags.

## Cache keys

The runtime computes a key from the generated composable key, resolved URL, and serialized params. That keeps different param combinations isolated by default.

If you want to override that behavior, pass `cacheKey` in the options object:

```ts
const { data } = useAsyncDataFindPetsByStatus(
  { query: { status: 'available' } },
  {
    cacheKey: 'pets-available',
  }
)
```

## Reactivity behavior

For GET requests, the runtime watches reactive URL and param sources by default.

For mutations such as POST, PUT, PATCH, and DELETE, automatic watching is off by default unless you opt into it with `watch: true`.

```ts
const petId = ref(1)

const { data } = useAsyncDataGetPetById(
  computed(() => ({
    path: { petId: petId.value },
  }))
)
```

## Pagination shape

With `useAsyncData`, pagination helpers are exposed inside `pagination` itself:

```ts
const { data, pagination } = useAsyncDataGetPets({}, { paginated: true })

pagination.value?.nextPage()
pagination.value?.setPerPage(50)
```

## Related guides

- [Basic usage](/composables/use-async-data/basic-usage)
- [Raw responses](/composables/use-async-data/raw-responses)
- [Pagination](/composables/use-async-data/pagination)
- [useAsyncData vs useFetch](/composables/use-async-data/vs-use-fetch)
