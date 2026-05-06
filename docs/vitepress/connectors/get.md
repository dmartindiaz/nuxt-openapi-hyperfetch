# `get`

`get` is the imperative single-item fetch connector.

It uses `$fetch` directly, so it does not register SSR state and it only runs when `load(id)` is called.

## State

| Property | Description |
|---|---|
| `data` | Last successfully loaded item |
| `loading` | `true` while the request is in flight |
| `error` | Last request error |
| `fields` | Field metadata inferred from schema analysis |

## Actions

| Method | Description |
|---|---|
| `load(id)` | Fetches one item, stores it in `data`, and returns it |
| `clear()` | Resets `data` and `error` |

```ts
const { get } = usePetsConnector()

const pet = await get.load(5)
```

## Callbacks

`get` exposes registration functions:

```ts
get.onSuccess((item) => {
  console.log('Loaded', item)
})

get.onError((err) => {
  console.error(err)
})
```

It also participates in the merged callback flow from global rules and connector-level options.

## Base URL resolution

`get` resolves `baseURL` in this order:

1. connector option `baseURL`
2. shared runtime global base URL

If neither exists, the runtime logs a warning and still tries to issue the request with the raw URL.

## When to use it

Use `get` when you need:

- a detail page fetch
- a fresh server read before opening an edit form
- an imperative reload that should not go through `useAsyncData`

## Example

```ts
const route = useRoute()
const { get } = usePetsConnector()

await get.load(route.params.id)
```
