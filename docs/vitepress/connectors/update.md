# `update`

`update` is the form-oriented PUT or PATCH connector.

It behaves like `create`, but adds `load(id)` and `targetId` for edit flows.

## Form state

| Property | Description |
|---|---|
| `model` | Reactive form payload |
| `errors` | Validation errors grouped by field |
| `loading` | `true` while load or execute is in flight |
| `error` | Last server error |
| `submitted` | Becomes `true` after `execute()` is called |
| `isValid` | Computed validation state |
| `hasErrors` | `true` when `errors` is not empty |
| `fields` | Generated field metadata |
| `targetId` | ID last loaded via `load(id)` |

## Actions

| Method | Description |
|---|---|
| `load(id)` | Fetches the current item and merges it into `model` |
| `execute(id, data?)` | Validates then sends the update request |
| `refresh(id, data?)` | Alias for `execute()` |
| `reset()` | Clears model, errors, error, submitted, and `targetId` |
| `setValues(data)` | Merges fields into `model` |
| `setField(key, value)` | Sets one field |

## UI helpers

`update.ui` provides:

- `ui.isOpen`
- `ui.open(item?)`
- `ui.close()`

If `ui.open(item)` receives an item, that item is merged into the model immediately. That lets list pages open edit forms without an extra network request.

## Callbacks

```ts
const { update } = usePetsConnector()

update.onSuccess((item) => {
  console.log('Updated', item)
})

update.onError((err) => {
  console.error(err)
})
```

`update` also participates in merged global and connector-level callbacks.

## Schema override

```ts
import { z } from 'zod'

const { update } = usePetsConnector({}, {
  updateSchema: (base) =>
    base.extend({
      name: z.string().min(2),
    }),
})
```

## Two common edit flows

From an existing row:

```ts
update.ui.open(row)
await update.execute(row.id)
```

From a fresh server load:

```ts
await update.load(id)
update.ui.open()
await update.execute(update.targetId.value)
```

When the generated endpoint puts the resource ID in the URL, `execute()` still requires the ID argument explicitly.
