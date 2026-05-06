# Callbacks

Connector callbacks are split across global rules, connector-level options, and per-operation handlers.

## Callback layers

| Layer | Where defined | Applies to |
|---|---|---|
| Global rules | Nuxt plugin via `getGlobalApiCallbacks` | `$fetch`-based connector operations |
| Connector-level options | Second argument to `usePetsConnector()` | Fetch-based operations in that connector instance |
| Per-operation handlers | `get.onSuccess(fn)`, `create.onError(fn)`, and similar | One specific sub-connector |

`getAll` is different because it is backed by `useAsyncData` rather than `$fetch`.

## Global rules

The fetch-based connector runtimes call `mergeCallbacks()` from the shared runtime. That merges global callback rules with connector-level options.

Global rules come from a Nuxt plugin that provides `getGlobalApiCallbacks`.

```ts
export default defineNuxtPlugin(() => ({
  provide: {
    getGlobalApiCallbacks: () => [
      {
        onRequest: ({ headers }) => ({
          headers: {
            ...headers,
            Authorization: `Bearer ${useAuthStore().token}`,
          },
        }),
      },
      {
        onError: (err) => {
          useToast().add({
            title: 'Request failed',
            description: err.message,
            color: 'red',
          })
        },
      },
    ],
  },
}))
```

These rules are used by:

- `get`
- `create`
- `update`
- `del`

They are not used by `getAll`.

## Connector-level options

Generated connectors can expose these fetch callback options:

- `onRequest`
- `onSuccess`
- `onError`
- `onFinish`
- `skipGlobalCallbacks`

Example:

```ts
const { getAll, create, update, del } = usePetsConnector({}, {
  onRequest: () => ({
    headers: { 'X-Request-Source': 'pets-page' },
  }),
  onSuccess: (_data, ctx) => {
    if (ctx.operation !== 'get') {
      void getAll.load()
    }
  },
  onError: (err, ctx) => {
    console.error(ctx.operation, err)
  },
})
```

The context includes an operation name such as `'get'`, `'create'`, `'update'`, or `'delete'`.

## Per-operation handlers

The fetch-based sub-connectors expose registration functions:

```ts
const { get, create, update, del } = usePetsConnector()

get.onSuccess((item) => {
  console.log('Loaded', item)
})

create.onSuccess((item) => {
  console.log('Created', item)
})

update.onError((err) => {
  console.error('Update failed', err)
})

del.onSuccess((item) => {
  console.log('Deleted', item)
})
```

Registering a new handler replaces the previous one for that sub-connector.

These per-operation handlers always run after the merged global and connector-level callbacks. They are not suppressed by `skipGlobalCallbacks` and they do not depend on global rules.

## Request modification

Global rules and connector-level `onRequest` handlers can return request modifications such as:

```ts
{
  headers: { 'X-Tenant': 'acme' },
  query: { locale: 'es' },
  body: { ...payload, source: 'web' },
}
```

That merged result is then passed to `$fetch`.

## `skipGlobalCallbacks`

Use `skipGlobalCallbacks` to bypass global rules for one connector instance.

```ts
usePetsConnector({}, { skipGlobalCallbacks: true })
usePetsConnector({}, { skipGlobalCallbacks: ['onSuccess'] })
usePetsConnector({}, { skipGlobalCallbacks: ['onRequest', 'onError'] })
```

## `getAll` callbacks

`getAll` does not use callback registration functions. It exposes assignable refs instead:

```ts
const { getAll } = usePetsConnector()

getAll.onSuccess.value = (items) => {
  console.log('Loaded', items.length)
}

getAll.onError.value = (err) => {
  console.error(err)
}
```

Those callbacks run after `getAll.load()` refreshes the underlying `useAsyncData` composable.

## Practical pattern

The common pattern is:

- global rules for cross-cutting concerns such as auth and generic error handling
- connector-level options for page-level behavior
- per-operation handlers for tightly local UI reactions
