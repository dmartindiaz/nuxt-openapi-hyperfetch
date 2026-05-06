# useFetch Basic Usage

Generated `useFetch` composables are typed Nuxt `useFetch` wrappers with shared runtime features.

## Basic request

```vue
<script setup lang="ts">
const { data: pet, pending, error } = useFetchGetPetById({
  path: { petId: 123 },
})
</script>

<template>
  <div v-if="pending">Loading...</div>
  <div v-else-if="error">{{ error.message }}</div>
  <div v-else>
    <h1>{{ pet?.name }}</h1>
    <p>Status: {{ pet?.status }}</p>
  </div>
</template>
```

## Mutations

```vue
<script setup lang="ts">
const form = ref({
  name: '',
  status: 'available',
})

const { execute: createPet, pending } = useFetchCreatePet(
  { body: form.value },
  {
    immediate: false,
    onSuccess: (pet) => {
      navigateTo(`/pets/${pet.id}`)
    },
  }
)
</script>
```

## Request interception

```ts
useFetchGetPets({}, {
  onRequest: ({ headers, query }) => ({
    headers: {
      ...headers,
      'X-Request-ID': crypto.randomUUID(),
    },
    query: {
      ...query,
      includeInactive: false,
    },
  }),
})
```

## `pick` and `transform`

```ts
const { data } = useFetchGetPetById(
  {
    path: { petId: 123 },
  },
  {
    pick: ['id', 'name', 'status'] as const,
    transform: (pet) => ({
      ...pet,
      label: `${pet.name} (${pet.status})`,
    }),
  }
)
```

## Global callback control

```ts
useFetchGetPublicPets({}, {
  skipGlobalCallbacks: true,
})

useFetchGetPetById(
  {
    path: { petId: 123 },
  },
  {
    skipGlobalCallbacks: ['onError'],
  }
)
```

## Pagination

With `useFetch`, `pagination` contains the state, while navigation helpers are returned at the top level.

```ts
const { data, pagination, nextPage, prevPage } = useFetchGetPets({}, {
  paginated: true,
})
```

## Type safety

```ts
useFetchGetPetById({ path: { petId: 123 } })

useFetchGetPetById({ path: { petId: 'abc' } })
```

The second call should fail in TypeScript because the generated SDK type for `petId` is not a string.

## Related guides

- [Configuration](/composables/use-fetch/configuration)
- [Callbacks](/composables/features/callbacks/overview)
- [Shared features](/composables/features/)
