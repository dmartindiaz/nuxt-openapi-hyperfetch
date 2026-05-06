# Global Callbacks

Global callbacks let you define callback logic **once** in a Nuxt plugin and automatically apply it to **all API requests** in your application.

## Why Global Callbacks?

Instead of repeating the same callbacks in every composable:

```typescript
// ❌ Repetitive - same auth logic everywhere
useFetchGetPets({}, {
  onRequest: ({ headers }) => {
    return { headers: { ...headers, 'Authorization': `Bearer ${getToken()}` } }
  }
})

useFetchGetOwners({}, {
  onRequest: ({ headers }) => {
    return { headers: { ...headers, 'Authorization': `Bearer ${getToken()}` } }
  }
})
```

Define once in a plugin, apply to every request automatically:

```typescript
// ✅ plugins/api-callbacks.ts — runs for all matching requests
export default defineNuxtPlugin(() => {
  const globalCallbacks = {
    onRequest: ({ headers }) => {
      const token = useCookie('auth-token').value
      if (token) {
        return { headers: { ...headers, Authorization: `Bearer ${token}` } }
      }
    },
  }

  return {
    provide: {
      getGlobalApiCallbacks: () => globalCallbacks,
    },
  }
})
```

## The Plugin File

Global callbacks live in a Nuxt plugin you create manually at `plugins/api-callbacks.ts`:

```typescript
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  const globalCallbacks = {
    onRequest: ({ headers }) => {
      const token = useCookie('auth-token').value
      if (token) {
        return { headers: { ...headers, 'Authorization': `Bearer ${token}` } }
      }
    },
    onError: (error) => {
      if (error.status === 401) {
        navigateTo('/login')
      }
    }
  }

  return {
    provide: {
      getGlobalApiCallbacks: () => globalCallbacks
    }
  }
})
```

::: tip
The `provide: { getGlobalApiCallbacks: () => globalCallbacks }` block is required — it connects the plugin to the composables runtime. Don't remove it.
:::

[Full setup guide →](/composables/features/global-callbacks/setup)

## All Four Callbacks

The `globalCallbacks` object supports the same four lifecycle callbacks as local callbacks:

```typescript
const globalCallbacks = {
  onRequest: ({ url, headers, body, query }) => {
    // Before every request
    // Return { headers, body, query } to modify the request
    return { headers: { ...headers, 'X-Request-ID': crypto.randomUUID() } }
  },
  onSuccess: (data, context) => {
    // After every successful request
  },
  onError: (error, context) => {
    // After every failed request
    // Return false to prevent the local onError from running
  },
  onFinish: ({ success, data, error }) => {
    // After every request regardless of success or failure
  }
}
```

Global callbacks may be provided as a single rule object or as an array of rules.

## Multiple Rules

Pass an array of rules instead of a single object to apply different logic to different endpoints. Each rule runs independently — they are not mutually exclusive.

```typescript
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  return {
    provide: {
      getGlobalApiCallbacks: () => [
        // Rule 1: add auth header to all requests
        {
          onRequest: ({ headers }) => {
            const token = useCookie('auth-token').value
            if (token) return { headers: { ...headers, Authorization: `Bearer ${token}` } }
          },
        },
        // Rule 2: show a toast on every DELETE success
        {
          methods: ['DELETE'],
          onSuccess: () => useToast().success('Deleted successfully'),
        },
        // Rule 3: handle 401 globally, only on private routes
        {
          patterns: ['/api/private/**'],
          onError: (error) => {
            if (error.status === 401) {
              navigateTo('/login')
              return false // suppress local onError
            }
          },
        },
      ],
    },
  }
})
```

All rules are evaluated in order. For `onRequest`, headers and query are merged and later local modifications still take priority.

## Rule Filters

Each rule can be scoped with `patterns` (URL globs) and `methods` (HTTP verbs). A rule only runs when **all** its filters match.

```typescript
[
  // Only runs for GET and POST on /api/v2/**
  {
    patterns: ['/api/v2/**'],
    methods: ['GET', 'POST'],
    onRequest: ({ headers }) => ({ headers: { ...headers, 'X-Version': '2' } }),
  },
]
```

A rule with no filters runs for every request.

## Execution Order

Global callbacks always run **before** local callbacks:

```
    Request
       │
       ▼
  Global onRequest  →  Local onRequest
                              │
                              ▼
                        HTTP Request
                              │
                    ┌─────────┴─────────┐
                    │                   │
               2xx Success         4xx/5xx Error
                    │                   │
                    ▼                   ▼
          Global onSuccess       Global onError
                    │                   │
                    ▼                   ▼
           Local onSuccess        Local onError
                    │                   │
                    └──────────┬────────┘
                               │
                               ▼
                      Global onFinish
                               │
                               ▼
                       Local onFinish
```

## Control Options

Skip global callbacks for specific requests directly from the composable:

```typescript
// Skip ALL global callbacks
useFetchGetPublicPets({}, {
  skipGlobalCallbacks: true
})

// Skip only specific callbacks
useFetchGetPets({}, {
  skipGlobalCallbacks: ['onSuccess', 'onFinish']
})
```

[Learn more about control options →](/composables/features/global-callbacks/control-options)

## Next Steps

- [Setup Guide →](/composables/features/global-callbacks/setup)
- [Control Options →](/composables/features/global-callbacks/control-options)
- [URL Patterns →](/composables/features/global-callbacks/patterns)
