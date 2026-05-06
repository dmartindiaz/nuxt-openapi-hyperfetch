# Connectors

Connectors are optional CRUD helpers generated on top of the `useAsyncData` wrappers and the shared runtime.

## Overview

For each inferred resource, the generator can emit one composable such as `usePetsConnector()`.

```ts
const { getAll, get, create, update, del } = usePetsConnector()
```

The parent connector only groups sub-connectors. Each sub-connector keeps its own state, actions, and callbacks.

## When they are generated

Connectors are considered requested when any of these is true:

- `generators` includes `'connectors'`
- `createUseAsyncDataConnectors === true`
- `connectors` contains meaningful configuration

When that happens, the module also enables `useAsyncData` generation, because `getAll` depends on the generated `useAsyncData{Operation}` composable.

## Generated output

When enabled, connector files are written to:

```text
openapi/composables/connectors/
```

The runtime helpers they depend on are copied to:

```text
openapi/runtime/
```

That output path is important: connectors do not generate their own isolated runtime folder under `openapi/composables/connectors`.

The current `openapi/` snapshot in this repository does not include `composables/connectors/`, so this section documents supported generation behavior, not files present in the sample output committed today.

## Sub-connectors

| Key | Transport | Purpose |
|---|---|---|
| `getAll` | `useAsyncData` | SSR-friendly list loading, pagination passthrough, selection state |
| `get` | `$fetch` | Imperative single-item fetch |
| `create` | `$fetch` | Create form with optional Zod validation |
| `update` | `$fetch` | Update form with load and prefill support |
| `del` | `$fetch` | Delete flow with staging and confirmation UI |

`getAll` is the only connector backed by `useAsyncData`. The others use `$fetch` directly.

## Connector options

Generated connectors can expose options such as:

- `baseURL`
- `columnLabels`
- `columnLabel`
- `getAllRequestOptions`
- `createSchema`
- `updateSchema`
- `onRequest`
- `onSuccess`
- `onError`
- `onFinish`
- `skipGlobalCallbacks`

The exact option surface depends on which operations exist for that resource.

## Typical usage

```ts
const { getAll, create, update, del } = usePetsConnector({}, {
  onSuccess: (_data, ctx) => {
    if (ctx.operation !== 'get') {
      void getAll.load()
    }
  },
})

create.onSuccess(() => void getAll.load())
update.onSuccess(() => void getAll.load())
del.onSuccess(() => void getAll.load())
```

## Setup constraint

Because `getAll` initializes a `useAsyncData` composable internally, `usePetsConnector()` should be created in setup context.

```vue
<script setup lang="ts">
const { getAll, create } = usePetsConnector()
</script>
```

## Related pages

- [Connector configuration](./connector-configuration.md)
- [OpenAPI conventions](./openapi-conventions.md)
- [Callbacks](./callbacks.md)
- [getAll](./get-all.md)
- [get](./get.md)
- [create](./create.md)
- [update](./update.md)
- [delete](./delete.md)
