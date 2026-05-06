# Composables Issues

This page covers missing exports, bad imports, reactive pitfalls, and callback confusion in the generated client layer.

## Composable is missing

Most often one of these is true:

- the matching generator is not enabled
- the composable name is based on a different `operationId`
- the app is importing from an old path

Current generated output lives under `openapi/composables/` by default.

Examples:

```text
openapi/composables/use-async-data/
openapi/composables/use-fetch/
openapi/composables/connectors/
```

If a folder is missing, verify `openapi.generators` first.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],
  openapi: {
    input: './swagger.yaml',
    generators: ['useFetch', 'useAsyncData'],
    enableAutoImport: true,
  },
})
```

## Import path is wrong

Use either auto-imported composables, or import from the generated `openapi/` tree.

```ts
import { useAsyncDataGetPetById } from '~/openapi/composables/use-async-data'
import type { GetPetByIdData, Pet } from '~/openapi'
```

If auto-import is enabled, you can call the composable directly without importing it manually.

## Export name is different than expected

Composable names are derived from the OpenAPI `operationId`.

For example, an operation with `operationId: getPetById` generates names like:

```ts
useAsyncDataGetPetById
useAsyncDataGetPetByIdRaw
useFetchGetPetById
useFetchGetPetByIdRaw
```

If you expected shorter resource-based names, inspect the actual generated index first.

## `useAsyncData` composable does not accept the parameters you passed

Generated `useAsyncData` composables do not take a custom fetch handler. They wrap the request for you.

This is wrong for the current generator output:

```ts
useAsyncDataPets('pets', async () => {
  return await $fetch('/api/pets')
})
```

Use the generated signature instead:

```ts
const params = computed<GetPetByIdData>(() => ({
  path: {
    petId: Number(route.params.id),
  },
}))

const { data, error } = useAsyncDataGetPetById(params)
```

Many generated composables also support a custom cache key as the first argument.

```ts
const { data } = useAsyncDataGetPetById('pet-detail', {
  path: { petId: 1 },
})
```

## Reactive params do not trigger a refresh

Pass a `ref` or `computed`, not a frozen snapshot.

```ts
const petId = ref(1)

const params = computed<GetPetByIdData>(() => ({
  path: { petId: petId.value },
}))

const { data } = useAsyncDataGetPetById(params)

petId.value = 2
```

If you pass a plain object created once, the request will not react to later state changes.

## Auto-imports do not work

Auto-import depends on both module setup and generation output.

Check all of these:

1. `enableAutoImport` is not `false`
2. the relevant generator is enabled
3. generation actually ran for the current command
4. the app was restarted after a large output layout change

If needed, import from `~/openapi/composables/...` directly to confirm the generated file exists.

## Data is always undefined

When a generated composable returns no data, usually the request itself failed.

Inspect the error state before assuming the composable is broken.

```ts
const { data, error, status } = useAsyncDataGetPetById({
  path: { petId: 1 },
})

console.log(status.value)
console.log(error.value)
```

The most common root cause is a missing base URL:

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://api.example.com',
    },
  },
})
```

You can also pass `baseURL` per call.

## Global headers are not applied

The runtime looks for global headers in one of these forms:

1. a user composable named `useApiHeaders()`
2. a Nuxt plugin that provides `$getApiHeaders`

Example composable:

```ts
export const useApiHeaders = () => () => {
  const token = useCookie('token')

  return token.value
    ? { Authorization: `Bearer ${token.value}` }
    : {}
}
```

If your app uses another name, generated requests will not see it automatically.

## Global callbacks are not firing

The runtime reads global callback rules from a Nuxt plugin that provides `getGlobalApiCallbacks`.

```ts
export default defineNuxtPlugin(() => {
  const globalCallbacks = [
    {
      onError: (error: unknown) => {
        console.error(error)
      },
    },
  ]

  return {
    provide: {
      getGlobalApiCallbacks: () => globalCallbacks,
    },
  }
})
```

If your plugin provides another property name, the runtime will ignore it.

## Local callback never runs

Check both the local callback and the global callback chain.

- a failing request will skip local success handling
- a global callback may intentionally stop later execution
- the operation may be returning an error payload you are not logging yet

Start by logging `error.value` and keeping the local callback minimal.

## SSR output does not match the browser

Hydration issues are usually rendering issues, not generator issues.

Render a stable loading state before using the data.

```vue
<script setup lang="ts">
const { data, pending } = useAsyncDataGetPetById({
  path: { petId: 1 },
})
</script>

<template>
  <div v-if="pending">Loading...</div>
  <div v-else-if="data">{{ data.name }}</div>
</template>
```

## Checklist

When a generated composable looks broken, verify in this order:

1. the required generator is enabled
2. generation output exists under `openapi/composables/`
3. the export name matches the real `operationId`
4. imports use the generated `openapi/` tree or auto-import
5. `runtimeConfig.public.apiBaseUrl` is set, or `baseURL` is passed manually
6. global headers and callbacks use the exact names the runtime reads

## Related pages

- [Build issues](/troubleshooting/build-issues)
- [Runtime errors](/troubleshooting/runtime-errors)
- [Type errors](/troubleshooting/type-errors)
