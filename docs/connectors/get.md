# `get` — Single item fetch

`get` fetches one item by ID using `$fetch` directly. It is **imperative** — nothing happens until you call `load(id)`. There is no SSR execution, no cache, and no reactive dependencies. You call it when you need it.

Use `get` for:
- Detail pages where you load one item when the component mounts.
- Edit forms where you need fresh server data before showing the form (as an alternative to `update.ui.open(row)` which pre-fills from the table row without a network round-trip).
- Any scenario where you need fresh data for a specific resource by ID.

---

## API reference

### State

| Property | Type | Description |
|---|---|---|
| `data` | `Ref<Pet \| null>` | The fetched item. `null` before the first successful load and after `clear()`. |
| `loading` | `Ref<boolean>` | `true` while the request is in flight. |
| `error` | `Ref<unknown>` | The error from the last failed request. `null` after a successful load. |
| `fields` | `ComputedRef<FormFieldDef[]>` | Field metadata inferred from the schema (key, label, type, required, options). |

### Actions

| Method | Signature | Description |
|---|---|---|
| `load` | `(id: string \| number) => Promise<Pet>` | Fetch the item from the server. Sets `data.value` and returns the result. |
| `clear` | `() => void` | Reset `data` and `error` to `null`. |

### Callbacks

`get` uses the registration function pattern. The registered function is always called and is not affected by global callback rules:

```ts
get.onSuccess((pet) => {
  console.log('Loaded', pet.name)
})

get.onError((err) => {
  toast.error('Pet not found')
})
```

Registering a new callback replaces the previous one. You can also pass `onSuccess` and `onError` in the connector options if you prefer the declarative style:

```ts
const { get } = usePetsConnector({}, {
  onSuccess: (pet, ctx) => {
    if (ctx.operation === 'get') {
      console.log('Loaded', pet.name)
    }
  }
})
```

---

## Example — UCard detail page with Nuxt UI

> This example uses [Nuxt UI](https://ui.nuxt.com). The `UCard` component displays the pet's details.

```vue
<!-- pages/pets/[id].vue -->
<script setup lang="ts">
const route = useRoute()
const { get } = usePetsConnector()

get.onError(() => {
  throw createError({ statusCode: 404, message: 'Pet not found' })
})

// Load on mount — the result is also returned from load() if you need it
await get.load(route.params.id)
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <UCard v-if="get.loading.value">
      <template #header>
        <USkeleton class="h-6 w-48" />
      </template>
      <div class="space-y-2">
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-3/4" />
      </div>
    </UCard>

    <!-- Error state -->
    <UAlert
      v-else-if="get.error.value"
      color="red"
      title="Failed to load pet"
      :description="String(get.error.value)"
    />

    <!-- Content -->
    <UCard v-else-if="get.data.value">
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-semibold">{{ get.data.value.name }}</h1>
          <UBadge
            :color="get.data.value.status === 'available' ? 'green' : 'gray'"
            variant="subtle"
          >
            {{ get.data.value.status }}
          </UBadge>
        </div>
      </template>

      <dl class="divide-y divide-gray-100 dark:divide-gray-800">
        <div class="flex justify-between py-2">
          <dt class="text-sm text-gray-500">ID</dt>
          <dd class="text-sm font-medium">{{ get.data.value.id }}</dd>
        </div>
        <div class="flex justify-between py-2">
          <dt class="text-sm text-gray-500">Category</dt>
          <dd class="text-sm font-medium">{{ get.data.value.category?.name ?? '—' }}</dd>
        </div>
        <div class="flex justify-between py-2">
          <dt class="text-sm text-gray-500">Tags</dt>
          <dd class="flex flex-wrap gap-1">
            <UBadge v-for="tag in get.data.value.tags" :key="tag.id" variant="outline">
              {{ tag.name }}
            </UBadge>
          </dd>
        </div>
      </dl>

      <template #footer>
        <div class="flex gap-2 justify-end">
          <UButton variant="outline" @click="get.load(route.params.id)">
            Refresh
          </UButton>
          <NuxtLink :to="`/pets/${get.data.value.id}/edit`">
            <UButton>Edit</UButton>
          </NuxtLink>
        </div>
      </template>
    </UCard>
  </div>
</template>
```

---

## Using `get` vs `update.ui.open(row)`

There are two ways to populate an edit form:

| Approach | Network request? | Use when |
|---|---|---|
| `update.ui.open(row)` | No — copies data from the row object you already have | The table row has all the fields you need to edit |
| `get.load(id)` then `update.ui.open()` | Yes — fetches fresh data from the server | You need guaranteed fresh data, or the list response only returns a subset of fields |

```ts
// Option A — no extra network call (the row already has everything)
update.ui.open(pet)

// Option B — fresh data from the server before opening the form
await get.load(pet.id)
update.setValues(get.data.value)
update.ui.open()
```

---

## Clearing state on navigation

If you reuse the same component instance across navigations (e.g. a shared layout), call `clear()` to avoid showing stale data from the previous item:

```vue
<script setup lang="ts">
const route = useRoute()
const { get } = usePetsConnector()

// Clear stale data before each new load
watch(() => route.params.id, async (id) => {
  get.clear()
  await get.load(id)
}, { immediate: true })
</script>
```
