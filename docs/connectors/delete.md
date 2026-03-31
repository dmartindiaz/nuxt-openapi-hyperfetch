# `del` — DELETE with confirmation

`del` handles resource deletion. It uses a **staging pattern**: you first stage an item (store it in `del.staged`), then the user confirms, then `execute()` fires the DELETE request and clears the staged item.

The `ui` sub-object manages the confirmation dialog lifecycle. You can also skip staging entirely and call `del.execute(item)` directly for non-interactive flows like bulk deletes.

---

## API reference

### State

| Property | Type | Description |
|---|---|---|
| `staged` | `Ref<Pet \| null>` | The item waiting for confirmation. Set by `stage(item)` or `ui.open(item)`. |
| `hasStaged` | `ComputedRef<boolean>` | `true` when `staged.value` is not `null`. |
| `loading` | `Ref<boolean>` | `true` while the DELETE request is in flight. |
| `error` | `Ref<unknown>` | Server error from the last failed request. |

### UI state

| Property / Method | Description |
|---|---|
| `ui.isOpen` | `Ref<boolean>` — bind to your confirmation modal's `v-model:open`. |
| `ui.open(item)` | Stage `item` and open the confirmation dialog. |
| `ui.close()` | Cancel staging and close the dialog. Calls `cancel()` internally. |

### Actions

| Method | Signature | Description |
|---|---|---|
| `stage` | `(item: Pet) => void` | Store the item in `staged`. Does not open any UI. |
| `cancel` | `() => void` | Clear `staged` and reset `error`. |
| `execute` | `(item?: Pet) => Promise<void>` | Run the DELETE. Uses `staged.value` if no item is passed. |
| `refresh` | Same as `execute` | Alias for `execute`. |

### Callbacks

```ts
del.onSuccess((deletedPet) => {
  getAll.load()
  toast.success(`"${deletedPet.name}" deleted`)
})

del.onError((err) => {
  toast.error(err.message ?? 'Failed to delete pet')
})
```

---

## Example — UModal confirmation dialog (Nuxt UI)

> This example uses [Nuxt UI](https://ui.nuxt.com). Clicking "Delete" on a table row stages the item and opens a confirmation modal.

```vue
<script setup lang="ts">
const { getAll, del } = usePetsConnector()

del.onSuccess(() => getAll.load())
</script>

<template>
  <!-- Table with per-row delete button -->
  <UTable :rows="getAll.items.value" :columns="getAll.columns.value" :loading="getAll.loading.value">
    <template #actions-data="{ row }">
      <UButton
        icon="i-heroicons-trash"
        size="xs"
        variant="ghost"
        color="red"
        @click="del.ui.open(row)"
      />
    </template>
  </UTable>

  <!-- Confirmation modal -->
  <UModal v-model:open="del.ui.isOpen.value">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <UIcon name="i-heroicons-exclamation-triangle" class="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 class="text-base font-semibold">Delete pet</h2>
              <p class="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
          </div>
        </template>

        <p class="text-sm">
          Are you sure you want to delete
          <strong>{{ del.staged.value?.name }}</strong>?
        </p>

        <!-- Server error -->
        <UAlert
          v-if="del.error.value"
          color="red"
          class="mt-3"
          :description="String(del.error.value)"
        />

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="outline"
              :disabled="del.loading.value"
              @click="del.ui.close()"
            >
              Cancel
            </UButton>
            <UButton
              color="red"
              :loading="del.loading.value"
              @click="del.execute()"
            >
              Delete
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
```

---

## Direct deletion without confirmation

Skip staging and the dialog for non-interactive flows:

```ts
// Pass the item directly — no staging, no confirmation
await del.execute(pet)
```

Useful for bulk deletes:

```vue
<script setup lang="ts">
const { getAll, del } = usePetsConnector()

async function deleteSelected() {
  for (const pet of getAll.selected.value) {
    await del.execute(pet)
  }
  getAll.clearSelection()
  getAll.load()
}
</script>
```

---

## The staging pattern explained

The two-step flow (`stage` → `execute`) exists to let you display the item's name in the confirmation message without holding a reference in the component:

```
user clicks "Delete" on a row
  → del.ui.open(pet)        stages the pet AND opens the modal
  → user reads "Delete Buddy?"
  → user clicks "Confirm"
  → del.execute()           uses del.staged.value, sends DELETE /pet/{id}
  → on success: del.cancel() clears del.staged, autoClose closes modal
```

If the user clicks "Cancel", `del.ui.close()` calls `del.cancel()` internally, clearing `del.staged`.

---

## How the ID is resolved

The generator produces an `idFn` that extracts the ID from the staged item. For the Petstore's `DELETE /pet/{petId}`:

```ts
// Generated idFn
const idFn = (item) => item?.petId ?? item?.id ?? item

// Generated urlFn
const urlFn = (id) => `/pet/${id}`
```

So as long as your row object has `petId` (or `id` as a fallback), `execute()` will resolve the correct URL automatically.

> See [OpenAPI Conventions](./openapi-conventions.md) for why naming your path parameter to match the response field (`petId` → `pet.petId`) produces better `idFn` generation.
