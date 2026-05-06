# useFetch Configuration

Generated `useFetch` composables accept native Nuxt `useFetch` options plus the extra runtime options documented below.

## Runtime-specific options

```ts
interface ApiRequestOptions<T> {
  onRequest?: (context: RequestContext) =>
    | void
    | Promise<void>
    | ModifiedRequestContext
    | Promise<ModifiedRequestContext>

  onSuccess?: (data: T) => void | Promise<void>
  onError?: (error: any) => void | Promise<void>
  onFinish?: (context: FinishContext<any>) => void | Promise<void>

  skipGlobalCallbacks?: boolean | Array<'onRequest' | 'onSuccess' | 'onError' | 'onFinish'>

  pick?: readonly string[]
  transform?: (data: T) => any

  paginated?: boolean
  initialPage?: number
  initialPerPage?: number
  paginationConfig?: PaginationConfig

  baseURL?: string
  method?: string
  body?: any
  headers?: Record<string, string> | HeadersInit
  query?: Record<string, any>
  params?: Record<string, any>
}
```

::: tip Nuxt options still apply
Native options such as `server`, `lazy`, `immediate`, `watch`, `default`, `dedupe`, `onResponse`, and `onResponseError` remain available because the generated wrapper extends `useFetch`.

[Nuxt useFetch Documentation](https://nuxt.com/docs/api/composables/use-fetch)
:::

## `onRequest`

Use `onRequest` to modify the outgoing request. Return only the fields you want to override.

```ts
useFetchGetPets({}, {
  onRequest: ({ headers, query }) => ({
    headers: {
      ...headers,
      Authorization: `Bearer ${token.value}`,
    },
    query: {
      ...query,
      locale: 'en',
    },
  }),
})
```

The request context shape is:

```ts
interface RequestContext {
  url: string
  method: string
  body?: any
  headers?: Record<string, string>
  query?: Record<string, any>
}
```

## `onSuccess`, `onError`, `onFinish`

These callbacks run after the runtime has applied `pick` and `transform`.

```ts
useFetchCreatePet(
  { body: { name: 'Fluffy' } },
  {
    immediate: false,
    onSuccess: (pet) => {
      console.log('Created', pet.id)
    },
    onError: (error) => {
      console.error(error)
    },
    onFinish: ({ success }) => {
      console.log('Completed', success)
    },
  }
)
```

`onFinish` receives:

```ts
interface FinishContext<T> {
  data?: T
  error?: any
  success: boolean
}
```

## Global callbacks

Global callback rules come from a Nuxt plugin that provides `getGlobalApiCallbacks`.

```ts
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  return {
    provide: {
      getGlobalApiCallbacks: () => [
        {
          onRequest: ({ headers }) => ({
            headers: {
              ...headers,
              Authorization: `Bearer ${useCookie('auth-token').value}`,
            },
          }),
        },
        {
          methods: ['DELETE'],
          onSuccess: () => {
            console.log('Delete succeeded')
          },
        },
      ],
    },
  }
})
```

Per request, you can disable all global callbacks or selected stages:

```ts
useFetchGetPublicPets({}, {
  skipGlobalCallbacks: true,
})

useFetchGetPets({}, {
  skipGlobalCallbacks: ['onRequest', 'onError'],
})
```

## Global headers

Global headers are resolved in this order:

1. `useApiHeaders()` if you define that composable in your app
2. `nuxtApp.$getApiHeaders()` if `useApiHeaders()` is not available
3. Request-specific headers passed to the composable

```ts
// composables/useApiHeaders.ts
export const useApiHeaders = () => {
  const token = useCookie('auth-token')

  return {
    ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
  }
}
```

## Pagination options

Pagination is shared with `useAsyncData` and is driven by `paginationConfig`.

```ts
const { data, pagination, nextPage } = useFetchGetPets({}, {
  paginated: true,
  initialPage: 2,
  initialPerPage: 50,
})
```

If you need one request to follow a different backend pagination convention, override it inline:

```ts
useFetchGetPets({}, {
  paginated: true,
  paginationConfig: {
    meta: {
      metaSource: 'body',
      fields: {
        total: 'meta.total',
        totalPages: 'meta.last_page',
        currentPage: 'meta.current_page',
        perPage: 'meta.per_page',
        dataKey: 'data',
      },
    },
    request: {
      sendAs: 'query',
      params: { page: 'page', perPage: 'per_page' },
      defaults: { page: 1, perPage: 15 },
    },
  },
})
```

## `baseURL`

If you do not pass `baseURL`, the runtime tries `runtimeConfig.public.apiBaseUrl`.

```ts
useFetchGetPets({}, {
  baseURL: 'https://api.example.com',
})
```

## Next steps

- [Basic usage](/composables/use-fetch/basic-usage)
- [Pagination](/composables/use-async-data/pagination)
- [Global callbacks](/composables/features/global-callbacks/overview)
