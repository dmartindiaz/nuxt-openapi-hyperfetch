# `getAll`

`getAll` is the list sub-connector. It wraps one generated `useAsyncData{Operation}` composable and exposes a list-oriented API on top of it.

It is the only connector operation that is SSR-aware.

## State

| Property | Type | Description |
|---|---|---|
| `items` | computed | Array extracted from the underlying response |
| `columns` | computed | Column metadata inferred from schema analysis |
| `loading` | computed | Mirrors `pending` from the wrapped `useAsyncData` composable |
| `error` | computed | Mirrors the wrapped composable error |
| `pagination` | computed | Passthrough to wrapped pagination state when available |
| `selected` | ref | Local selected rows |

`items` supports both:

- direct array responses
- object responses with a `data` array

## Actions

| Method | Description |
|---|---|
| `load()` | Calls `refresh()` on the wrapped `useAsyncData` composable |
| `goToPage(page)` | Calls wrapped pagination `goToPage()` when available |
| `nextPage()` | Calls wrapped pagination `nextPage()` when available |
| `prevPage()` | Calls wrapped pagination `prevPage()` when available |
| `setPerPage(n)` | Calls wrapped pagination `setPerPage()` when available |
| `select(item)` | Adds an item to `selected` |
| `deselect(item)` | Removes an item from `selected` |
| `toggleSelect(item)` | Toggles membership in `selected` |
| `clearSelection()` | Empties `selected` |

## Callbacks

`getAll` exposes assignable refs:

```ts
const { getAll } = usePetsConnector()

getAll.onSuccess.value = (items) => {
  console.log(items)
}

getAll.onError.value = (err) => {
  console.error(err)
}
```

Those callbacks are independent from the global callback system used by the `$fetch`-based sub-connectors.

## Parameter shape

The connector passes its first argument through to the generated `useAsyncData` wrapper.

That means the exact request shape comes from the generated wrapper for the selected list operation. In practice, list filters usually live under keys such as `query`, `path`, or `body`, depending on the operation contract.

Static example:

```ts
const { getAll } = usePetsConnector({
  query: { status: 'available' },
})
```

Reactive example:

```ts
const status = ref('available')

const { getAll } = usePetsConnector(() => ({
  query: { status: status.value },
}))
```

## Column labels

When columns are available, labels can be adjusted without regenerating code:

```ts
const { getAll } = usePetsConnector({}, {
  columnLabels: {
    photoUrls: 'Photos',
    status: 'Estado',
  },
})
```

Or with a function:

```ts
const { t } = useI18n()

const { getAll } = usePetsConnector({}, {
  columnLabel: (key) => t(`pets.columns.${key}`),
})
```

## Pagination behavior

`getAll.pagination` is only populated when the wrapped `useAsyncData` composable exposes pagination metadata.

For non-paginated list endpoints, `pagination.value` is `null`.

## Common coordination pattern

```ts
const { getAll, create, update, del } = usePetsConnector()

create.onSuccess(() => void getAll.load())
update.onSuccess(() => void getAll.load())
del.onSuccess(() => void getAll.load())
```
