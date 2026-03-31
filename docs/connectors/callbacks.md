# Callbacks

Connectors have a **three-tier callback system**. Each tier has different scope and priority:

| Tier | Where defined | Scope | Can be suppressed? |
|---|---|---|---|
| **Global rules** | `api-callbacks.plugin.ts` | All API calls in the entire app | No — they always run |
| **Connector-level options** | Second argument to `usePetsConnector` | All mutations in that connector | Yes — a global rule returning `false` suppresses them |
| **Per-operation registration** | `create.onSuccess(fn)`, `del.onSuccess(fn)`, etc. | One specific operation | No — they always fire |

---

## Tier 1 — Global rules

Global rules are registered once in a Nuxt plugin and apply automatically to every API call across the whole application (connectors and composables alike). They are the right place for cross-cutting concerns: auth headers, error toasts, analytics.

```ts
// plugins/api-callbacks.plugin.ts (generated)
defineGlobalApiCallbacks([
  {
    // Attach auth header to every request
    onRequest: (ctx) => ({
      headers: { Authorization: `Bearer ${useAuthStore().token}` }
    }),
  },
  {
    // Show a generic error notification on every failure
    onError: (err) => {
      useToast().add({ title: 'Request failed', description: err.message, color: 'red' })
    }
  }
])
```

### onRequest — modifying the request

Returning an object from `onRequest` **modifies the actual request** sent to the server. The following fields are accepted:

```ts
onRequest: (ctx) => ({
  headers: { 'X-Tenant-Id': 'my-tenant' },  // merged with existing headers
  query:   { locale: 'es' },                 // merged with existing query params
  body:    { ...ctx.body, _source: 'web' },  // replaces body (last-write-wins)
})
```

Headers and query params are **deep-merged** across rules. Body is last-write-wins.

### Suppressing a lower-tier callback

Any rule callback can return `false` to prevent the connector-level option callback from running:

```ts
defineGlobalApiCallbacks([
  {
    patterns: ['/pet/**'],
    onSuccess: () => {
      // handle it globally — tell the connector not to run its own onSuccess
      return false
    }
  }
])
```

This does **not** suppress per-operation registration callbacks (tier 3).

### URL pattern and method filtering

Rules can be scoped to specific URLs or methods:

```ts
defineGlobalApiCallbacks([
  {
    patterns: ['/pet/**', '/user/**'],
    methods: ['DELETE'],
    onSuccess: (item) => {
      // only fires for DELETE requests to /pet/... or /user/...
      analytics.track('item_deleted', { resource: item })
    }
  }
])
```

---

## Tier 2 — Connector-level options

Options passed directly to `usePetsConnector` apply to all mutations in that connector instance.

```ts
const { getAll, create, update, del } = usePetsConnector({}, {
  onRequest: (ctx) => ({
    headers: { 'X-Request-Source': 'pets-page' }
  }),
  onSuccess: (data, ctx) => {
    console.log(`[pets] ${ctx.operation} succeeded`, data)
    getAll.load()
  },
  onError: (err, ctx) => {
    toast.error(`${ctx.operation} failed: ${err.message}`)
  },
  onFinish: (ctx) => {
    console.log('finished', ctx.success)
  }
})
```

The `ctx` object includes `{ operation: 'create' | 'update' | 'delete' | 'get' }`.

The connector-level `onSuccess` fires for **all** mutations. If you need different behaviour per operation, use per-operation registration (tier 3) instead.

### `onRequest` in connector options

Same as global rules — you can return modified context:

```ts
const { create } = usePetsConnector({}, {
  onRequest: (ctx) => ({
    headers: { 'X-Form-Source': 'create-pet' }
  })
})
```

The connector-level `onRequest` runs **after** global rules and takes **highest priority** when merging headers.

---

## Tier 3 — Per-operation registration

Each sub-connector exposes a registration function for a callback that fires independently, after tiers 1 and 2, and is **never suppressed**:

```ts
const { getAll, create, update, del } = usePetsConnector()

// These always fire — no global rule can suppress them
create.onSuccess((newPet) => {
  getAll.load()
  toast.success(`"${newPet.name}" added`)
})

update.onSuccess((updatedPet) => {
  getAll.load()
})

del.onSuccess((deletedPet) => {
  getAll.load()
  toast.success(`"${deletedPet.name}" deleted`)
})

del.onError((err) => {
  toast.error('Could not delete: ' + err.message)
})
```

Calling `onSuccess(fn)` replaces the previous handler. To remove a handler, pass `null`:

```ts
create.onSuccess(null)
```

> `get.onSuccess(fn)` also exists and follows the same pattern.

---

## Execution order

For a `create.execute()` call:

```
1. Global onRequest rules (in definition order)
      → headers/body/query modifications are merged
2. Connector-level onRequest option
      → its modifications override globals at same keys
3. $fetch(...) is called with the merged options

   → on success:
4. Global onSuccess rules (in order)
      → any returning false suppresses step 5
5. Connector-level onSuccess option (if not suppressed)
6. create.onSuccess(fn) registration ← always fires

   → on error:
4. Global onError rules (in order)
5. Connector-level onError option (if not suppressed)
6. create.onError(fn) registration ← always fires

7. onFinish (global rules, then connector-level option)
```

---

## Skipping global callbacks

Use `skipGlobalCallbacks` to opt out of global rules for a specific connector:

```ts
// Skip all global rules for this connector
usePetsConnector({}, { skipGlobalCallbacks: true })

// Skip only global onSuccess
usePetsConnector({}, { skipGlobalCallbacks: ['onSuccess'] })

// Skip multiple
usePetsConnector({}, { skipGlobalCallbacks: ['onRequest', 'onError'] })
```

This is useful when a page has its own auth flow, custom error handling, or analytics that should not double-fire with the global ones.

---

## Practical example — full page with callbacks

```vue
<script setup lang="ts">
const toast = useToast()
const { getAll, create, update, del } = usePetsConnector()

// Reload the list after every mutation
const refreshList = () => getAll.load()

create.onSuccess((pet) => {
  refreshList()
  toast.add({ title: `${pet.name} added`, color: 'green' })
})

update.onSuccess((pet) => {
  refreshList()
  toast.add({ title: `${pet.name} updated`, color: 'blue' })
})

del.onSuccess((pet) => {
  refreshList()
  toast.add({ title: `${pet.name} deleted`, color: 'yellow' })
})

// Single error handler for all mutations
create.onError(handleError)
update.onError(handleError)
del.onError(handleError)

function handleError(err) {
  toast.add({
    title: 'Something went wrong',
    description: err?.message ?? String(err),
    color: 'red',
  })
}
</script>
```

---

## `getAll` callbacks

`getAll` uses a different callback pattern because it is backed by `useAsyncData` rather than `$fetch`. Its callbacks are `Ref`s, not registration functions:

```ts
// getAll — assign with .value
getAll.onSuccess.value = (items) => {
  console.log(`Loaded ${items.length} pets`)
}

getAll.onError.value = (err) => {
  toast.error('Failed to load pets')
}
```

Global callbacks are **not** integrated with `getAll` — only with the `$fetch`-based sub-connectors (`get`, `create`, `update`, `del`).
