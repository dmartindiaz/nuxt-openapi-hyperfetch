---
layout: home

hero:
  name: Nuxt OpenAPI Hyperfetch
  text: Nuxt-only OpenAPI generation
  tagline: Configure the module in nuxt.config.ts and generate a typed OpenAPI client, Nuxt composables, optional server routes, and headless connectors under openapi/.
  image:
    src: /logo.png
    alt: Nuxt OpenAPI Hyperfetch
  actions:
    - theme: brand
      text: 🚀 Get started
      link: /guide/getting-started
    - theme: alt
      text: 📦 View on npm
      link: https://www.npmjs.com/package/nuxt-openapi-hyperfetch
    - theme: alt
      text: 🐙 View on GitHub
      link: https://github.com/dmartindiaz/nuxt-openapi-hyperfetch

features:
  - icon: ⚙️
    title: Nuxt module workflow
    details: Generation is configured through nuxt.config.ts with the openapi module key. No product CLI is required.

  - icon: 🎯
    title: Typed OpenAPI client
    details: The generated openapi/ root exposes sdk.gen.ts, types.gen.ts, client.gen.ts, and a barrel index for direct client usage.

  - icon: 🟢
    title: Nuxt-native composables
    details: Generate useFetch and useAsyncData composables on top of the OpenAPI client with Nuxt-friendly wrappers and auto-import support.

  - icon: 🧩
    title: Headless UI connectors
    details: When enabled, connectors are layered on top of generated useAsyncData composables for list, detail, create, update, and delete flows.

  - icon: 🔒
    title: Server-first security with BFF
    details: Generate Nuxt server routes outside openapi/ and keep secrets on the server with auth context and transformer stubs.

  - icon: ♻️
    title: Safe regeneration workflow
    details: Re-generate when the spec changes without losing your custom server auth or transformer files.
---

## Quick Start

Install the package and configure the Nuxt module:

```bash
npm install nuxt-openapi-hyperfetch
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],

  openapi: {
    input: './swagger.yaml',
    output: './openapi',
    generators: ['useAsyncData', 'connectors', 'nuxtServer'],
    enableAutoImport: true,
  },
})
```

Run your Nuxt app or build and the module generates the requested artifacts before the Nuxt build lifecycle continues.

## What Gets Generated

The generated root is `openapi/`. It contains the OpenAPI client plus any enabled helper layers:

```text
openapi/
  index.ts
  sdk.gen.ts
  types.gen.ts
  client.gen.ts
  client/
  core/
  composables/
```

Depending on your `generators` configuration, `openapi/composables/` can contain:

- `useFetch` composables
- `useAsyncData` composables
- Headless CRUD connectors

When `nuxtServer` is enabled, server routes are generated outside `openapi/`, under `server/routes/api` by default.

## Generated Composables

With `useAsyncData` enabled, the generated composables are immediately usable from Nuxt:

```vue
<script setup lang="ts">
const { data: pet, pending, error } = await useAsyncDataGetPetById({
  path: { petId: 123 },
})

const { data: rawPet, status, headers } = await useAsyncDataGetPetByIdRaw({
  path: { petId: 123 },
})

watchEffect(() => {
  console.log(pet.value?.name)
  console.log(rawPet.value)
  console.log(status.value)
  console.log(headers.value)
})
</script>
```

If you enable `useFetch`, the module also generates the parallel `openapi/composables/use-fetch/` tree.

## Server Routes and Connectors

Optional generators stay explicit:

- `nuxtServer` writes route handlers to `server/routes/api` by default
- `connectors` depends on `useAsyncData` and writes connector composables under `openapi/composables/connectors`

Those layers are additive. You can keep the generated OpenAPI client only, add composables, or add server routes and connectors on top.

## Base URL Configuration

Generated composables and connectors can read the public runtime base URL from Nuxt:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://api.example.com',
    },
  },
})
```

## Connectors

<div class="vp-doc">

A connector groups CRUD behavior for one resource in one composable when the `connectors` generator is enabled.

```ts
const { getAll, get, create, update, del } = usePetsConnector()
```

This gives you a clean base for tables, detail views, forms, and delete flows without wiring each operation manually.

- `getAll`: list with SSR (`useAsyncData`)
- `get`: load one item by ID
- `create`: validated create form
- `update`: validated update form
- `del`: staged delete with confirmation

Read more:

- [Connectors Overview](/connectors/)
- [OpenAPI Conventions for Connectors](/connectors/openapi-conventions)

</div>

## What's Next?

<div class="vp-doc">

- **New here?** Start with the [Getting Started Guide](/guide/getting-started)
- **Choosing a generator?** Read [useFetch vs useAsyncData vs Server Routes](/guide/choosing-a-generator)
- **Understanding how generation works?** Read [Core Concepts](/guide/core-concepts)
- **Need the architecture view?** Start at [Architecture](/architecture/)
- **Using connectors?** Start at [Connectors](/connectors/)

</div>
