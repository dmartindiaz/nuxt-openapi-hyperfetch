# Getting Started

`nuxt-openapi-hyperfetch` is configured as a Nuxt module. You point it at a local OpenAPI file, choose the generators you want, and generation runs automatically during `nuxt dev` and `nuxt build`.

## Prerequisites

- Node.js 18 or newer
- Nuxt 3 project
- A local OpenAPI or Swagger document such as `swagger.yaml` or `openapi.yaml`

## 1. Install the module

```bash
npm install nuxt-openapi-hyperfetch
```

## 2. Register and configure it

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],
  openapi: {
    input: './swagger.yaml',
    output: './openapi',
    generators: ['useFetch', 'useAsyncData'],
  },
})
```

Notes:

- `openapi` is the module config key.
- `output` defaults to `./openapi`, but keeping it explicit makes examples easier to follow.
- `generators` defaults to `['useFetch', 'useAsyncData']`.

## 3. Start Nuxt

```bash
npm run dev
```

On startup, the module generates the selected outputs before the Nuxt build starts.

## 4. Inspect the generated output

With the configuration above, you will get an `openapi/` directory with the generated SDK plus the composables you enabled.

Typical structure:

```text
openapi/
  client/
  core/
  client.gen.ts
  index.ts
  sdk.gen.ts
  types.gen.ts
  composables/
    use-fetch/
    use-async-data/
```

## 5. Use a generated composable

```vue
<script setup lang="ts">
const { data: pet, error } = await useAsyncDataGetPetById({
  path: {
    petId: 123,
  },
})
</script>

<template>
  <div v-if="error">Request failed</div>
  <div v-else>{{ pet?.name }}</div>
</template>
```

The exact composable names depend on your OpenAPI `operationId` values.

## Common Next Configurations

- Add `nuxtServer` to `generators` if you also want server routes generated.
- Add `connectors` to `generators` if you want headless connectors on top of `useAsyncData`.
- Set `baseUrl` if your generated client composables should target a fixed upstream API base.

## Next Steps

- Continue with [Use as Nuxt Module](/guide/use-as-nuxt-module)
- Read [Core Concepts](/guide/core-concepts)
- Compare outputs in [Choosing a Generator](/guide/choosing-a-generator)
