<p align="center">
  <img src="https://raw.githubusercontent.com/dmartindiaz/nuxt-openapi-hyperfetch/main/public/nuxt-openapi-hyperfetch-logo.png" alt="Nuxt OpenAPI Hyperfetch logo" width="260" />
</p>

<p align="center">
  <strong>Generate type-safe CRUD composables from your OpenAPI spec.</strong><br/>
  One command. Full TypeScript. SSR-ready.
</p>

<p align="center">
  <a href="https://nuxt-openapi-hyperfetch.netlify.app/">📖 Documentation</a> ·
  <a href="#connectors">Connectors</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#quick-start">Quick Start</a>
</p>

---

## Installation

```bash
# Global CLI
npm install -g nuxt-openapi-hyperfetch

# Or as a Nuxt module (dev dependency)
npm install -D nuxt-openapi-hyperfetch
```

---

## What it does

Point it at an OpenAPI spec, pick an output folder, run one command. You get four kinds of output:

- **`useFetch` composables** — one per endpoint, reactive, bound to template lifecycle
- **`useAsyncData` composables** — SSR-compatible, awaitable, ideal for page-level data
- **Nuxt Server Routes** — generated proxy endpoints that keep API keys server-side
- **Connectors** — headless UI composables (one per resource tag) that combine list, detail, create, update, and delete into a single import — with Zod validation, modal state, reactive params, and pagination built in

All output is 100% Nuxt-native. No runtime dependencies in the generated code.

---

## Also generates: `useFetch` and `useAsyncData` composables

One composable per endpoint, for when you need direct control:

```ts
// useFetch — reactive, bound to template lifecycle
const { data: pet, pending, error } = useFetchGetPetById({ petId: 123 })

// useAsyncData — SSR-compatible, awaitable
const { data: pets } = await useAsyncDataFindPets({ status: 'available' })
```

With callbacks and request modification:

```ts
// useFetch — onRequest receives ctx and must return modifications
const { data } = useFetchFindPets(
  { status: 'available' },
  {
    onRequest: (ctx) => {
      // ctx: { url, method, headers, query, body }
      return { headers: { 'X-Source': 'pets-page' } }
    },
    onSuccess: (pets) => console.log(`${pets.length} pets loaded`),
    onError: (err) => console.error(err.message),
    onFinish: ({ success }) => console.log('Done:', success),
  }
)

// useAsyncData — onSuccess and onError receive a second context argument
const { data: pets } = await useAsyncDataFindPets(
  { status: 'available' },
  {
    onRequest: (ctx) => ({ headers: { 'X-Source': 'pets-page' } }),
    onSuccess: (pets, ctx) => console.log(`${pets.length} from ${ctx.url}`),
    onError: (err, ctx) => console.error(err.message, ctx.url),
  }
)
```

---

## Also generates: Nuxt Server Routes

Proxy endpoints to keep API keys server-side:

```
Client → Nuxt Server Route (generated) → External API
```

```ts
// Works automatically after generation
const { data } = useFetch('/api/pet/123')
```

---

## Connectors

A connector exposes five sub-composables for one resource. For a `pet` tag in your spec:

```ts
const { getAll, get, create, update, del } = usePetsConnector()
```

### Full CRUD page in one component

```vue
<script setup lang="ts">
const { getAll, create, update, del } = usePetsConnector()

// Reload the list after every mutation
create.onSuccess(() => getAll.load())
update.onSuccess(() => getAll.load())
del.onSuccess(()    => getAll.load())
</script>

<template>
  <!-- List -->
  <UTable
    :columns="getAll.columns.value"
    :rows="getAll.items.value"
    :loading="getAll.loading.value"
  >
    <template #actions-data="{ row }">
      <UButton @click="update.ui.open(row)">Edit</UButton>
      <UButton color="red" @click="del.ui.open(row)">Delete</UButton>
    </template>
  </UTable>

  <!-- Create -->
  <UButton @click="create.ui.open()">Add pet</UButton>
  <UModal v-model:open="create.ui.isOpen.value">
    <UCard>
      <UFormField label="Name" :error="create.errors.value.name?.[0]">
        <UInput v-model="create.model.value.name" />
      </UFormField>
      <UFormField label="Status">
        <USelect v-model="create.model.value.status"
          :options="['available','pending','sold']" />
      </UFormField>
      <template #footer>
        <UButton :loading="create.loading.value" @click="create.execute()">Save</UButton>
      </template>
    </UCard>
  </UModal>

  <!-- Edit -->
  <UModal v-model:open="update.ui.isOpen.value">
    <UCard>
      <UInput v-model="update.model.value.name" />
      <template #footer>
        <UButton :loading="update.loading.value"
          @click="update.execute(update.model.value.id)">Save changes</UButton>
      </template>
    </UCard>
  </UModal>

  <!-- Delete confirmation -->
  <UModal v-model:open="del.ui.isOpen.value">
    <UCard>
      <p>Delete <strong>{{ del.staged.value?.name }}</strong>?</p>
      <template #footer>
        <UButton color="red" :loading="del.loading.value" @click="del.execute()">Delete</UButton>
        <UButton variant="outline" @click="del.ui.close()">Cancel</UButton>
      </template>
    </UCard>
  </UModal>
</template>
```

### What each sub-connector provides

| Key | Transport | What you get |
|---|---|---|
| `getAll` | `useAsyncData` | `items`, `columns`, `loading`, `error`, `pagination`, `selected`, `load()` |
| `get` | `$fetch` | `data`, `loading`, `error`, `load(id)`, `clear()` |
| `create` | `$fetch` | `model`, `errors`, `isValid`, `execute()`, `reset()`, `ui.open/close` |
| `update` | `$fetch` | Same as create + `load(id)`, `ui.open(row)`, `targetId` |
| `del` | `$fetch` | `staged`, `hasStaged`, `execute()`, `ui.open(item)/close` |

### Reactive list parameters

```ts
const status = ref('available')

// Re-fetches automatically when status changes
const { getAll } = usePetsConnector(() => ({ status: status.value }))
```

### Zod validation, out of the box

Schemas are generated from your OpenAPI `requestBody`. `create.execute()` validates before sending — the network call is never made if the data is invalid.

```ts
// Extend the generated schema for extra rules
const { create } = usePetsConnector({}, {
  createSchema: (base) => base.extend({
    name: z.string().min(2, 'At least 2 characters'),
  })
})
```

### Global callbacks

Register once, applies to every API call in the app:

```ts
// plugins/api-callbacks.plugin.ts
defineGlobalApiCallbacks([
  {
    onRequest: (ctx) => ({
      headers: { Authorization: `Bearer ${useAuthStore().token}` }
    }),
    onError: (err) => useToast().add({ title: err.message, color: 'red' }),
  }
])
```

Connector-level and per-operation callbacks are also available — see [Callbacks docs](./docs/connectors/callbacks.md).

---

## Quick Start

### CLI

<p align="center">
  <img src="https://raw.githubusercontent.com/dmartindiaz/nuxt-openapi-hyperfetch/main/public/nuxt-openapi-hyperfetch-cli.png" alt="Nuxt OpenAPI Hyperfetch CLI" width="720" />
</p>

```bash
nxh generate
# or with arguments:
nxh generate -i ./swagger.yaml -o ./composables/api
```

The CLI asks for your spec path, output folder, engine (`heyapi` or `official`), and which generators to run.

### Nuxt module

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],

  openApiHyperFetch: {
    input: './swagger.yaml',
    output: './composables/api',
    generators: ['useFetch', 'useAsyncData', 'nuxtServer'],
    backend: 'heyapi',
    enableAutoImport: true,
  },
})
```

### Configure the base URL

```ts
// nuxt.config.ts
runtimeConfig: {
  public: { apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://api.example.com' }
}
```

All generated composables and connectors pick up `apiBaseUrl` automatically.

---

## Two generation engines

| Engine | Requires | Best for |
|---|---|---|
| `heyapi` | Node only | Quick setup, CI/CD |
| `official` | Java 11+ | Maximum spec compatibility |

Pre-select in `nxh.config.js` to skip the prompt:

```js
export default { generator: 'heyapi', input: './swagger.yaml', output: './api' }
```

---

## Documentation

| | |
|---|---|
| [Connectors](./docs/connectors/index.md) | Full connector API reference and examples |
| [Quick Start](./docs/QUICK-START.md) | From zero to working composables in 5 minutes |
| [API Reference](./docs/API-REFERENCE.md) | All options and TypeScript types |
| [Architecture](./docs/ARCHITECTURE.md) | How the generator works internally |
| [Troubleshooting](./docs/TROUBLESHOOTING.md) | Common errors and solutions |

---

## Contributing

```bash
npm install
npm run build
npm run validate   # lint + type check
```

See [CONTRIBUTING.md](./CONTRIBUTING.md).


---

## License

Apache-2.0 — see [LICENSE](./LICENSE) for details.
