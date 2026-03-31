# `create` — POST form

`create` manages a form for creating a new item. It validates the form model with Zod before sending the request, so the network call is never made if the data is invalid.

The `ui` sub-object provides headless modal/drawer lifecycle management. It only tracks `isOpen` — your modal component is entirely up to you.

---

## API reference

### Form state

| Property | Type | Description |
|---|---|---|
| `model` | `Ref<Partial<PetCreateInput>>` | The reactive form model. Bind your inputs to `model.value.fieldName`. |
| `errors` | `Ref<Record<string, string[]>>` | Zod validation errors, grouped by field name. Populated after the first failed submit. |
| `loading` | `Ref<boolean>` | `true` while the POST request is in flight. |
| `error` | `Ref<unknown>` | The server error from the last failed request. `null` on success. |
| `submitted` | `Ref<boolean>` | `true` after `execute()` has been called at least once. Useful to show errors only after the first submit attempt. |
| `isValid` | `ComputedRef<boolean>` | Whether the current `model.value` passes Zod validation. |
| `hasErrors` | `ComputedRef<boolean>` | Whether `errors.value` has any entries. |
| `fields` | `ComputedRef<FormFieldDef[]>` | Field metadata (key, label, type, required, options) inferred from the schema. |

### UI state

| Property / Method | Description |
|---|---|
| `ui.isOpen` | `Ref<boolean>` — bind to your modal's `v-model:open` or `:open`. |
| `ui.open()` | Open the modal. Call from a button's `@click`. |
| `ui.close()` | Close the modal. Called automatically on success when `autoClose: true` (default). |

### Actions

| Method | Signature | Description |
|---|---|---|
| `execute` | `(data?: Partial<PetCreateInput>) => Promise<Pet \| undefined>` | Validate with Zod, then POST. Returns the created item, or `undefined` if validation failed. |
| `refresh` | Same as `execute` | Alias for `execute`. |
| `reset` | `() => void` | Clear `model`, `errors`, `error`, and `submitted`. |
| `setValues` | `(data: Partial<PetCreateInput>) => void` | Merge data into `model.value`. Useful for setting defaults before opening. |
| `setField` | `(key, value) => void` | Set a single field in `model.value`. |

### Callbacks

```ts
create.onSuccess((newPet) => {
  getAll.load()
  toast.success(`"${newPet.name}" added`)
})

create.onError((err) => {
  toast.error(err.message ?? 'Failed to create pet')
})
```

These are registration functions — calling them replaces the previous handler. They always fire regardless of global callback rules (see [Callbacks](./callbacks.md)).

---

## Options

Passed in `usePetsConnector(params, options)`:

| Option | Type | Default | Description |
|---|---|---|---|
| `autoClose` | `boolean` | `true` | Call `ui.close()` automatically after a successful `execute()`. |
| `autoReset` | `boolean` | `false` | Call `reset()` automatically after a successful `execute()`. |
| `createSchema` | `ZodTypeAny \| (base) => ZodTypeAny` | — | Override or extend the generated Zod schema. |

### Extending the Zod schema

```ts
import { z } from 'zod'

const { create } = usePetsConnector({}, {
  createSchema: (base) =>
    base.extend({
      name: z.string().min(2, 'Name must be at least 2 characters'),
    })
})
```

---

## Example — UModal with form (Nuxt UI)

> This example uses [Nuxt UI](https://ui.nuxt.com). The `UModal` component is controlled by `create.ui.isOpen`.

```vue
<script setup lang="ts">
const { getAll, create } = usePetsConnector()

create.onSuccess(() => getAll.load())
</script>

<template>
  <!-- Trigger -->
  <UButton icon="i-heroicons-plus" @click="create.ui.open()">
    Add pet
  </UButton>

  <!-- Modal -->
  <UModal v-model:open="create.ui.isOpen.value">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold">New pet</h2>
            <UButton
              icon="i-heroicons-x-mark"
              variant="ghost"
              @click="create.ui.close()"
            />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="create.execute()">

          <!-- Name -->
          <UFormField label="Name" :error="create.errors.value.name?.[0]">
            <UInput
              v-model="create.model.value.name"
              placeholder="Buddy"
              :disabled="create.loading.value"
            />
          </UFormField>

          <!-- Status -->
          <UFormField label="Status" :error="create.errors.value.status?.[0]">
            <USelect
              v-model="create.model.value.status"
              :options="[
                { label: 'Available', value: 'available' },
                { label: 'Pending',   value: 'pending' },
                { label: 'Sold',      value: 'sold' },
              ]"
              :disabled="create.loading.value"
            />
          </UFormField>

          <!-- Photo URLs -->
          <UFormField label="Photo URL" :error="create.errors.value.photoUrls?.[0]">
            <UInput
              :model-value="create.model.value.photoUrls?.[0] ?? ''"
              placeholder="https://example.com/photo.jpg"
              :disabled="create.loading.value"
              @update:model-value="create.setField('photoUrls', [$event])"
            />
          </UFormField>

          <!-- Server error -->
          <UAlert
            v-if="create.error.value"
            color="red"
            :description="String(create.error.value)"
          />

        </form>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="create.ui.close()">
              Cancel
            </UButton>
            <UButton
              :loading="create.loading.value"
              :disabled="create.submitted.value && !create.isValid.value"
              @click="create.execute()"
            >
              Save
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
```

---

## Submitting with an explicit payload

If you don't want to bind to `model.value`, you can pass the data directly to `execute()`. It bypasses the reactive model and uses the passed object instead:

```ts
await create.execute({
  name: 'Buddy',
  photoUrls: ['https://example.com/buddy.jpg'],
  status: 'available',
})
```

---

## Resetting after submission

By default the form model is **not** cleared after a successful submission (`autoReset: false`). This is intentional — it keeps the last values visible if the user wants to create a similar item again.

To clear the form after each submission:

```ts
// Option A — connector option
usePetsConnector({}, { autoReset: true })

// Option B — reset manually in the callback
create.onSuccess(() => {
  create.reset()
  getAll.load()
})
```

---

## Setting default values

Use `setValues()` before calling `ui.open()` to pre-populate the form:

```ts
create.setValues({ status: 'available' })
create.ui.open()
```
