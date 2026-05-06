# Pagination

Pagination is supported by both generated families. The same configuration model is shared, but the returned helper shape differs between `useFetch` and `useAsyncData`.

## Global plugin setup

Provide pagination rules through a Nuxt plugin:

```ts
// plugins/api-pagination.ts
export default defineNuxtPlugin(() => {
  const paginationConfig = {
    meta: {
      metaSource: 'body',
      fields: {
        total: 'total',
        totalPages: 'totalPages',
        currentPage: 'currentPage',
        perPage: 'perPage',
        dataKey: 'data',
      },
    },
    request: {
      sendAs: 'query',
      params: { page: 'page', perPage: 'limit' },
      defaults: { page: 1, perPage: 20 },
    },
  }

  return {
    provide: {
      getGlobalApiPagination: () => paginationConfig,
    },
  }
})
```

## Configuration model

- `meta.metaSource`: `'body'` or `'headers'`
- `meta.fields`: where to read `total`, `totalPages`, `currentPage`, `perPage`, and optional `dataKey`
- `request.sendAs`: `'query'`, `'body'`, or `'headers'`
- `request.params`: names of page and page-size fields
- `request.defaults`: default values for page and page size

Dot notation is supported for body-based metadata paths.

## `useAsyncData` shape

For `useAsyncData`, helpers live inside `pagination.value`:

```ts
const { data, pagination } = useAsyncDataGetPets({}, { paginated: true })

pagination.value?.nextPage()
pagination.value?.prevPage()
pagination.value?.goToPage(3)
pagination.value?.setPerPage(50)
```

## `useFetch` shape

For `useFetch`, the state lives in `pagination`, but helpers are top-level values:

```ts
const { data, pagination, nextPage, prevPage, goToPage, setPerPage } = useFetchGetPets({}, {
  paginated: true,
})
```

## Per-call override

You can override the global config for one call:

```ts
useAsyncDataGetProducts({}, {
  paginated: true,
  paginationConfig: {
    meta: {
      metaSource: 'body',
      fields: {
        total: 'count',
        totalPages: 'pages',
        currentPage: 'page',
        perPage: 'size',
        dataKey: 'results',
      },
    },
    request: {
      sendAs: 'query',
      params: { page: 'page', perPage: 'size' },
      defaults: { page: 1, perPage: 10 },
    },
  },
})
```

Priority order is per-call `paginationConfig` > plugin config > built-in defaults.

## Related guides

- [useFetch](/composables/use-fetch/)
- [useAsyncData](/composables/use-async-data/)
