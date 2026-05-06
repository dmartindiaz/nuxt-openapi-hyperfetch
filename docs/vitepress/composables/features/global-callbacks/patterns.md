# URL Patterns

URL-based control is available in two forms:

1. The `patterns` array on a rule — restrict that rule to specific URL globs
2. URL conditions inside individual callbacks — fine-grained per-callback logic

## Using the patterns Array

Set `patterns` on a rule to restrict it to specific URL globs. The rule is silently skipped for all other URLs.

### Single rule

```typescript
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  return {
    provide: {
      getGlobalApiCallbacks: () => ({
        patterns: ['/api/private/**', '/api/admin/**'],
        onRequest: ({ headers }) => {
          const token = useCookie('auth-token').value
          return { headers: { ...headers, 'Authorization': `Bearer ${token}` } }
        },
      }),
    },
  }
})
```

### Multiple rules with different patterns

Pass an array of rules to apply different logic to different URL groups:

```typescript
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  return {
    provide: {
      getGlobalApiCallbacks: () => [
        // Add auth to all private routes
        {
          patterns: ['/api/private/**'],
          onRequest: ({ headers }) => {
            const token = useCookie('auth-token').value
            return { headers: { ...headers, 'Authorization': `Bearer ${token}` } }
          },
        },
        // Add billing key to billing routes
        {
          patterns: ['/api/billing/**'],
          onRequest: ({ headers }) => ({
            headers: { ...headers, 'X-Billing-Key': useBillingStore().apiKey },
          }),
        },
        // Global error handler with no pattern filter — runs for all URLs
        {
          onError: (error) => {
            if (error.status === 503) useToast().error('Service unavailable')
          },
        },
      ],
    },
  }
})
```

All rules are evaluated independently. A request to `/api/billing/invoices` matches the second rule but not the first; the third rule matches because it has no pattern filter.

All four callbacks (`onRequest`, `onSuccess`, `onError`, `onFinish`) are silently skipped for a rule when the URL doesn't match its `patterns`.

## Filtering Inside Callbacks

For per-callback URL logic, check `url` directly inside the callback:

```typescript
const globalCallbacks = {
  onRequest: ({ url, headers }) => {
    if (!url.startsWith('/api/private')) return // no-op for public routes
    const token = useCookie('auth-token').value
    return { headers: { ...headers, 'Authorization': `Bearer ${token}` } }
  }
}
```

Use rule-level `patterns` when the whole rule should be scoped. Use direct `url` checks when only one callback inside the rule needs extra branching.

### Common Patterns

```typescript
// Prefix check
if (url.startsWith('/api/admin')) { ... }

// Exact match
if (url === '/api/health') { ... }

// Exclude pattern
if (!url.startsWith('/api/public')) { ... }

// Contains
if (url.includes('/admin/')) { ... }

// Multiple conditions
const isProtected = url.startsWith('/api/private') || url.includes('/admin/')
```

### Multiple Route Groups

```typescript
const globalCallbacks = {
  onRequest: ({ url, headers }) => {
    if (url.startsWith('/api/billing')) {
      return { headers: { ...headers, 'X-Billing-Key': billingKey } }
    }
    if (url.startsWith('/api/users')) {
      const token = useCookie('auth-token').value
      return { headers: { ...headers, 'Authorization': `Bearer ${token}` } }
    }
    // No extra headers for other routes
  }
}
```

## Best Practices

```typescript
// ✅ Use a rule with patterns when the same logic applies to a named group of routes
getGlobalApiCallbacks: () => ({
  patterns: ['/api/private/**'],
  onRequest: ({ headers }) => { ... }
})

// ✅ Use multiple rules with patterns for different route groups
getGlobalApiCallbacks: () => [
  { patterns: ['/api/private/**'], onRequest: ({ headers }) => { ... } },
  { patterns: ['/api/billing/**'], onRequest: ({ headers }) => { ... } },
]

// ✅ Use url conditions inside callbacks for fine-grained logic
onRequest: ({ url, headers }) => {
  if (url.startsWith('/api/billing')) { ... }
}

// ✅ Use early returns for clarity
onRequest: ({ url, headers }) => {
  if (url.startsWith('/api/public')) return
  return { headers: { ...headers, 'Authorization': `Bearer ${token}` } }
}

// ✅ Extract a helper for reused conditions
const isPublic = (url: string) =>
  url.startsWith('/api/public') || url === '/api/health'
```

## Next Steps

- [Control Options →](/composables/features/global-callbacks/control-options)
- [Setup Guide →](/composables/features/global-callbacks/setup)
