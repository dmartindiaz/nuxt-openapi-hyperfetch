# Raw Responses

The generated `Raw` variant of `useAsyncData` returns the response body together with `headers`, `status`, and `statusText`.

## Response shape

```ts
interface RawResponse<T> {
  data: T
  headers: Headers
  status: number
  statusText: string
}
```

## Basic usage

```ts
const { data: response } = useAsyncDataGetPetsRaw()

console.log(response.value?.status)
console.log(response.value?.headers.get('X-Total-Count'))
console.log(response.value?.data)
```

## Custom cache identity

```ts
const { data: response } = useAsyncDataFindPetsByStatusRaw(
  { query: { status: 'available' } },
  {
    cacheKey: 'pets-available-raw',
  }
)
```

## ETag example

```ts
const etag = ref<string | null>(null)

const { data: response } = useAsyncDataGetPetsRaw({}, {
  onRequest: ({ headers }) => {
    if (!etag.value) {
      return
    }

    return {
      headers: {
        ...headers,
        'If-None-Match': etag.value,
      },
    }
  },
})

watch(response, (value) => {
  const nextEtag = value?.headers.get('ETag')
  if (nextEtag) {
    etag.value = nextEtag
  }
})
```

## Header-driven metadata

```ts
const { data: response } = useAsyncDataGetPetsRaw()

const rateLimit = computed(() => {
  if (!response.value) {
    return null
  }

  return {
    limit: response.value.headers.get('X-RateLimit-Limit'),
    remaining: response.value.headers.get('X-RateLimit-Remaining'),
  }
})
```

## When to use it

Use the raw variant when you need:

- Response headers
- HTTP status codes
- Rate-limit metadata
- ETags
- Any other response metadata beyond the body

## Related guides

- [useAsyncData](/composables/use-async-data/)
- [Pagination](/composables/use-async-data/pagination)
