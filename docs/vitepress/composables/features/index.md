# Shared Features

Both `useFetch` and `useAsyncData` wrappers share the same generated runtime features.

## Overview

Generated composables currently support:

- Nuxt module configuration through `openapi` in `nuxt.config.ts`
- Lifecycle callbacks for each request
- Global callback rules from a Nuxt plugin
- Global headers from a composable or Nuxt plugin
- `pick` and `transform`
- Request interception through `onRequest`
- Optional pagination helpers
- Full type safety from the generated OpenAPI SDK

## Features comparison

| Feature | useFetch | useAsyncData | Source |
|---------|----------|--------------|--------|
| Module configuration | Yes | Yes | Nuxt module |
| Lifecycle callbacks | Yes | Yes | Generated runtime |
| Global callbacks | Yes | Yes | Generated runtime |
| Global headers | Yes | Yes | Generated runtime |
| Pick fields | Yes | Yes | Generated runtime |
| Request interception | Yes | Yes | Generated runtime |
| Pagination helpers | Yes | Yes | Generated runtime |
| Raw response variant | No | Yes | Generated runtime |

## Module configuration

Configure generation through the `openapi` key in `nuxt.config.ts`.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],
  openapi: {
    input: './swagger.yaml',
    output: './openapi',
    baseUrl: 'https://api.example.com',
    generators: ['useFetch', 'useAsyncData'],
  },
})
```

[Learn more about module configuration](/guide/use-as-nuxt-module)

## Callbacks

Each generated composable supports `onRequest`, `onSuccess`, `onError`, and `onFinish`.

```ts
useFetchGetPetById(
  {
    path: { petId: 123 },
  },
  {
    onRequest: ({ url, headers }) => {
      console.log('Starting request to:', url)

      return {
        headers: {
          ...headers,
          'X-Request-ID': crypto.randomUUID(),
        },
      }
    },
    onSuccess: (data) => {
      console.log('Success!', data)
    },
    onError: (error) => {
      console.error('Failed!', error)
    },
    onFinish: () => {
      console.log('Request complete')
    },
  }
)
```

[Learn more about callbacks](/composables/features/callbacks/overview)

## Global callbacks

Global callbacks are provided by a Nuxt plugin that exposes `getGlobalApiCallbacks` on the Nuxt app.

```ts
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  return {
    provide: {
      getGlobalApiCallbacks: () => ({
        onRequest: ({ headers }) => {
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
        onError: (error) => {
          if (error.status === 401) {
            navigateTo('/login')
          }
        },
      }),
    },
  }
})
```

`skipGlobalCallbacks` can disable all global rules with `true`, or disable only named lifecycle stages with an array such as `['onError']`.

[Learn more about global callbacks](/composables/features/global-callbacks/overview)

## Global headers

Global headers can come from either `useApiHeaders()` or a Nuxt plugin that provides `getApiHeaders`.

```ts
// composables/useApiHeaders.ts
export const useApiHeaders = () => {
  const authToken = useCookie('auth-token')

  return {
    Authorization: authToken.value ? `Bearer ${authToken.value}` : '',
    'X-Client-Version': '1.0.0',
  }
}
```

Global headers are merged before request-specific headers, so per-request headers still win.

[Learn more about global headers](/composables/features/global-headers)

## Pick fields

Use `pick` to select specific fields from the response before `transform` runs.

```ts
const { data } = useFetchGetPetById(
  {
    path: { petId: 123 },
  },
  {
    pick: ['id', 'name', 'status'] as const,
  }
)
```

Dot notation is supported for nested paths.

[Learn more about pick fields](/composables/features/pick)

## Request interception

Return partial request modifications from `onRequest` to alter headers, query params, or body before the request is sent.

```ts
useFetchGetPets({}, {
  onRequest: ({ headers, query, body }) => ({
    headers: {
      ...headers,
      'X-Custom-Header': 'value',
    },
    query: {
      ...query,
      locale: 'en',
    },
    body: body
      ? {
          ...body,
          clientVersion: '1.0.0',
        }
      : undefined,
  }),
})
```

[Learn more about request interception](/composables/features/request-interception)

## Authentication and error handling

Authentication and centralized error handling are application patterns built on top of callbacks and global headers. They are not separate generated primitives.

Typical pattern:

- Add auth headers globally through `useApiHeaders()` or `getGlobalApiCallbacks`
- Handle shared error cases through global `onError`
- Use `skipGlobalCallbacks` for public or exceptional requests

[Learn more about authentication](/composables/features/authentication)

[Learn more about error handling →](/composables/features/callbacks/on-error)

## Feature Architecture

```
         ┌─────────────────────────────────────────────────────┐
         │                                                     │
         ▼                                                     │
  ┌────────────┐                                              │
  │ Component  │                                              │
  └──────┬─────┘                                              │
         │                                                     │
         ▼                                                     │
  ┌──────────────────────┐                                    │
  │Generated Composable  │                                    │
  └──────┬───────────────┘                                    │
         │                                                     │
         ▼                                                     │
  ┌──────────────────────┐                                    │
  │  Local Callbacks     │                                    │
  └──────┬───────────────┘                                    │
         │                                                     │
         ▼                                                     │
  ┌──────────────────────┐                                    │
  │  Global Callbacks    │                                    │
  └──────┬───────────────┘                                    │
         │                                                     │
         ▼                                                     │
  ┌──────────────────────┐                                    │
  │Request Interception  │                                    │
  └──────┬───────────────┘                                    │
         │                                                     │
         ▼                                                     │
  ┌──────────────────────┐                                    │
  │  Nuxt Composable     │                                    │
  └──────┬───────────────┘                                    │
         │                                                     │
         ▼                                                     │
  ┌──────────────────────┐                                    │
  │       API            │                                    │
  └──────┬───────────────┘                                    │
         │                                                     │
         ▼                                                     │
  ┌──────────────────────┐                                    │
  │     Response         │                                    │
  └──────┬───────────────┘                                    │
         │                                                     │
         ▼                                                     │
  ┌──────────────────────┐                                    │
  │Data Transformation   │                                    │
  └──────┬───────────────┘                                    │
         │                                                     │
         ▼                                                     │
  ┌──────────────────────┐                                    │
  │Success/Error Callbacks│                                   │
  └──────┬───────────────┘                                    │
         │                                                     │
         └─────────────────────────────────────────────────────┘
```

## Next Steps

Explore each feature in detail:

- [Callbacks Overview →](/composables/features/callbacks/overview)
- [Global Callbacks →](/composables/features/global-callbacks/overview)
- [Request Interception →](/composables/features/request-interception)
- [Server Transformers →](/server/transformers/)
- [Authentication →](/composables/features/authentication)
- [Error Handling →](/composables/features/callbacks/on-error)
