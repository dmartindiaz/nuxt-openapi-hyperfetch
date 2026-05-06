# `create`

`create` is the form-oriented POST connector.

It validates the payload with Zod when a request-body schema was inferred, then sends the request with `$fetch`.

## Form state

| Property | Description |
|---|---|
| `model` | Reactive form payload |
| `errors` | Validation errors grouped by field |
| `loading` | `true` while the request is in flight |
| `error` | Last server error |
| `submitted` | Becomes `true` after `execute()` is called |
| `isValid` | Computed validation state against the active schema |
| `hasErrors` | `true` when `errors` is not empty |
| `fields` | Generated field metadata |

## Actions

| Method | Description |
|---|---|
| `execute(data?)` | Validates then sends the request |
| `refresh(data?)` | Alias for `execute()` |
| `reset()` | Clears model, errors, error, and submitted state |
| `setValues(data)` | Merges multiple fields into the model |
| `setField(key, value)` | Sets one field |

If validation fails, `execute()` returns `undefined` and no request is sent.

## UI helpers

`create.ui` provides a minimal headless UI contract:

- `ui.isOpen`
- `ui.open()`
- `ui.close()`

This is only state management. The actual modal, drawer, or panel is up to the page.

## Options

Relevant options for `create` are:

- `createSchema`
- `baseURL`
- `onRequest`
- `onSuccess`
- `onError`
- `onFinish`
- `skipGlobalCallbacks`

At runtime, `useCreateConnector()` also honors:

- `autoClose` with default `true`
- `autoReset` with default `false`

## Callbacks

```ts
const { create } = usePetsConnector()

create.onSuccess((item) => {
  console.log('Created', item)
})

create.onError((err) => {
  console.error(err)
})
```

These handlers run in addition to any merged global or connector-level callbacks.

## Schema override

```ts
import { z } from 'zod'

const { create } = usePetsConnector({}, {
  createSchema: (base) =>
    base.extend({
      name: z.string().min(2),
    }),
})
```

## Example

```ts
const { getAll, create } = usePetsConnector()

create.onSuccess(() => void getAll.load())

create.setValues({ status: 'available' })
create.ui.open()
```
