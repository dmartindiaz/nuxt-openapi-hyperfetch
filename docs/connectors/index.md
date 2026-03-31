# Connectors

> Headless CRUD composables auto-generated from your OpenAPI spec.

A **connector** is a single composable that groups all CRUD operations for one resource. For a `pet` tag in your spec, the generator produces `usePetsConnector` — a function that returns five sub-connectors, each responsible for one operation.

```ts
const { getAll, get, create, update, del } = usePetsConnector()
```

There are no stores, no event buses, no mixins. Each sub-connector is a self-contained reactive unit. The parent connector just groups them and threads shared options (base URL, callbacks, schemas) through to each one.

---

## The five sub-connectors

| Key | Transport | When to use |
|---|---|---|
| [`getAll`](./get-all.md) | `useAsyncData` | Render a table or list. SSR-compatible, reactive, supports pagination and row selection. |
| [`get`](./get.md) | `$fetch` | Fetch one item by ID. Imperative — nothing runs until you call `load(id)`. |
| [`create`](./create.md) | `$fetch` | POST form with Zod validation, UI state, and auto-close. |
| [`update`](./update.md) | `$fetch` | PUT/PATCH form. Pre-fills from a row or from a fresh server fetch. |
| [`del`](./delete.md) | `$fetch` | DELETE with staging pattern and confirmation dialog lifecycle. |

`getAll` uses `useAsyncData` because lists are rendered on the server and need Nuxt's SSR/hydration system.  
Mutations use `$fetch` directly so they are never cached and can always be called imperatively, multiple times.

---

## Generated structure

For each resource (grouped by OpenAPI tag), the generator produces one composable file:

```
composables/
  connectors/
    index.ts                    ← barrel export
    use-pets-connector.ts       ← usePetsConnector
    use-users-connector.ts      ← useUsersConnector
  runtime/                      ← runtime helpers (copied as source, not bundled)
    connector-types.ts
    useGetAllConnector.ts
    useGetConnector.ts
    useCreateConnector.ts
    useUpdateConnector.ts
    useDeleteConnector.ts
    zod-error-merger.ts
```

---

## Basic usage

```vue
<script setup lang="ts">
const { getAll, create, update, del } = usePetsConnector()
</script>
```

### Reactive query parameters

Pass a static object, or a factory function for watch-driven re-fetching:

```vue
<script setup lang="ts">
const status = ref('available')

// Factory: when status changes, getAll re-fetches automatically
const { getAll } = usePetsConnector(() => ({ status: status.value }))
</script>
```

---

## Connector options

All options are passed as the second argument (or first, if no params):

```ts
const { getAll, create, update, del } = usePetsConnector(params, {
  baseURL: 'https://api.myapp.com',
  onSuccess: (data, ctx) => toast.success(`${ctx.operation} succeeded`),
  onError:   (err, ctx)  => toast.error(err.message),
  onFinish:  (ctx)       => console.log('request finished', ctx.success),
})
```

| Option | Type | Description |
|---|---|---|
| `baseURL` | `string` | Base URL for all mutations (`$fetch`). Defaults to `runtimeConfig.public.apiBaseUrl`. |
| `columnLabels` | `Record<string, string>` | Override column labels by key. |
| `columnLabel` | `(key: string) => string` | Function-based column label override (useful for i18n). |
| `createSchema` | `ZodTypeAny \| (base) => ZodTypeAny` | Override or extend the generated Zod schema for `create`. |
| `updateSchema` | `ZodTypeAny \| (base) => ZodTypeAny` | Override or extend the generated Zod schema for `update`. |
| `onRequest` | `(ctx) => void \| ModifiedRequestContext` | Called before each mutation. Return `{ headers, body, query }` to modify the request. |
| `onSuccess` | `(data, ctx) => void` | Called after any successful mutation (`create`, `update`, `del`). |
| `onError` | `(err, ctx) => void` | Called after any failed mutation. |
| `onFinish` | `(ctx) => void` | Called after any mutation, success or failure. |
| `skipGlobalCallbacks` | `boolean \| string[]` | Skip global API callback rules for all mutations in this connector. |

The `ctx` object passed to `onSuccess` and `onError` includes `{ operation: 'create' | 'update' | 'delete' | 'get' }`, so you can differentiate mutations if needed in a shared handler.

---

## Per-operation callbacks

In addition to connector-level options, each mutation sub-connector exposes a registration function for callbacks that are **always** called regardless of global callback rules:

```ts
const { getAll, create, update, del } = usePetsConnector()

create.onSuccess((newPet) => {
  getAll.load()
  toast.success(`"${newPet.name}" created`)
})

update.onSuccess((updatedPet) => {
  getAll.load()
})

del.onSuccess((deletedPet) => {
  getAll.load()
  toast.success(`"${deletedPet.name}" deleted`)
})
```

See [Callbacks](./callbacks.md) for a full explanation of the three-tier callback system (global rules → connector-level options → per-operation registration).

---

## Coordinating after mutations

The typical pattern: reload the list after any write.

```vue
<script setup lang="ts">
const { getAll, create, update, del } = usePetsConnector()

// Reload the list after every mutation
create.onSuccess(() => getAll.load())
update.onSuccess(() => getAll.load())
del.onSuccess(()    => getAll.load())
</script>
```

Or use the connector-level option if you want a single shared handler:

```ts
const { getAll, create, update, del } = usePetsConnector({}, {
  onSuccess: () => getAll.load(),
})
```

> Note: `onSuccess` at the connector level fires for **all** mutations. Use per-operation callbacks when you need different logic per operation.

---

## `setup()` constraint

`getAll` calls `useAsyncData` internally. That call must happen at the top level of `<script setup>` — not inside a function or lifecycle hook.

```vue
<script setup lang="ts">
// ✅ Correct
const { getAll, create } = usePetsConnector()

// ❌ Wrong — useAsyncData must run in setup context
onMounted(() => {
  const { getAll } = usePetsConnector()
})
</script>
```


A **connector** is a single composable that wires together all CRUD operations for one resource. For a `pet` tag in your spec, the generator produces `usePetsConnector` — a function that returns five sub-connectors, each focused on one operation.

```ts
const { getAll, get, create, update, del } = usePetsConnector()
```

There are no global stores, no mixins, no event buses. Each sub-connector is a self-contained reactive unit. The parent connector just groups them.

---

## Generated structure

For each resource (grouped by OpenAPI tag), the generator produces one file:

```
composables/
  connectors/
    index.ts                   ← barrel export
    use-pets-connector.ts      ← usePetsConnector
    use-users-connector.ts     ← useUsersConnector
  runtime/                     ← copied runtime helpers
    connector-types.ts
    useGetAllConnector.ts
    useGetConnector.ts
    useCreateConnector.ts
    useUpdateConnector.ts
    useDeleteConnector.ts
    zod-error-merger.ts
```

The runtime helpers are copied as `.ts` source files so Nuxt/Vite can resolve and type-check them alongside your project.
