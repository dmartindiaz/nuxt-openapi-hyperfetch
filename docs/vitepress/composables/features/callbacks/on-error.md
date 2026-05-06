# onError Callback

The `onError` callback is called when the HTTP request fails with a **4xx/5xx status code** or a **network error** occurs.

## Signature

```typescript
onError?: (error: any) => void | Promise<void>
```

The runtime forwards the thrown request error from Nuxt or `$fetch`. In practice that often includes fields such as `status`, `statusText`, `data`, and `message`, but the exact shape depends on the underlying error.

## Basic Usage

```typescript
useFetchGetPetById(
  {
    path: { petId: 123 },
  },
  {
    onError: (error) => {
      console.error('Failed to load pet:', error.message)
    }
  }
)
```

## Common Use Cases

### Show Error Message

```typescript
useFetchGetPets({}, {
  onError: (error) => {
    showToast(`Error: ${error.message}`, 'error')
  }
})
```

### Handle by Status Code

```typescript
useFetchGetPetById(
  {
    path: { petId: 123 },
  },
  {
    onError: (error) => {
      switch (error.status) {
        case 404:
          showToast('Pet not found', 'error')
          navigateTo('/pets')
          break
        case 401:
          showToast('Please log in', 'error')
          navigateTo('/login')
          break
        case 403:
          showToast('Access denied', 'error')
          break
        case 500:
          showToast('Server error, please try again', 'error')
          break
        default:
          showToast('An error occurred', 'error')
      }
    }
  }
)
```

### Redirect on Unauthorized

```typescript
useFetchGetPets({}, {
  onError: (error) => {
    if (error.status === 401) {
      // Clear auth token
      useCookie('auth-token').value = null
      
      // Redirect to login
      navigateTo('/login')
    }
  }
})
```

### Log Errors

```typescript
useFetchGetPets({}, {
  onError: (error) => {
    console.error('[API Error]', {
      url: error.url,
      status: error.status,
      message: error.message,
      data: error.data,
      timestamp: new Date().toISOString()
    })
  }
})
```

### Retry Logic

```vue
<script setup lang="ts">
const retryCount = ref(0)
const maxRetries = 3

const { refresh } = useFetchGetPets({}, {
  onError: async (error) => {
    if (error.status >= 500 && retryCount.value < maxRetries) {
      retryCount.value++
      showToast(`Retrying... (${retryCount.value}/${maxRetries})`, 'info')
      
      // Wait 2 seconds and retry
      await new Promise(resolve => setTimeout(resolve, 2000))
      refresh()
    } else {
      showToast('Failed after retries', 'error')
    }
  }
})
</script>
```

### Track Error Analytics

```typescript
useFetchGetPets({}, {
  onError: async (error) => {
    await trackEvent('api_error', {
      url: error.url,
      status: error.status,
      message: error.message,
      timestamp: Date.now()
    })
  }
})
```

### Show Form Validation Errors

```vue
<script setup lang="ts">
const formErrors = ref<Record<string, string>>({})

const { execute: submit } = useFetchCreatePet(
  { body: formData.value },
  {
    immediate: false,
    onError: (error) => {
      if (error.status === 422) {
        // Validation errors
        formErrors.value = error.data.errors || {}
        showToast('Please fix validation errors', 'error')
      } else {
        showToast('Failed to create pet', 'error')
      }
    }
  }
)
</script>

<template>
  <form @submit.prevent="submit">
    <div>
      <input v-model="formData.name" />
      <span v-if="formErrors.name" class="error">
        {{ formErrors.name }}
      </span>
    </div>
  </form>
</template>
```

## When It Runs

`onError` **runs** when:

- ✅ Response status is **4xx** (400, 401, 403, 404, 422, etc.)
- ✅ Response status is **5xx** (500, 502, 503, etc.)
- ✅ Network error (no internet, CORS, timeout)
- ✅ Other thrown request failures

`onError` **does not run** when:

- ❌ Response status is **2xx** (use `onSuccess`)
- ❌ Request hasn't been executed yet

## Error Types

### Client Errors (4xx)

```typescript
useFetchGetPets({}, {
  onError: (error) => {
    if (error.status >= 400 && error.status < 500) {
      // Client error
      if (error.status === 400) {
        showToast('Bad request', 'error')
      } else if (error.status === 401) {
        navigateTo('/login')
      } else if (error.status === 404) {
        showToast('Not found', 'error')
      } else if (error.status === 422) {
        showToast('Validation failed', 'error')
      }
    }
  }
})
```

### Server Errors (5xx)

```typescript
useFetchGetPets({}, {
  onError: (error) => {
    if (error.status >= 500) {
      // Server error
      showToast('Server error, please try again later', 'error')
      
      // Log for monitoring
      logErrorToService(error)
    }
  }
})
```

### Network Errors

```typescript
useFetchGetPets({}, {
  onError: (error) => {
    if (!error.status) {
      // Network error (no status code)
      showToast('Network error, check your connection', 'error')
    }
  }
})
```

## Async Operations

The callback can be async:

```typescript
useFetchGetPets({}, {
  onError: async (error) => {
    // Send error to monitoring service
    await sendToErrorTracking({
      url: error.url,
      status: error.status,
      message: error.message,
      stack: error.stack
    })
    
    // Show user message
    showToast('An error occurred', 'error')
  }
})
```

## Accessing Error Details

```typescript
useFetchGetPets({}, {
  onError: (error) => {
    console.log('Status:', error.status)
    console.log('Status Text:', error.statusText)
    console.log('Message:', error.message)
    console.log('Data:', error.data)
  }
})
```

Treat these fields as commonly available rather than guaranteed on every transport error.

## Complex Examples

### Multi-Step Error Handling

```typescript
useFetchCreateOrder(
  { body: orderData.value },
  {
    onError: async (error) => {
      // 1. Log error
      console.error('[Order Error]', error)
      
      // 2. Track analytics
      await trackEvent('order_error', {
        status: error.status,
        message: error.message
      })
      
      // 3. Handle by status
      if (error.status === 422) {
        // Validation error
        showToast('Please check your order details', 'error')
      } else if (error.status === 402) {
        // Payment required
        showToast('Payment failed', 'error')
        navigateTo('/checkout/payment')
      } else {
        // Generic error
        showToast('Failed to create order', 'error')
      }
    }
  }
)
```

### Conditional Retry

```vue
<script setup lang="ts">
const shouldRetry = (error: ApiError) => {
  // Retry on 5xx errors or specific 4xx errors
  return error.status >= 500 || error.status === 408 || error.status === 429
}

const retries = ref(0)
const maxRetries = 3

const { refresh } = useFetchGetPets({}, {
  onError: async (error) => {
    if (shouldRetry(error) && retries.value < maxRetries) {
      retries.value++
      
      // Exponential backoff
      const delay = Math.pow(2, retries.value) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      
      refresh()
    } else {
      showToast('Request failed', 'error')
      retries.value = 0
    }
  }
})
</script>
```

### Error State Management

```vue
<script setup lang="ts">
const errorState = ref<{
  hasError: boolean
  message: string
  status: number | null
  canRetry: boolean
}>({
  hasError: false,
  message: '',
  status: null,
  canRetry: false
})

const { refresh } = useFetchGetPets({}, {
  onRequest: () => {
    errorState.value = {
      hasError: false,
      message: '',
      status: null,
      canRetry: false
    }
  },
  onError: (error) => {
    errorState.value = {
      hasError: true,
      message: error.message,
      status: error.status,
      canRetry: error.status >= 500
    }
  }
})

const retry = () => {
  if (errorState.value.canRetry) {
    refresh()
  }
}
</script>

<template>
  <div v-if="errorState.hasError" class="error-state">
    <p>{{ errorState.message }}</p>
    <button v-if="errorState.canRetry" @click="retry">
      Retry
    </button>
  </div>
</template>
```

## Best Practices

### ✅ Do

```typescript
// ✅ Show user-friendly messages
onError: (error) => {
  if (error.status === 404) {
    showToast('Item not found', 'error')
  }
}

// ✅ Handle auth errors
onError: (error) => {
  if (error.status === 401) {
    navigateTo('/login')
  }
}

// ✅ Log for debugging
onError: (error) => {
  console.error('[API Error]', error)
}

// ✅ Track errors
onError: async (error) => {
  await trackEvent('api_error', { status: error.status })
}
```

### ❌ Don't

```typescript
// ❌ Don't ignore errors
onError: () => {
  // Nothing - user doesn't know it failed!
}

// ❌ Don't show technical details to users
onError: (error) => {
  alert(JSON.stringify(error)) // Too technical
}

// ❌ Don't retry indefinitely
onError: async (error) => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  refresh() // Will retry forever!
}
```

## Next Steps

- [on Finish Callback →](/composables/features/callbacks/on-finish)
- [Global Callbacks →](/composables/features/global-callbacks/overview)
