# Global Headers

Global headers let you apply shared headers to both generated `useFetch` and `useAsyncData` composables.

## Supported sources

The runtime checks headers in this order:

1. `useApiHeaders()` if your app defines it
2. `nuxtApp.$getApiHeaders()` if a plugin provides it
3. Request-specific `headers`
4. `onRequest` modifications

Later sources win.

## Recommended: `useApiHeaders()`

```ts
// composables/useApiHeaders.ts
export const useApiHeaders = () => {
  const token = useCookie('auth-token')
  const { locale } = useI18n()
  const config = useRuntimeConfig()

  return {
    ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
    ...(config.public.apiKey ? { 'X-API-Key': config.public.apiKey } : {}),
    'Accept-Language': locale.value,
    'X-Client-Version': '1.0.0',
  }
}
```

## Alternative: plugin-provided `getApiHeaders`

```ts
// plugins/api-headers.ts
export default defineNuxtPlugin(() => {
  const token = useCookie('auth-token')

  return {
    provide: {
      getApiHeaders: () => ({
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
        'X-Client-Version': '1.0.0',
      }),
    },
  }
})
```

## Merge behavior

Per-request headers override global headers:

```ts
useFetchGetPets({}, {
  headers: {
    Authorization: 'Bearer request-specific-token',
  },
})
```

`onRequest` can override both:

```ts
useFetchGetPets({}, {
  onRequest: ({ headers }) => ({
    headers: {
      ...headers,
      'X-Request-ID': crypto.randomUUID(),
    },
  }),
})
```

## Best use cases

- Auth tokens
- API keys
- Localization headers
- Multi-tenant context
- Client version headers

## Related guides

- [Authentication](/composables/features/authentication)
- [Global callbacks](/composables/features/global-callbacks/overview)
