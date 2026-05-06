# Global Callback Control Options

Three mechanisms let you control when and how global callbacks run.

## skipGlobalCallbacks

Skip global callbacks for a specific composable call.

### Skip all global callbacks

```typescript
const { data } = useFetchGetPublicPets({}, {
  skipGlobalCallbacks: true
})
```

### Skip specific callbacks

Pass an array of callback names to skip only those:

```typescript
const { data } = useFetchGetPets({}, {
  skipGlobalCallbacks: ['onRequest', 'onSuccess']
})
```

Accepted values: `'onRequest'`, `'onSuccess'`, `'onError'`, `'onFinish'`.

---

Common use cases:

```typescript
// Public endpoint — no auth header needed
useFetchGetPublicArticles({}, { skipGlobalCallbacks: true })

// External API — skip internal auth, use its own
useFetchExternalService({}, {
  skipGlobalCallbacks: true,
  onRequest: ({ headers }) => {
    return { headers: { ...headers, 'X-API-Key': externalKey } }
  }
})

// Skip only auth header, keep error handling
useFetchGetPets({}, {
  skipGlobalCallbacks: ['onRequest']
})
```

## return false from Global Callback

Return `false` from a global callback to prevent the corresponding local callback from running.

```typescript
// plugins/api-callbacks.ts
const globalCallbacks = {
  onError: (error) => {
    if (error.status === 401) {
      navigateTo('/login')
      return false // ← local onError will NOT run
    }
  }
}
```

When global `onError` returns `false`, any `onError` defined on the composable call is skipped:

```typescript
useFetchGetPets({}, {
  onError: (error) => {
    console.log('This will not run for 401 errors')
  }
})
```

## methods (HTTP Method Filter)

Add a `methods` array to a rule to restrict it to specific HTTP verbs. Accepts any uppercase HTTP method name.

```typescript
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  return {
    provide: {
      getGlobalApiCallbacks: () => [
        // Only runs after DELETE requests
        {
          methods: ['DELETE'],
          onSuccess: () => useToast().success('Deleted successfully'),
        },
        // Only runs before write operations
        {
          methods: ['POST', 'PUT', 'PATCH'],
          onRequest: ({ headers }) => ({
            headers: { ...headers, 'X-Write-Op': '1' },
          }),
        },
      ],
    },
  }
})
```

When `methods` is set on a rule, the rule is silently skipped for requests using a different method. A rule without `methods` runs for all HTTP methods.

## patterns (URL Filter)

Add a `patterns` array to a rule to restrict it to specific URLs. Uses glob-style matching.

```typescript
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  return {
    provide: {
      getGlobalApiCallbacks: () => [
        {
          patterns: ['/api/private/**', '/api/admin/**'],
          onRequest: ({ headers }) => {
            const token = useCookie('auth-token').value
            return { headers: { ...headers, 'Authorization': `Bearer ${token}` } }
          },
        },
      ],
    },
  }
})
```

When `patterns` is set on a rule, the rule is silently skipped for URLs that don't match. A rule without `patterns` runs for all URLs.

`methods` and `patterns` can be combined on the same rule — both filters must match for the rule to run:

```typescript
// Only adds auth header on GET requests to /api/private/**
{
  patterns: ['/api/private/**'],
  methods: ['GET'],
  onRequest: ({ headers }) => ({
    headers: { ...headers, 'Authorization': `Bearer ${token}` },
  }),
}
```

::: tip
Use `patterns` and `methods` on individual rules to scope them precisely. Use `skipGlobalCallbacks` per composable call for one-off exceptions.
:::

## Execution Flow

**Without `skipGlobalCallbacks`:**

```
Request → Global onRequest → Local onRequest → HTTP → Global onSuccess → Local onSuccess
```

**With `skipGlobalCallbacks: true`:**

```
Request → Local onRequest → HTTP → Local onSuccess
          (Global skipped)
```

**With `return false` from global callback:**

```
Request → ... → HTTP → Global onError (returns false) → Local onError skipped
```

This suppression only applies to the matching lifecycle stage. Returning `false` from global `onError` does not disable local `onSuccess`, `onRequest`, or `onFinish`.

## Next Steps

- [URL Patterns →](/composables/features/global-callbacks/patterns)
- [Setup Guide →](/composables/features/global-callbacks/setup)
