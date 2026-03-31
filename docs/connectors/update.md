# `update` — PUT / PATCH form

`update` manages an edit form. It works like `create` but targets an existing item, so:

- `execute(id, data?)` requires the resource ID.
- `ui.open(item)` pre-fills the form model from the object you pass — no extra network request.
- `load(id)` fetches fresh data from the server before pre-filling, when you need guaranteed accuracy.

---

## API reference

### Form state

| Property | Type | Description |
|---|---|---|
| `model` | `Ref<Partial<PetUpdateInput>>` | The reactive form model. Bind your inputs to `model.value.fieldName`. |
| `errors` | `Ref<Record<string, string[]>>` | Zod validation errors, grouped by field name. |
| `loading` | `Ref<boolean>` | `true` while any request (load or execute) is in flight. |
| `error` | `Ref<unknown>` | Server error from the last failed request. |
| `submitted` | `Ref<boolean>` | `true` after `execute()` has been called at least once. |
| `isValid` | `ComputedRef<boolean>` | Whether `model.value` passes Zod validation. |
| `hasErrors` | `ComputedRef<boolean>` | Whether `errors.value` has any entries. |
| `fields` | `ComputedRef<FormFieldDef[]>` | Field metadata inferred from the schema. |
| `targetId` | `Ref<string \| number \| null>` | The ID of the item being edited. Set by `load(id)`. You must manage it yourself if you use `ui.open(row)` without calling `load`. |

### UI state

| Property / Method | Description |
|---|---|
| `ui.isOpen` | `Ref<boolean>` — bind to your modal's `v-model:open` or `:open`. |
| `ui.open(item?)` | Pre-fill `model.value` from `item` (if provided), then set `isOpen = true`. |
| `ui.close()` | Set `isOpen = false`. Called automatically on success when `autoClose: true` (default). |

### Actions

| Method | Signature | Description |
|---|---|---|
| `load` | `(id: string \| number) => Promise<void>` | Fetch the current item from the server and pre-fill `model.value`. Also sets `targetId`. |
| `execute` | `(id: string \| number, data?) => Promise<Pet \| undefined>` | Validate with Zod, then PUT/PATCH. Returns the updated item. |
| `refresh` | Same as `execute` | Alias for `execute`. |
| `reset` | `() => void` | Clear model, errors, error, submitted, and targetId. |
| `setValues` | `(data: Partial<PetUpdateInput>) => void` | Merge data into `model.value`. |
| `setField` | `(key, value) => void` | Set a single field. |

### Callbacks

```ts
update.onSuccess((updatedPet) => {
  getAll.load()
  toast.success(`"${updatedPet.name}" updated`)
})

update.onError((err) => {
  toast.error(err.message ?? 'Failed to update pet')
})
```

---

## Pre-filling the form: two approaches

### From a table row (no extra network request)

```ts
// user clicks "Edit" on a row — open the form immediately with the row's data
update.ui.open(pet)

// execute() needs the ID — read it from the pre-filled model
await update.execute(update.model.value.id)
```

This is the most common flow. The table row already has the petId, so there's no need to fetch again.

### From the server (guaranteed fresh data)

```ts
// useful when the list only returns a subset of fields and you need more
await update.load(pet.petId)
update.ui.open()               // model is already pre-filled by load()

await update.execute(update.targetId.value)
```

`load()` sets `targetId` automatically.

---

## Example — UModal edit form (Nuxt UI)

> This example uses [Nuxt UI](https://ui.nuxt.com). Clicking "Edit" on a table row opens a modal with the pet's current data.

```vue
<script setup lang="ts">
const { getAll, update } = usePetsConnector()

update.onSuccess(() => getAll.load())
</script>

<template>
  <!-- Table with per-row edit button -->
  <UTable :rows="getAll.items.value" :columns="getAll.columns.value" :loading="getAll.loading.value">
    <template #actions-data="{ row }">
      <UButton
        icon="i-heroicons-pencil-square"
        size="xs"
        variant="ghost"
        @click="update.ui.open(row)"
      />
    </template>
  </UTable>

  <!-- Edit modal -->
  <UModal v-model:open="update.ui.isOpen.value">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold">Edit pet</h2>
            <UButton
              icon="i-heroicons-x-mark"
              variant="ghost"
              @click="update.ui.close()"
            />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="update.execute(update.model.value.id)">

          <!-- Name -->
          <UFormField label="Name" :error="update.errors.value.name?.[0]">
            <UInput
              v-model="update.model.value.name"
              :disabled="update.loading.value"
            />
          </UFormField>

          <!-- Status -->
          <UFormField label="Status" :error="update.errors.value.status?.[0]">
            <USelect
              v-model="update.model.value.status"
              :options="[
                { label: 'Available', value: 'available' },
                { label: 'Pending',   value: 'pending' },
                { label: 'Sold',      value: 'sold' },
              ]"
              :disabled="update.loading.value"
            />
          </UFormField>

          <!-- Photo URLs -->
          <UFormField label="Photo URL" :error="update.errors.value.photoUrls?.[0]">
            <UInput
              :model-value="update.model.value.photoUrls?.[0] ?? ''"
              :disabled="update.loading.value"
              @update:model-value="update.setField('photoUrls', [$event])"
            />
          </UFormField>

          <!-- Server error -->
          <UAlert
            v-if="update.error.value"
            color="red"
            :description="String(update.error.value)"
          />

        </form>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="update.ui.close()">
              Cancel
            </UButton>
            <UButton
              :loading="update.loading.value"
              :disabled="update.submitted.value && !update.isValid.value"
              @click="update.execute(update.model.value.id)"
            >
              Save changes
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
```

---

## Extending the Zod schema

```ts
import { z } from 'zod'

const { update } = usePetsConnector({}, {
  updateSchema: (base) =>
    base.extend({
      name: z.string().min(2, 'Name must be at least 2 characters'),
    })
})
```

---

## Passing an explicit payload

`execute()` falls back to `model.value` if no data is passed. You can bypass the reactive model by passing data directly:

```ts
await update.execute(pet.id, {
  name: 'New name',
  status: 'sold',
})
```

---

## Handling the ID

The generated `update` connector for the Petstore sends the ID **in the URL** (`PUT /pet/{id}`). When you pre-fill from a table row with `ui.open(row)`, the ID is in `model.value.id` (or whatever field the spec uses). You pass it explicitly to `execute()`:

```ts
// The row object has row.id — pass it to execute
update.execute(row.id)
```

If your API sends the ID in the request body instead of the URL (e.g. `PUT /pet` with `{ id, ...fields }`), the generated `urlFn` will be a static string, and `execute()` still works — the ID is just part of the body payload automatically.
