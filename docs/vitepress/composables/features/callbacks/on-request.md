# onRequest Callback

The `onRequest` callback is called **before** the HTTP request is sent, allowing you to modify the request or execute side effects.

## Signature

```typescript
onRequest?: (context: OnRequestContext) => ModifiedRequestContext | void | Promise<ModifiedRequestContext | void>

interface OnRequestContext {
  url: string                      // Request URL
  method: string                   // HTTP method (GET, POST, etc.)
  headers?: Record<string, string> // Request headers
  body?: any                       // Request body
  query?: Record<string, any>      // Query parameters used by the request wrapper
}

interface ModifiedRequestContext {
  headers?: Record<string, string> // Modified headers
  body?: any                       // Modified body
  query?: Record<string, any>      // Modified query parameters
}
```

## Basic Usage

```typescript
useFetchGetPets({}, {
  onRequest: ({ url, method, headers }) => {
    console.log(`Making ${method} request to ${url}`)
  }
})
```

For operation wrappers with path params, use the generated SDK-shaped params object:

```ts
useFetchGetPetById(
  {
    path: { petId: 123 },
  },
  {
    onRequest: ({ headers }) => ({
      headers: {
        ...headers,
        'X-Request-ID': crypto.randomUUID(),
      },
    }),
  }
)
```

## Common Use Cases

### Add Custom Headers

```typescript
useFetchGetPets({}, {
  onRequest: ({ headers }) => {
    return {
      headers: {
        ...headers,
        'X-Custom-Header': 'value',
        'X-Request-ID': crypto.randomUUID(),
        'X-Client-Version': '1.0.0'
      }
    }
  }
})
```

### Add Authentication Token

```typescript
useFetchGetPets({}, {
  onRequest: ({ headers }) => {
    const token = useCookie('auth-token').value
    if (token) {
      return {
        headers: {
          ...headers,
          'Authorization': `Bearer ${token}`
        }
      }
    }
  }
})
```

### Modify Query Parameters

```typescript
useFetchGetPets({}, {
  onRequest: ({ query }) => {
    return {
      query: {
        ...query,
        timestamp: Date.now(),
        v: '2.0',
        // Convert arrays to comma-separated
        tags: Array.isArray(query?.tags) ? query.tags.join(',') : query?.tags
      }
    }
  }
})
```

### Modify Request Body

```typescript
useFetchCreatePet(
  { body: { name: 'Fluffy' } },
  {
    onRequest: ({ body }) => {
      if (body) {
        return {
          body: {
            ...body,
            clientVersion: '1.0.0',
            timestamp: Date.now(),
            locale: navigator.language
          }
        }
      }
    }
  }
)
```

### Correlation IDs

```typescript
useFetchGetPets({}, {
  onRequest: ({ headers }) => {
    // Generate correlation ID for request tracing
    const correlationId = crypto.randomUUID()
    
    // Store for later use
    sessionStorage.setItem('last-correlation-id', correlationId)
    
    return {
      headers: {
        ...headers,
        'X-Correlation-ID': correlationId
      }
    }
  }
})
```

## Async Operations

The callback can be async:

```typescript
useFetchGetPets({}, {
  onRequest: async ({ headers }) => {
    // Refresh token if needed
    const token = await refreshTokenIfNeeded()
    return {
      headers: {
        ...headers,
        'Authorization': `Bearer ${token}`
      }
    }
  }
})
```

## Conditional Logic

```typescript
useFetchGetPets({}, {
  onRequest: ({ headers, query }) => {
    const modifications: any = {}
    
    // Add auth only for certain environments
    if (process.env.NODE_ENV === 'production') {
      const token = useCookie('auth-token').value
      modifications.headers = {
        ...headers,
        'Authorization': `Bearer ${token}`
      }
    }
    
    // Add debug flag in development
    if (process.env.NODE_ENV === 'development') {
      modifications.query = {
        ...query,
        debug: true
      }
    }
    
    return modifications
  }
})
```

## Error Handling in Callbacks

If `onRequest` throws, the request **is not sent**:

```typescript
useFetchGetPets({}, {
  onRequest: ({ headers }) => {
    const token = useCookie('auth-token').value
    if (!token) {
      // Request will not be sent
      throw new Error('No auth token available')
    }
    return {
      headers: {
        ...headers,
        'Authorization': `Bearer ${token}`
      }
    }
  }
})
```

## Best Practices

### ✅ Do

```typescript
// ✅ Return modified headers
onRequest: ({ headers }) => {
  return {
    headers: { ...headers, 'X-Custom': 'value' }
  }
}

// ✅ Return modified query
onRequest: ({ query }) => {
  return {
    query: { ...query, timestamp: Date.now() }
  }
}

// ✅ Log requests (no return needed for side effects)
onRequest: ({ url, method }) => {
  console.log(`${method} ${url}`)
}

// ✅ Track analytics (no return needed)
onRequest: async ({ url }) => {
  await trackEvent('api_request', { url })
}
```

### ❌ Don't

```typescript
// ❌ Don't rely on direct mutation
onRequest: ({ headers }) => {
  headers['X-Custom'] = 'value'
}

// ❌ Don't try to modify url/method
onRequest: () => {
  return { url: '/different-url' } // ❌ url/method are readonly!
}

// ❌ Don't modify unrelated state unnecessarily
onRequest: () => {
  someUnrelatedState.value = true // ⚠️ Side effect - use with caution
}

// ❌ Don't make other API calls (race conditions)
onRequest: async () => {
  await $fetch('/other-endpoint') // ❌ Can cause issues
}
```

Prefer returning a new object instead of mutating the incoming context directly. That is the contract the runtime consistently merges for both local and global callbacks.

## Next Steps

- [onSuccess Callback →](/composables/features/callbacks/on-success)
- [Global Callbacks →](/composables/features/global-callbacks/overview)
- [Request Interception →](/composables/features/request-interception)
