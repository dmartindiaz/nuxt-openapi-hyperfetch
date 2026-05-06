# `del`

`del` is the delete connector.

It supports two modes:

- staged deletion with confirmation UI
- direct deletion by passing an item to `execute(item)`

## State

| Property | Description |
|---|---|
| `staged` | Item currently waiting for confirmation |
| `hasStaged` | `true` when an item is staged |
| `loading` | `true` while the request is in flight |
| `error` | Last server error |

## Actions

| Method | Description |
|---|---|
| `stage(item)` | Stores an item for later deletion |
| `cancel()` | Clears staged item and resets error |
| `execute(item?)` | Deletes the provided item or the staged one |
| `refresh(item?)` | Alias for `execute()` |

## UI helpers

`del.ui` provides:

- `ui.isOpen`
- `ui.open(item)`
- `ui.close()`

`ui.open(item)` stages the item and opens the UI state.

`ui.close()` cancels the staged item and closes the UI state.

## Callbacks

```ts
const { del } = usePetsConnector()

del.onSuccess((item) => {
  console.log('Deleted', item)
})

del.onError((err) => {
  console.error(err)
})
```

`del` uses `$fetch` and participates in the merged global and connector-level callback flow.

## ID resolution

Delete connectors use a generated `idFn` plus a generated URL builder.

For an endpoint such as `DELETE /pet/{petId}`, the runtime uses an extractor equivalent to:

```ts
(item) => item?.petId ?? item?.id ?? item
```

That means a row object works as long as it exposes the path-param field or `id` as a fallback.

## Example

```ts
const { getAll, del } = usePetsConnector()

del.onSuccess(() => void getAll.load())

del.ui.open(row)
await del.execute()
```

For direct deletion without a confirmation step:

```ts
await del.execute(row)
```
