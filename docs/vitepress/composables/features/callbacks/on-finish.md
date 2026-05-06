# onFinish Callback

The `onFinish` callback is called **always** after a request completes, regardless of success or failure.

## Signature

```typescript
onFinish?: (context: FinishContext<T>) => void | Promise<void>

interface FinishContext<T> {
  /** Response data (if successful) */
  data?: T;
  /** Error (if failed) */
  error?: any;
  /** Whether the request was successful */
  success: boolean;
}
```

The callback receives a **context object** with the request result, allowing you to handle completion logic based on success or failure.

## Basic Usage

```typescript
// Simple cleanup
useFetchGetPets({}, {
  onFinish: () => {
    console.log('Request complete')
  }
})

// With context
useFetchGetPets({}, {
  onFinish: ({ data, error, success }) => {
    if (success) {
      console.log('Success! Got', data?.length, 'pets')
    } else {
      console.log('Failed:', error?.message)
    }
  }
})
```

## When It Runs

`onFinish` **always runs**:

- ✅ After successful request (2xx)
- ✅ After failed request (4xx/5xx)
- ✅ After network error
- ✅ After other thrown request failures

It runs **last** in the callback chain:

```
   onRequest  →  Request  →  Success? → onSuccess  ↘
                                 ↓                    onFinish (always)
                              Error?  →  onError    ↗
```

## Common Use Cases

### Hide Loading Spinner

```vue
<script setup lang="ts">
const loading = ref(false)

const { data: pets } = useFetchGetPets({}, {
  onRequest: () => {
    loading.value = true
  },
  onFinish: ({ success }) => {
    loading.value = false
    console.log('Request finished:', success ? 'success' : 'failed')
  }
})
</script>

<template>
  <div v-if="loading" class="spinner">Loading...</div>
  <ul v-else>
    <li v-for="pet in pets" :key="pet.id">{{ pet.name }}</li>
  </ul>
</template>
```

### Measure Request Duration

```typescript
const startTime = ref(0)

useFetchGetPets({}, {
  onRequest: () => {
    startTime.value = performance.now()
  },
  onFinish: ({ success, error }) => {
    const duration = performance.now() - startTime.value
    console.log(`Request took ${duration.toFixed(2)}ms - ${success ? 'success' : 'failed'}`)
    
    // Track slow requests
    if (duration > 1000) {
      trackEvent('slow_request', {
        duration,
        url: '/api/pets',
        success,
        errorStatus: error?.status
      })
    }
  }
})
```

## Async Operations

The callback can be async:

```typescript
useFetchGetPets({}, {
  onFinish: async ({ success, data, error }) => {
    // Send metrics to analytics
    await trackTiming('api_request_complete', {
      success,
      itemCount: data?.length || 0,
      errorStatus: error?.status
    })
  }
})
```

::: tip When to use onSuccess/onError vs onFinish
- Use **`onSuccess`** when you only care about successful responses
- Use **`onError`** when you only care about errors
- Use **`onFinish`** when you need logic that runs regardless of outcome, or when you want to handle both cases in one place
:::

## Order of Execution

```typescript
useFetchGetPets({}, {
  onRequest: () => {
    console.log('1. onRequest')
  },
  onSuccess: (data) => {
    console.log('2. onSuccess')
  },
  onError: (error) => {
    console.log('2. onError')
  },
  onFinish: ({ success }) => {
    console.log('3. onFinish (always last, success:', success, ')')
  }
})

// Output (success):
// 1. onRequest
// 2. onSuccess
// 3. onFinish (always last, success: true)

// Output (error):
// 1. onRequest
// 2. onError
// 3. onFinish (always last, success: false)
```

## Best Practices

### ✅ Do

```typescript
// ✅ Hide loading indicators
onFinish: ({ success }) => {
  loading.value = false
  console.log('Finished:', success ? 'success' : 'failed')
}

// ✅ Cleanup resources
onFinish: ({ success, error }) => {
  abortController = null
  console.log('Cleanup complete, success:', success)
}

// ✅ Track completion
onFinish: ({ success, data, error }) => {
  trackEvent('request_complete', {
    success,
    itemCount: data?.length,
    errorStatus: error?.status
  })
}

// ✅ Reset UI state
onFinish: ({ success }) => {
  isSubmitting.value = false
  console.log('State reset, success:', success)
}
```

### ❌ Don't

```typescript
// ❌ Don't forget the context parameter if you need it
onFinish: () => {
  // If you need success status, use the context:
  // onFinish: ({ success }) => { ... }
}

// ❌ Don't use onFinish for logic that only applies to success
onFinish: ({ data, success }) => {
  if (success) {
    showSuccessToast(data) // Use onSuccess instead
  }
}

// ❌ Don't use onFinish for logic that only applies to errors
onFinish: ({ error, success }) => {
  if (!success) {
    showErrorToast(error) // Use onError instead
  }
}

// ✅ Do use onFinish for cleanup and unified logic
onFinish: ({ success }) => {
  isLoading.value = false  // ✅ Cleanup
  console.log('Done:', success ? 'success' : 'failed') // ✅ Unified logging
}
```

## Next Steps

- [Callbacks Overview →](/composables/features/callbacks/overview)
- [Global Callbacks →](/composables/features/global-callbacks/overview)
- [onError Callback →](/composables/features/callbacks/on-error)
