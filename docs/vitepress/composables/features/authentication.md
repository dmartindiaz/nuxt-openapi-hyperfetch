# Authentication

Authentication is an application pattern built on top of generated callbacks and global headers.

## Common approaches

1. Add auth per request with local `onRequest`
2. Add auth globally with `useApiHeaders()`
3. Add auth globally with a Nuxt plugin that provides `getGlobalApiCallbacks`

## Local bearer token

```ts
const token = useCookie('auth-token')

useFetchGetPets({}, {
  onRequest: ({ headers }) => {
    if (!token.value) {
      return
    }

    return {
      headers: {
        ...headers,
        Authorization: `Bearer ${token.value}`,
      },
    }
  },
})
```

## Global bearer token with `useApiHeaders()`

```ts
// composables/useApiHeaders.ts
export const useApiHeaders = () => {
  const token = useCookie('auth-token')

  return {
    ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
  }
}
```

## Global bearer token with plugin callbacks

```ts
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  const token = useCookie('auth-token')

  return {
    provide: {
      getGlobalApiCallbacks: () => ({
        onRequest: ({ headers }) => {
          if (!token.value) {
            return
          }

          return {
            headers: {
              ...headers,
              Authorization: `Bearer ${token.value}`,
            },
          }
        },
        onError: (error) => {
          if (error.status === 401) {
            token.value = null
            navigateTo('/login')
            return false
          }
        },
      }),
    },
  }
})
```

## API key auth

```ts
export const useApiHeaders = () => {
  const config = useRuntimeConfig()

  return {
    ...(config.public.apiKey ? { 'X-API-Key': config.public.apiKey } : {}),
  }
}
```

## Conditional auth

```ts
export default defineNuxtPlugin(() => {
  return {
    provide: {
      getGlobalApiCallbacks: () => ({
        onRequest: ({ headers, url }) => {
          const isPublic = ['/api/public', '/api/health'].some((entry) => url.includes(entry))
          if (isPublic) {
            return
          }

          const token = useCookie('auth-token').value
          if (!token) {
            return
          }

          return {
            headers: {
              ...headers,
              Authorization: `Bearer ${token}`,
            },
          }
        },
      }),
    },
  }
})
```

## Token refresh note

The generated callback contract does not inject a `refresh()` helper into global `onError`. If you need token refresh, handle it in your own auth layer and then decide from the component or application flow when to retry the original request.

## Related guides

- [Global headers](/composables/features/global-headers)
- [Global callbacks](/composables/features/global-callbacks/overview)
- [onRequest](/composables/features/callbacks/on-request)
