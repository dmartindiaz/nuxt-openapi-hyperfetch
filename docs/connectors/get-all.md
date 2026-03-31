# `getAll` — List with SSR

`getAll` renders a collection of items. It wraps a `useAsyncData` composable, so it **runs on the server** during SSR, hydrates on the client, and re-fetches reactively when its parameters change.

It is read-only. Write operations (create, update, delete) are handled by the other sub-connectors and trigger a reload via `getAll.load()`.

---

## API reference

### State

| Property | Type | Description |
|---|---|---|
| `items` | `ComputedRef<Pet[]>` | The list of items. Supports both flat arrays and `{ data: [], total }` paginated envelopes. |
| `columns` | `ComputedRef<ColumnDef[]>` | Column definitions inferred from the API schema. Each has `key`, `label`, `type`. |
| `loading` | `ComputedRef<boolean>` | `true` while the request is in flight. |
| `error` | `ComputedRef<unknown>` | The error object if the last request failed, otherwise `null`. |
| `selected` | `Ref<Pet[]>` | Currently selected rows. Managed via `select` / `deselect` / `toggleSelect`. |
| `pagination` | `ComputedRef<PaginationState \| null>` | Pagination state when the API returns a paginated envelope. `null` for flat arrays. |

### Actions

| Method | Signature | Description |
|---|---|---|
| `load` | `() => Promise<void>` | Reload the list. Calls `refresh()` on the underlying `useAsyncData`. |
| `select` | `(item: Pet) => void` | Add an item to `selected`. |
| `deselect` | `(item: Pet) => void` | Remove an item from `selected`. |
| `toggleSelect` | `(item: Pet) => void` | Add if not selected, remove if already selected. |
| `clearSelection` | `() => void` | Clear `selected`. |
| `goToPage` | `(page: number) => void` | Navigate to a specific page (paginated APIs only). |
| `nextPage` | `() => void` | Go to the next page. |
| `prevPage` | `() => void` | Go to the previous page. |
| `setPerPage` | `(n: number) => void` | Change the page size. |

### Callbacks

`getAll` uses a `Ref`-based callback pattern (different from the other sub-connectors which use registration functions):

```ts
getAll.onSuccess.value = (items) => {
  console.log(`Loaded ${items.length} pets`)
}

getAll.onError.value = (err) => {
  toast.error('Failed to load pets')
}
```

Setting `.value` replaces the callback. Call `load()` again to trigger it.

---

## Reactive parameters

Pass a factory function to re-fetch automatically when dependencies change:

```ts
const status = ref('available')

// Re-fetches whenever status.value changes
const { getAll } = usePetsConnector(() => ({ status: status.value }))
```

For static parameters, pass a plain object:

```ts
const { getAll } = usePetsConnector({ status: 'available' })
```

---

## Column label overrides

By default, column labels come from the field name in pascal case (`photoUrls` → `Photo Urls`). Override without regenerating:

```ts
const { getAll } = usePetsConnector({}, {
  columnLabels: { photoUrls: 'Photos', status: 'Estado' }
})
```

For i18n, use the function form:

```ts
const { t } = useI18n()
const { getAll } = usePetsConnector({}, {
  columnLabel: (key) => t(`pets.columns.${key}`)
})
```

---

## Example — UTable with Nuxt UI

> This example uses [Nuxt UI](https://ui.nuxt.com). The `UTable` component accepts `columns` and `rows` props that map directly to what `getAll` provides.

```vue
<script setup lang="ts">
// filters — passed as reactive params, getAll re-fetches on change
const status = ref<'available' | 'pending' | 'sold' | ''>('')

const { getAll, create, update, del } = usePetsConnector(
  () => status.value ? { status: status.value } : {},
)

// Reload the list after any mutation
create.onSuccess(() => getAll.load())
update.onSuccess(() => getAll.load())
del.onSuccess(()    => getAll.load())
</script>

<template>
  <div class="space-y-4">

    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <USelect
        v-model="status"
        :options="[
          { label: 'All', value: '' },
          { label: 'Available', value: 'available' },
          { label: 'Pending', value: 'pending' },
          { label: 'Sold', value: 'sold' },
        ]"
        placeholder="Filter by status"
      />
      <UButton icon="i-heroicons-plus" @click="create.ui.open()">
        Add pet
      </UButton>
    </div>

    <!-- Table -->
    <UTable
      :columns="getAll.columns.value"
      :rows="getAll.items.value"
      :loading="getAll.loading.value"
      v-model="getAll.selected.value"
    >
      <!-- Custom badge for status column -->
      <template #status-data="{ row }">
        <UBadge
          :color="row.status === 'available' ? 'green' : row.status === 'pending' ? 'yellow' : 'gray'"
          variant="subtle"
        >
          {{ row.status }}
        </UBadge>
      </template>

      <!-- Row actions -->
      <template #actions-data="{ row }">
        <div class="flex gap-2">
          <UButton
            icon="i-heroicons-pencil-square"
            size="xs"
            variant="ghost"
            @click="update.ui.open(row)"
          />
          <UButton
            icon="i-heroicons-trash"
            size="xs"
            variant="ghost"
            color="red"
            @click="del.ui.open(row)"
          />
        </div>
      </template>
    </UTable>

    <!-- Error state -->
    <UAlert
      v-if="getAll.error.value"
      color="red"
      :description="String(getAll.error.value)"
    />

    <!-- Pagination (only shown when API returns paginated data) -->
    <div v-if="getAll.pagination.value" class="flex justify-end">
      <UPagination
        :model-value="getAll.pagination.value.currentPage"
        :page-count="getAll.pagination.value.perPage"
        :total="getAll.pagination.value.total"
        @update:model-value="getAll.goToPage($event)"
      />
    </div>
  </div>
</template>
```

---

## Pagination shape

`pagination` is populated when the API returns a paginated envelope (an object with a `data` array and a `total` count):

```json
{
  "data": [...],
  "total": 142,
  "page": 1,
  "perPage": 20
}
```

For APIs that return a flat array, `pagination` is always `null` and the pagination controls should be hidden.

### PaginationState properties

| Property | Type | Description |
|---|---|---|
| `currentPage` | `number` | Currently active page (1-based). |
| `perPage` | `number` | Items per page. |
| `total` | `number` | Total item count across all pages. |
| `totalPages` | `number` | Total number of pages. |
| `hasNextPage` | `boolean` | Whether there is a next page. |
| `hasPrevPage` | `boolean` | Whether there is a previous page. |

---

## Selection

Row selection is local — it does not affect the API. Use it to enable bulk actions:

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

<template>
  <UButton
    v-if="getAll.selected.value.length > 0"
    color="red"
    @click="deleteSelected"
  >
    Delete {{ getAll.selected.value.length }} selected
  </UButton>
  <UTable
    :rows="getAll.items.value"
    v-model="getAll.selected.value"
  />
</template>
```
