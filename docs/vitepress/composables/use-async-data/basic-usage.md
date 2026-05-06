# useAsyncData Basic Usage

Generated `useAsyncData` composables wrap Nuxt's `useAsyncData` with typed params, shared runtime callbacks, `pick`, `transform`, pagination support, and an optional raw variant.

## Basic request

```vue
<script setup lang="ts">
const { data: pets, pending, error } = useAsyncDataGetPets()
</script>
```

## Cache keys

The runtime builds a key from the composable name, resolved URL, and serialized params. If you want intentional cache sharing, pass `cacheKey` in the options object.

```ts
const { data } = useAsyncDataFindPetsByStatus(
  { query: { status: 'available' } },
  {
    cacheKey: 'pets-available',
  }
)
```

## Reactive params

For GET requests, generated `useAsyncData` wrappers watch reactive URL and param sources by default.

```ts
const petId = ref(1)

const { data: pet } = useAsyncDataGetPetById(
  computed(() => ({
    path: { petId: petId.value },
  }))
)
```

You can disable that behavior with `watch: false`.

```ts
const { data, refresh } = useAsyncDataGetPetById(
  computed(() => ({
    path: { petId: petId.value },
  })),
  {
    watch: false,
  }
)
```

For mutations, automatic watch behavior is off by default unless you opt in with `watch: true`.

## Lifecycle callbacks

```ts
useAsyncDataGetPets({}, {
  onRequest: ({ headers }) => ({
    headers: {
      ...headers,
      'X-Request-ID': crypto.randomUUID(),
    },
  }),
  onSuccess: (pets) => {
    console.log(`Loaded ${pets.length} pets`)
  },
  onError: (error) => {
    console.error(error)
  },
  onFinish: ({ success }) => {
    console.log('Completed:', success)
  },
})
```

## Raw responses

Use the generated `Raw` variant when you need headers or status codes.

```ts
const { data: response } = useAsyncDataGetPetsRaw()

console.log(response.value?.status)
console.log(response.value?.headers)
console.log(response.value?.data)
```

## Related guides

- [Pagination](/composables/use-async-data/pagination)
- [Raw responses](/composables/use-async-data/raw-responses)
- [Shared features](/composables/features/)
