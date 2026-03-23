# 🚀 Nuxt OpenAPI Generator

**Generate type-safe, SSR-compatible Nuxt composables from OpenAPI/Swagger specifications.**

Transform your API documentation into production-ready Nuxt 3 composables with full TypeScript support, lifecycle callbacks, and request interception—all in a single command.

---

## ✨ Features

- 🔒 **Type-Safe**: Full TypeScript support derived from your OpenAPI schema
- ⚡ **SSR Compatible**: Works seamlessly with Nuxt server-side rendering
- 🔄 **Lifecycle Callbacks**: `onRequest`, `onSuccess`, `onError`, `onFinish`
- 🌐 **Global Callbacks Plugin**: Define callbacks once, apply to all requests (with 3 control options)
- 🛡️ **Request Interception**: Modify headers, body, and query params before sending
- 🎯 **Smart Data Selection**: Pick specific fields with dot notation for nested paths
- 🤖 **Auto Type Inference**: Transform response data with automatic TypeScript type inference
- ⚡ **Automatic Generation**: Single command generates all API composables
- 📦 **Zero Runtime Dependencies**: Generated code only uses Nuxt built-ins
- 💡 **Developer Experience**: Interactive CLI with smart defaults

---

## 🔧 Generator Backends

Two generation backends are available. The CLI will ask you to choose one when running `nxh generate`:

| Backend | Tool | Requires Java | Best for |
|---------|------|:---:|----------|
| **official** | [@openapitools/openapi-generator-cli](https://openapi-generator.tech/) | ✅ Yes (11+) | Maximum spec compatibility, enterprise projects |
| **heyapi** | [@hey-api/openapi-ts](https://heyapi.dev/) | ❌ No | Quick setup, CI/CD pipelines, Node-only environments |

- **official** — Wraps the battle-tested Java-based [OpenAPI Generator](https://openapi-generator.tech/). Requires [Java 11+](https://adoptium.net).
- **heyapi** — Pure Node.js via [@hey-api/openapi-ts](https://heyapi.dev/). No Java needed — perfect for CI/CD pipelines and environments where installing Java is not practical.

> The CLI checks for Java automatically when `official` is selected and aborts with an install link if it's not found.

---

## 📦 Installation

```bash
npm install -g nuxt-openapi-hyperfetch
# or
yarn global add nuxt-openapi-hyperfetch
# or
pnpm add -g nuxt-openapi-hyperfetch
```

Or use directly with npx:

```bash
nxh generate
```

---

## 🚀 Quick Start

### 1. Generate API Composables

**Option A: Interactive Mode** (Recommended for first-time users)

```bash
nxh generate
```

The CLI will ask you:

- 📂 Path to your OpenAPI/Swagger file
- 📁 Output directory for generated files
- ✅ Which composables to generate (useFetch, useAsyncData, TanStack Query)

**Option B: With Arguments** (For automation/scripts)

```bash
nxh generate -i ./swagger.yaml -o ./src/api
```

Then select which composables to generate from the interactive prompt.

---

## 🛠️ Usage

### CLI Commands

#### `generate` - Generate API files and composables

```bash
# Interactive mode
nxh generate

# With input/output paths
nxh generate -i <openapi-file> -o <output-directory>
```

**Options:**

- `-i, --input <path>` - Path to your OpenAPI/Swagger file (`.yaml`, `.json`)
- `-o, --output <path>` - Output directory for generated files

**What it does:**

1. Generates TypeScript fetch API from your OpenAPI spec
2. Asks which composables you want to generate
3. Creates type-safe Nuxt composables with callbacks

**Example:**

```bash
nxh generate -i ./api-spec.yaml -o ./api
```

This generates:

```
api/
+-- runtime.ts
+-- apis/
│   +-- PetApi.ts
│   +-- StoreApi.ts
│   +-- UserApi.ts
+-- models/
│   +-- Pet.ts
│   +-- Order.ts
│   +-- User.ts
+-- composables/
    +-- use-fetch/
        +-- runtime/
        │   +-- useApiRequest.ts
        +-- composables/
        │   +-- useFetchAddPet.ts
        │   +-- useFetchGetPetById.ts
        │   +-- ...
        +-- index.ts
```

---

## 💻 Using Generated Composables

### Basic Example

```vue
<script setup lang="ts">
import { useFetchAddPet } from '@/api/composables/use-fetch';

const newPet = {
  name: 'Max',
  category: { id: 1, name: 'Dogs' },
  status: 'available',
};

const { data: pet, error, pending } = useFetchAddPet({ pet: newPet });
</script>

<template>
  <div>
    <div v-if="pending">Creating pet...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else-if="pet">Pet created! ID: {{ pet.id }}</div>
  </div>
</template>
```

### With Path Parameters

```vue
<script setup lang="ts">
import { useFetchGetPetById } from '@/api/composables/use-fetch';

const petId = ref(123);

const { data: pet, refresh } = useFetchGetPetById({ petId: petId.value });
</script>

<template>
  <div>
    <h1>{{ pet?.name }}</h1>
    <p>Status: {{ pet?.status }}</p>
    <button @click="refresh">Refresh</button>
  </div>
</template>
```

### With Query Parameters

```vue
<script setup lang="ts">
import { useFetchFindPetsByStatus } from '@/api/composables/use-fetch';

const status = ref('available');

const { data: pets } = useFetchFindPetsByStatus(
  { status: status.value },
  {
    // All useFetch options work!
    watch: [status],
    lazy: true,
  }
);
</script>

<template>
  <div>
    <select v-model="status">
      <option value="available">Available</option>
      <option value="pending">Pending</option>
      <option value="sold">Sold</option>
    </select>

    <div v-for="pet in pets" :key="pet.id">
      {{ pet.name }}
    </div>
  </div>
</template>
```

---

## ✨ Enhanced Callbacks

All generated composables support powerful lifecycle callbacks:

### `onRequest` - Request Interceptor

Modify the request before it's sent. Perfect for adding auth tokens, logging, or transforming data.

```vue
<script setup lang="ts">
const { data } = useFetchAddPet(
  { pet: newPet },
  {
    onRequest: (ctx) => {
      console.log('Sending request to:', ctx.url);
      console.log('Method:', ctx.method);
      console.log('Body:', ctx.body);

      // Add authentication header
      return {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'X-Request-ID': generateRequestId(),
        },
      };
    },
  }
);
</script>
```

**Context provided to `onRequest`:**

```typescript
{
  url: string;          // Request URL
  method: string;       // HTTP method (GET, POST, etc.)
  body?: any;          // Request body
  headers?: Record<string, string>;
  query?: Record<string, any>;
}
```

**Return value:** Modify request by returning:

```typescript
{
  body?: any;          // Modified body
  headers?: Record<string, string>;  // Additional/override headers
  query?: Record<string, any>;       // Additional/override query params
}
```

### `onSuccess` - Success Handler

Called when the request succeeds with the response data.

```vue
<script setup lang="ts">
const router = useRouter();

const { data } = useFetchAddPet(
  { pet: newPet },
  {
    onSuccess: (pet) => {
      // Fully typed! 'pet' has type Pet
      console.log('Pet created with ID:', pet.id);

      // Navigate to the new pet's page
      router.push(`/pets/${pet.id}`);

      // Show success notification
      showToast('Pet created successfully!', 'success');

      // Invalidate cache
      refreshNuxtData('pets');
    },
  }
);
</script>
```

### `onError` - Error Handler

Called when the request fails.

```vue
<script setup lang="ts">
const { data } = useFetchGetPetById(
  { petId: 123 },
  {
    onError: (error) => {
      console.error('Request failed:', error);

      // Handle specific error codes
      if (error.status === 404) {
        showToast('Pet not found', 'error');
        router.push('/pets');
      } else if (error.status === 401) {
        showToast('Please login', 'warning');
        router.push('/login');
      } else {
        showToast('Something went wrong', 'error');
      }
    },
  }
);
</script>
```

### `onFinish` - Completion Handler

Called when the request completes (success or error) with full context.

```vue
<script setup lang="ts">
const isLoading = ref(false);

const { data } = useFetchAddPet(
  { pet: newPet },
  {
    onRequest: () => {
      isLoading.value = true;
    },
    onFinish: ({ data, error, success }) => {
      isLoading.value = false;

      // Log analytics
      if (success) {
        trackEvent('pet_created', { petId: data.id });
      } else {
        trackEvent('pet_creation_failed', { error: error.message });
      }

      // Cleanup
      console.log('Request completed', { success });
    },
  }
);
</script>
```

---

## 🌐 Global Callbacks Plugin

Tired of repeating the same `onSuccess`, `onError`, `onRequest` callbacks across all your API calls? **Global Callbacks** let you define callbacks once that automatically apply to all requests.

### The Problem

Without global callbacks, you must repeat the same code everywhere:

```vue
<script setup lang="ts">
// Every single API call needs auth, error handling, and toasts... 😩
const { data: pet } = useFetchGetPetById(
  { petId: 123 },
  {
    onRequest: (ctx) => ({ headers: { Authorization: `Bearer ${token}` } }),
    onError: (error) => {
      if (error.status === 401) navigateTo('/login');
    },
    onSuccess: () => {
      showToast('Success!', 'success');
    },
  }
);

const { data: pets } = useFetchFindPetsByStatus(
  { status: 'available' },
  {
    onRequest: (ctx) => ({ headers: { Authorization: `Bearer ${token}` } }),
    onError: (error) => {
      if (error.status === 401) navigateTo('/login');
    },
    onSuccess: () => {
      showToast('Success!', 'success');
    },
  }
);

// ... and 50 more times 😫
</script>
```

### The Solution: Global Callbacks Plugin

When you generate composables, a **plugin template** is automatically created at:

```
plugins/api-callbacks.ts  (🔒 ONLY CREATED ONCE, never regenerated)
```

Configure your global callbacks **once**, and they'll apply to **all** API requests:

```typescript
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore();
  const router = useRouter();

  return {
    provide: {
      getGlobalApiCallbacks: () => ({
        // ✅ Runs before every request
        onRequest: (ctx) => {
          console.log(`[API] ${ctx.method} ${ctx.url}`);

          if (authStore.token) {
            return {
              headers: {
                Authorization: `Bearer ${authStore.token}`,
              },
            };
          }
        },

        // ✅ Runs after every successful request
        onSuccess: (data, ctx) => {
          showToast('Success!', 'success');
        },

        // ✅ Runs after every failed request
        onError: (error, ctx) => {
          if (error.status === 401) {
            showToast('Please login', 'warning');
            router.push('/login');
          } else if (error.status === 500) {
            showToast('Server error', 'error');
          }
        },

        // ✅ Runs after every request (success or error)
        onFinish: (ctx) => {
          console.log(`[API] Request completed in ${ctx.duration}ms`);
        },
      }),
    },
  };
});
```

Now **all your API calls** automatically include auth, error handling, and toasts:

```vue
<script setup lang="ts">
// ✅ Auth header added automatically
// ✅ 401 errors handled automatically
// ✅ Success toast shown automatically
const { data: pet } = useFetchGetPetById({ petId: 123 });

const { data: pets } = useFetchFindPetsByStatus({ status: 'available' });

// No repetition! 🎉
</script>
```

### 🎛️ Three Ways to Control Global Callbacks

But what if you need to disable global callbacks for a specific request? You have **three options**:

#### Option 1: `skipGlobalCallbacks` (Disable from the Call)

Skip all or specific global callbacks for a single request:

```vue
<script setup lang="ts">
// Skip ALL global callbacks
const { data } = useFetchLogin({ credentials }, { skipGlobalCallbacks: true });

// Skip ONLY onSuccess and onFinish (still run onRequest and onError)
const { data: public } = useFetchGetPublicData(
  {},
  { skipGlobalCallbacks: ['onSuccess', 'onFinish'] }
);
</script>
```

#### Option 2: `return false` (Global Cancels Local)

Return `false` from a global callback to prevent local callbacks from running:

```typescript
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  return {
    provide: {
      getGlobalApiCallbacks: () => ({
        onError: (error, ctx) => {
          // Show error toast
          showToast(error.message, 'error');

          // Return false to prevent local onError callbacks
          if (error.status >= 500) {
            return false; // 👻 Local onError won't run for 5xx errors
          }
        },
      }),
    },
  };
});
```

```vue
<script setup lang="ts">
const { data } = useFetchGetPet(
  { petId: 123 },
  {
    onError: (error) => {
      // ✅ This runs for 4xx errors (400, 401, 404, etc.)
      // ❌ This DOESN'T run for 5xx errors (global returned false)
      console.log('Local error handler');
    },
  }
);
</script>
```

#### Option 3: `patterns` (URL Matching)

Apply global callbacks only to specific endpoints using wildcard patterns:

```typescript
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  return {
    provide: {
      getGlobalApiCallbacks: () => ({
        // Apply to specific paths
        patterns: [
          '/api/auth/**', // All auth endpoints
          '/api/users/**', // All user endpoints
          '/api/admin/**', // All admin endpoints
        ],

        onRequest: (ctx) => {
          // Only runs for URLs matching patterns above
          return {
            headers: {
              'X-Admin-Token': adminToken,
            },
          };
        },
      }),
    },
  };
});
```

**Pattern syntax:**

- `**` matches any number of path segments: `/api/users/**` matches `/api/users`, `/api/users/123`, `/api/users/123/posts`
- `*` matches a single segment: `/api/users/*/posts` matches `/api/users/123/posts` but not `/api/users/123/comments/456`
- No pattern = applies to all requests

### 📋 Execution Order

When both global and local callbacks are defined:

1. **Global callback runs first**
2. **Local callback runs second** (unless global returned `false`)

```vue
<script setup lang="ts">
const { data } = useFetchGetPet(
  { petId: 123 },
  {
    onSuccess: (pet) => {
      console.log('2. Local callback'); // Second
    },
  }
);

// Global callback (in plugin):
// onSuccess: (data) => {
//   console.log('1. Global callback');  // First
// }
</script>
```

### 💡 Common Patterns

#### Pattern 1: Global Auth + Error Handling

```typescript
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  const { token, logout } = useAuthStore();

  return {
    provide: {
      getGlobalApiCallbacks: () => ({
        onRequest: (ctx) => {
          if (token.value) {
            return { headers: { Authorization: `Bearer ${token.value}` } };
          }
        },

        onError: (error) => {
          if (error.status === 401) {
            logout();
            navigateTo('/login');
            return false; // Don't run local error handlers for 401
          }
        },
      }),
    },
  };
});
```

#### Pattern 2: Analytics Tracking

```typescript
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  return {
    provide: {
      getGlobalApiCallbacks: () => ({
        onRequest: (ctx) => {
          trackEvent('api_request_start', {
            method: ctx.method,
            url: ctx.url,
          });
        },

        onFinish: (ctx) => {
          trackEvent('api_request_end', {
            method: ctx.method,
            url: ctx.url,
            success: ctx.success,
            duration: ctx.duration,
          });
        },
      }),
    },
  };
});
```

#### Pattern 3: Loading State Management

```typescript
// plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  const activeRequests = ref(0);
  const isLoading = computed(() => activeRequests.value > 0);

  return {
    provide: {
      isApiLoading: isLoading,
      getGlobalApiCallbacks: () => ({
        onRequest: () => {
          activeRequests.value++;
        },

        onFinish: () => {
          activeRequests.value--;
        },
      }),
    },
  };
});
```

```vue
<script setup lang="ts">
const { $isApiLoading } = useNuxtApp();
</script>

<template>
  <div v-if="$isApiLoading" class="loading-spinner">Loading...</div>
</template>
```

### 🔒 Plugin Safety

- ✅ Created **only once** when generating composables
- ✅ **Never regenerated** - your customizations are safe
- ✅ Works with **all composable types** (useFetch, useAsyncData, TanStack Query)
- ✅ **100% optional** - works without the plugin (backward compatible)

---

## 🌍 Real-World Examples

### 1. Authentication Flow

```vue
<script setup lang="ts">
import { useFetchLogin, useFetchGetUserProfile } from '@/api/composables/use-fetch';

const { token } = useAuthStore();

// Login request
const login = async (credentials) => {
  const { data } = await useFetchLogin(
    { credentials },
    {
      onSuccess: (response) => {
        // Save token
        useAuthStore().setToken(response.token);

        // Redirect to dashboard
        navigateTo('/dashboard');
      },
      onError: (error) => {
        showToast('Invalid credentials', 'error');
      },
    }
  );
};

// Authenticated request
const { data: user } = useFetchGetUserProfile(
  {},
  {
    onRequest: (ctx) => {
      // Automatically add auth header
      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    },
    onError: (error) => {
      if (error.status === 401) {
        // Token expired, redirect to login
        useAuthStore().logout();
        navigateTo('/login');
      }
    },
  }
);
</script>
```

### 2. Optimistic Updates

```vue
<script setup lang="ts">
import { useFetchUpdatePet } from '@/api/composables/use-fetch';

const pets = ref([]);
const tempId = ref(0);

const updatePet = (petId: number, updates: Partial<Pet>) => {
  // Optimistic update
  const index = pets.value.findIndex((p) => p.id === petId);
  const original = { ...pets.value[index] };
  pets.value[index] = { ...original, ...updates };

  useFetchUpdatePet(
    { pet: { ...original, ...updates } },
    {
      onSuccess: (updatedPet) => {
        // Replace with server response
        pets.value[index] = updatedPet;
        showToast('Pet updated', 'success');
      },
      onError: (error) => {
        // Rollback on error
        pets.value[index] = original;
        showToast('Update failed', 'error');
      },
    }
  );
};
</script>
```

### 3. Request Tracking & Analytics

```vue
<script setup lang="ts">
import { useFetchSearchPets } from '@/api/composables/use-fetch';

const searchQuery = ref('');

const { data: results } = useFetchSearchPets(
  { query: searchQuery.value },
  {
    onRequest: (ctx) => {
      const requestId = crypto.randomUUID();

      // Track search
      analytics.track('search_initiated', {
        query: searchQuery.value,
        requestId,
      });

      return {
        headers: { 'X-Request-ID': requestId },
      };
    },
    onFinish: ({ data, error, success }) => {
      if (success) {
        analytics.track('search_completed', {
          query: searchQuery.value,
          resultCount: data.length,
          duration: performance.now(),
        });
      } else {
        analytics.track('search_failed', {
          query: searchQuery.value,
          error: error.message,
        });
      }
    },
  }
);
</script>
```

### 4. Data Transformation & Picking

**Transform**: Convert API response data with automatic type inference

```vue
<script setup lang="ts">
import { useFetchGetPetById } from '@/api/composables/use-fetch';

// Transform response - TypeScript infers the return type!
const { data } = useFetchGetPetById(
  { petId: 123 },
  {
    transform: (pet) => ({
      displayName: `${pet.name} (${pet.status})`,
      isAvailable: pet.status === 'available',
      photoUrl: pet.photoUrls[0] || '/default.jpg',
    }),
  }
);
// data is Ref<{ displayName: string, isAvailable: boolean, photoUrl: string }>
</script>
```

**Pick**: Select specific fields from the response

```vue
<script setup lang="ts">
import { useFetchGetPetById } from '@/api/composables/use-fetch';

// Pick only the fields you need
const { data } = useFetchGetPetById(
  { petId: 123 },
  {
    pick: ['id', 'name', 'status'],
  }
);
// data is Ref<{ id: number, name: string, status: string }>

// Pick with nested paths using dot notation
const { data: userData } = useFetchGetUser(
  { userId: 456 },
  {
    pick: ['person.name', 'person.email', 'company.address.city', 'status'],
  }
);
// Maintains nested structure:
// { person: { name: '...', email: '...' }, company: { address: { city: '...' } }, status: '...' }
</script>
```

**Combine Pick + Transform**: Pick filters fields first, then transform processes them

```vue
<script setup lang="ts">
import { useFetchAddPet } from '@/api/composables/use-fetch';

const { data } = useFetchAddPet(
  { pet: formData },
  {
    // 1. Pick only needed fields (optimization)
    pick: ['id', 'name', 'status'],

    // 2. Transform picked data
    transform: (picked) => `Pet #${picked.id}: ${picked.name} (${picked.status})`,

    // 3. Callbacks receive transformed data
    onSuccess: (displayText) => {
      console.log(displayText); // "Pet #123: Max (available)"
    },
  }
);
// data is Ref<string>
</script>
```

### 5. Loading State Management

```vue
<script setup lang="ts">
import { useFetchGetPetById } from '@/api/composables/use-fetch';

const isLoading = ref(false);
const loadingMessage = ref('');

const { data: pet } = useFetchGetPetById(
  { petId: 123 },
  {
    onRequest: () => {
      isLoading.value = true;
      loadingMessage.value = 'Loading pet details...';
    },
    onFinish: ({ success, data, error }) => {
      isLoading.value = false;

      if (success) {
        loadingMessage.value = `Loaded ${data.name}`;
        setTimeout(() => (loadingMessage.value = ''), 3000);
      } else {
        loadingMessage.value = `Failed: ${error.message}`;
      }
    },
  }
);
</script>

<template>
  <div>
    <div v-if="isLoading" class="loading-spinner">
      {{ loadingMessage }}
    </div>
    <div v-else-if="pet">
      <h1>{{ pet.name }}</h1>
    </div>
  </div>
</template>
```

---

## 🔧 Advanced Usage

### Combining with useFetch Options

All standard `useFetch` options work alongside callbacks:

```vue
<script setup lang="ts">
const petId = ref(123);

const { data, pending, refresh } = useFetchGetPetById(
  { petId: petId.value },
  {
    // Callbacks
    onSuccess: (pet) => console.log('Loaded:', pet.name),

    // Standard useFetch options
    lazy: true, // Don't fetch immediately
    server: false, // Client-side only
    watch: [petId], // Re-fetch when petId changes
    immediate: false, // Don't auto-fetch
    dedupe: 'defer', // Deduplicate requests

    // Custom headers
    headers: {
      'Accept-Language': 'en-US',
    },

    // Transform response
    transform: (pet) => ({
      ...pet,
      displayName: `${pet.name} (${pet.status})`,
    }),
  }
);
</script>
```

### Global Headers Configuration

Automatically add headers (like authentication tokens) to **all** API requests without repeating code.

#### Option 1: Using Composable (Recommended)

Create `composables/useApiHeaders.ts` in your Nuxt project:

```typescript
// composables/useApiHeaders.ts
export const useApiHeaders = () => {
  const authStore = useAuthStore();

  // Return a function for reactive headers
  return () => {
    // Only add auth header if user is logged in
    if (!authStore.token) return {};

    return {
      Authorization: `Bearer ${authStore.token}`,
      'X-Client-Version': '1.0.0',
      // Add any other global headers
    };
  };
};
```

**That's it!** All generated composables will automatically include these headers:

```typescript
// ✅ Automatically includes Authorization header
const { data } = useFetchGetPet({ petId: 123 });

// ✅ You can still override or add more headers per request
const { data: pet } = useFetchAddPet(
  { pet: newPet },
  {
    headers: {
      'X-Custom-Header': 'value', // Merged with global headers
    },
  }
);
```

#### Option 2: Using Nuxt Plugin

Create `plugins/api-config.ts` in your Nuxt project:

```typescript
// plugins/api-config.ts
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore();

  return {
    provide: {
      getApiHeaders: () => {
        if (!authStore.token) return {};

        return {
          Authorization: `Bearer ${authStore.token}`,
          'X-Client-Version': '1.0.0',
        };
      },
    },
  };
});
```

**Type-safe** (optional): Extend Nuxt types in `types/api.d.ts`:

```typescript
// types/api.d.ts
declare module '#app' {
  interface NuxtApp {
    $getApiHeaders(): Record<string, string>;
  }
}

export {};
```

#### How it Works

**Priority order** (later overrides earlier):

1. 🌍 Global headers from `useApiHeaders()` composable
2. 🔌 Global headers from `$getApiHeaders` plugin
3. 📝 Headers passed in composable options
4. 🔄 Headers modified in `onRequest` callback

```typescript
// All of these are merged:
const { data } = useFetchGetPet(
  { petId: 123 },
  {
    headers: { 'X-Custom': 'value' }, // Merged with global
    onRequest: (ctx) => ({
      headers: { 'X-Request-ID': crypto.randomUUID() }, // Merged too
    }),
  }
);
```

**Benefits:**

- ✅ No need to repeat auth code in every request
- ✅ Reactive - token updates automatically apply
- ✅ Can use both methods together (headers are merged)
- ✅ Easy to disable (just don't create the file)
- ✅ Per-request override still possible

---

## ⚡ useAsyncData Generator

In addition to `useFetch`, you can generate composables based on Nuxt's `useAsyncData`. This is particularly useful when you need more control over data fetching or want to access response headers.

### Key Differences: useFetch vs useAsyncData

| Feature                     | useFetch          | useAsyncData                                |
| --------------------------- | ----------------- | ------------------------------------------- |
| **Automatic fetching**      | ✅ Yes            | ✅ Yes (configurable)                       |
| **SSR support**             | ✅ Yes            | ✅ Yes                                      |
| **Request deduplication**   | ✅ Yes            | ✅ Yes                                      |
| **Response headers access** | ❌ No             | ✅ Yes (Raw version)                        |
| **HTTP status access**      | ❌ No             | ✅ Yes (Raw version)                        |
| **Use case**                | Simple REST calls | Advanced scenarios with header/status needs |

### Dual Composables: Normal + Raw

When the OpenAPI generator creates Raw methods (e.g., `getPetByIdRaw`), **two composables** are generated:

1. **Normal version**: `useAsyncDataGetPetById` - Returns just the data
2. **Raw version**: `useAsyncDataGetPetByIdRaw` - Returns `{ data, headers, status, statusText }`

### Basic Usage

```vue
<script setup lang="ts">
import { useAsyncDataGetPetById } from '@/api/composables/use-async-data';

const petId = ref(123);

const {
  data: pet,
  error,
  pending,
  refresh,
} = useAsyncDataGetPetById(
  { petId: petId.value },
  {
    immediate: true, // Fetch on mount (default: true)
    lazy: false, // Block navigation until loaded (default: false)
    server: true, // Enable SSR (default: true)
  }
);
</script>
```

### 📡 Accessing Response Headers (Raw Version)

The Raw version is perfect for scenarios where you need response metadata:

```vue
<script setup lang="ts">
import { useAsyncDataGetPetByIdRaw } from '@/api/composables/use-async-data';

const petId = ref(123);

const { data: response, error, pending } = useAsyncDataGetPetByIdRaw({ petId: petId.value });

// response.value structure:
// {
//   data: Pet,              // The actual pet data
//   headers: Headers,       // Response headers
//   status: number,         // HTTP status code (200, 404, etc.)
//   statusText: string      // Status text ("OK", "Not Found", etc.)
// }

// Access headers
const contentType = computed(() => response.value?.headers.get('content-type'));

const rateLimit = computed(() => response.value?.headers.get('x-rate-limit-remaining'));

// Check status
const isSuccessful = computed(() => response.value?.status === 200);
</script>

<template>
  <div>
    <div v-if="pending">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else-if="response">
      <h1>{{ response.data.name }}</h1>
      <p>Status: {{ response.status }} {{ response.statusText }}</p>
      <p>Content-Type: {{ contentType }}</p>
      <p v-if="rateLimit">Rate Limit Remaining: {{ rateLimit }}</p>
    </div>
  </div>
</template>
```

### 🔧 Enhanced Callbacks with Raw Responses

All callback features work with both normal and Raw versions:

#### Normal Version Callbacks

```typescript
const { data: pet } = useAsyncDataGetPetById(
  { petId: 123 },
  {
    onRequest: (context) => {
      console.log('Fetching pet from:', context.url);
    },

    onSuccess: (pet) => {
      console.log('Pet loaded:', pet.name);
      showToast(`Welcome ${pet.name}!`);
    },

    onError: (error) => {
      console.error('Failed to load pet:', error);
      showErrorToast('Could not load pet');
    },

    onFinish: () => {
      console.log('Request completed');
    },
  }
);
```

#### Raw Version Callbacks (with Response Context)

In the Raw version, `onSuccess` receives **both** the data and the full response:

```typescript
const { data: response } = useAsyncDataGetPetByIdRaw(
  { petId: 123 },
  {
    onSuccess: (pet, responseContext) => {
      // pet: The transformed/picked data
      // responseContext: { headers, status, statusText, url }

      console.log('Pet:', pet.name);
      console.log('Status:', responseContext.status);
      console.log('Headers:', responseContext.headers);

      // Check rate limiting
      const remaining = responseContext.headers.get('x-rate-limit-remaining');
      if (remaining && parseInt(remaining) < 10) {
        showWarning('Rate limit running low!');
      }

      // Check cache headers
      const cacheControl = responseContext.headers.get('cache-control');
      console.log('Cache strategy:', cacheControl);
    },

    onError: (error) => {
      // Same as normal version
      console.error('Request failed:', error);
    },
  }
);
```

### 🔄 Transform and Pick (Works with Raw)

Transform and pick operations apply **only to the data**, not the full response:

```typescript
const { data: response } = useAsyncDataGetPetByIdRaw(
  { petId: 123 },
  {
    // Transform only affects 'data', not headers/status
    transform: (pet) => ({
      ...pet,
      displayName: `${pet.name} (${pet.status})`,
    }),

    // Pick only affects 'data'
    pick: ['name', 'status'] as const,

    onSuccess: (transformedPet, responseContext) => {
      // transformedPet has the transformed/picked data
      // responseContext.headers is still available
      console.log(transformedPet.displayName);
      console.log(responseContext.status); // 200
    },
  }
);

// response.value = {
//   data: { name: "Fluffy", status: "available", displayName: "Fluffy (available)" },
//   headers: Headers { ... },
//   status: 200,
//   statusText: "OK"
// }
```

### 🌍 Real-World Example: Authentication with Token Refresh

```vue
<script setup lang="ts">
import { useAsyncDataLoginUserRaw } from '@/api/composables/use-async-data';

const authStore = useAuthStore();
const username = ref('');
const password = ref('');

const {
  data: response,
  execute,
  pending,
} = useAsyncDataLoginUserRaw(
  { username: username.value, password: password.value },
  {
    immediate: false, // Don't fetch on mount

    onSuccess: (userData, responseContext) => {
      // Extract token from headers
      const token = responseContext.headers.get('authorization');
      const refreshToken = responseContext.headers.get('x-refresh-token');

      if (token && refreshToken) {
        // Store tokens
        authStore.setTokens({
          access: token.replace('Bearer ', ''),
          refresh: refreshToken,
        });

        // Store user data
        authStore.setUser(userData);

        // Check token expiration from headers
        const expiresIn = responseContext.headers.get('x-token-expires-in');
        if (expiresIn) {
          authStore.scheduleTokenRefresh(parseInt(expiresIn));
        }

        showToast('Login successful!');
        navigateTo('/dashboard');
      }
    },

    onError: (error, context) => {
      if (error.statusCode === 401) {
        showError('Invalid credentials');
      } else if (error.statusCode === 429) {
        showError('Too many login attempts. Please try again later.');
      } else {
        showError('Login failed. Please try again.');
      }
    },
  }
);

const handleLogin = () => {
  execute(); // Manually trigger the fetch
};
</script>
```

### ⏳ Lazy Loading with useAsyncData

Unlike `useFetch`, `useAsyncData` provides more control over when data is fetched:

```vue
<script setup lang="ts">
import { useAsyncDataGetInventoryRaw } from '@/api/composables/use-async-data';

const showInventory = ref(false);

// Don't fetch until user clicks "Show Inventory"
const { data: response, pending } = useAsyncDataGetInventoryRaw(
  {},
  {
    immediate: false, // Don't fetch on mount
    lazy: true, // Don't block navigation
    server: false, // Client-side only

    onSuccess: (inventory, responseContext) => {
      const lastModified = responseContext.headers.get('last-modified');
      console.log('Inventory last updated:', lastModified);

      // Check if data is from cache
      const cacheStatus = responseContext.headers.get('x-cache');
      if (cacheStatus === 'HIT') {
        console.log('Served from cache');
      }
    },
  }
);

watch(showInventory, (show) => {
  if (show && !response.value) {
    refresh(); // Fetch when user wants to see it
  }
});
</script>
```

### 📥 File Downloads with Headers

```vue
<script setup lang="ts">
import { useAsyncDataDownloadReportRaw } from '@/api/composables/use-async-data';

const {
  data: response,
  pending,
  execute,
} = useAsyncDataDownloadReportRaw(
  { reportId: 'monthly-2024' },
  {
    immediate: false,

    onSuccess: (reportData, responseContext) => {
      // Get filename from Content-Disposition header
      const disposition = responseContext.headers.get('content-disposition');
      const filename = disposition?.match(/filename="?(.+)"?/)?.[1] || 'report.pdf';

      // Get content type
      const contentType = responseContext.headers.get('content-type');

      // Create download
      const blob = new Blob([reportData], { type: contentType || 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      showToast(`Downloaded ${filename}`);
    },
  }
);

const handleDownload = () => {
  execute();
};
</script>
```

### 📊 Comparing Both Generators

**When to use useFetch:**

- ? Simple REST API calls
- ? You only need the response data
- ? Standard CRUD operations
- ? Quick prototyping

**When to use useAsyncData (especially Raw):**

- ? Need access to response headers (authentication tokens, rate limits, etc.)
- ? Need to check HTTP status codes
- ? File downloads with Content-Disposition headers
- ? Advanced caching strategies based on cache headers
- ? Token refresh flows
- ? Pagination with Link headers
- ? More control over fetch timing (immediate/lazy)

### Generated File Structure

When you select `useAsyncData` during generation:

```
swagger/
+-- composables/
    +-- use-async-data/
        +-- composables/
        │   +-- useAsyncDataGetPetById.ts      # Normal version
        │   +-- useAsyncDataGetPetByIdRaw.ts   # Raw version (if xxxRaw exists)
        │   +-- useAsyncDataAddPet.ts
        │   +-- useAsyncDataAddPetRaw.ts
        │   +-- ... (all API methods)
        +-- runtime/
        │   +-- useApiAsyncData.ts      # Normal wrapper
        │   +-- useApiAsyncDataRaw.ts   # Raw wrapper
        +-- shared/
        │   +-- runtime/
        │       +-- apiHelpers.ts       # Shared helper functions
        +-- index.ts                     # Exports all composables
```

### 🌐 Global Headers (Works with useAsyncData)

Just like `useFetch`, `useAsyncData` supports automatic global headers:

```typescript
// composables/useApiHeaders.ts (same for both generators)
export const useApiHeaders = () => {
  const authStore = useAuthStore();

  return () => ({
    Authorization: `Bearer ${authStore.token}`,
    'X-Client-Version': '1.0.0',
  });
};

// All useAsyncData composables will automatically include these headers
const { data } = useAsyncDataGetPetById({ petId: 123 });
// Request includes Authorization header automatically ✅
```

---

---

## 🖥️ Nuxt Server Routes Generator

In addition to client-side composables (`useFetch`, `useAsyncData`), you can generate **Nuxt Server Routes** that act as backend proxies to your external API. This approach provides several benefits for production applications.

### Why Use Server Routes?

| Benefit                | Description                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| 🔒 **Security**        | API keys and secrets stay server-side, never exposed to clients            |
| 🌐 **CORS**            | Bypass CORS restrictions - your Nuxt server handles the external API calls |
| ⚙️ **Request Control** | Add rate limiting, caching, logging, or data transformation on the server  |
| 📁 **Single Source**   | All API logic in one place, easier to maintain and test                    |
| ⚡ **Performance**     | Cache responses server-side, reduce client bundle size                     |

### How It Works

```
Client (Browser)          Nuxt Server              External API
     │                         │                         │
     │  useFetch('/api/pet/123')                        │
     +------------------------>│                         │
     │                         │  `$`fetch(backend + '/pet/123')
     │                         +------------------------>│
     │                         │                         │
     │                         │<------------------------│
     │<------------------------│                         │
     │      Pet data           │                         │
```

The generated server routes are standard Nuxt server endpoints that proxy requests to your backend API.

### 📁 Generated File Structure

When you select `Nuxt Server Routes` during generation and choose a path (e.g., `server/api`):

```
server/
+-- api/
    +-- pet/
    │   +-- index.get.ts              # GET /api/pet
    │   +-- index.post.ts             # POST /api/pet
    │   +-- [id].get.ts               # GET /api/pet/{id}
    │   +-- [id].put.ts               # PUT /api/pet/{id}
    │   +-- [id].delete.ts            # DELETE /api/pet/{id}
    │   +-- [id]/
    │       +-- uploadImage.post.ts   # POST /api/pet/{id}/uploadImage
    +-- store/
    │   +-- inventory.get.ts          # GET /api/store/inventory
    +-- user/
    │   +-- [username].get.ts         # GET /api/user/{username}
    │   +-- login.get.ts              # GET /api/user/login
    +-- _routes.ts                    # Documentation file (auto-generated)
```

### ⚙️ Configuration Required

**⚠️ IMPORTANT**: After generation, you **MUST** configure your backend URL for the server routes to work.

#### Step 1: Create `.env` file

Copy `.env.example` to `.env` in your project root:

```bash
cp .env.example .env
```

Configure your backend API URL:

```env
# Backend API Configuration
API_BASE_URL=https://your-backend-api.com/api
API_SECRET=your-api-secret-token-here
```

#### Step 2: Update `nuxt.config.ts`

Add `runtimeConfig` to your `nuxt.config.ts` (see `nuxt.config.example.ts` for reference):

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    // All private keys (server-only, never exposed to client)
    apiSecret: process.env.API_SECRET || '',
    apiBaseUrl: process.env.API_BASE_URL || '',
  },
});
```

**🔒 Security Note**: Both `apiSecret` and `apiBaseUrl` are **private** (not in `public`). This means:

- ✅ They're only accessible on the server
- ✅ Never exposed to the client or included in the browser bundle
- ✅ The client only knows `/api/pet/123`, not your real backend URL
- ✅ Enhanced security - your backend URL remains hidden

**Without this configuration, server routes will fail with "baseUrl is undefined".**

#### Step 3: Test Your Setup

Start your dev server and try accessing a route:

```bash
npm run dev
```

Visit `http://localhost:3000/api/pet/1` - you should see data from your backend API.

### 🚀 Using Generated Server Routes

Once configured, use standard Nuxt `useFetch` or `$fetch` with `/api/*` endpoints:

#### Basic GET Request

```vue
<script setup lang="ts">
// Fetch pet by ID through your Nuxt server
const petId = ref(123);

const { data: pet, error, pending } = useFetch(`/api/pet/${petId.value}`);
</script>

<template>
  <div>
    <div v-if="pending">Loading pet...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else-if="pet">
      <h1>{{ pet.name }}</h1>
      <p>Status: {{ pet.status }}</p>
    </div>
  </div>
</template>
```

#### POST Request

```vue
<script setup lang="ts">
const newPet = ref({
  name: 'Fluffy',
  status: 'available',
  category: { id: 1, name: 'Cats' },
});

const addPet = async () => {
  try {
    const pet = await $fetch('/api/pet', {
      method: 'POST',
      body: newPet.value,
    });

    console.log('Pet created:', pet);
    navigateTo(`/pets/${pet.id}`);
  } catch (error) {
    console.error('Failed to create pet:', error);
  }
};
</script>
```

#### With Query Parameters

```vue
<script setup lang="ts">
const status = ref('available');

// Query params are automatically passed through
const { data: pets } = useFetch('/api/pet/findByStatus', {
  query: { status: status.value },
  watch: [status],
});
</script>

<template>
  <div>
    <select v-model="status">
      <option value="available">Available</option>
      <option value="pending">Pending</option>
      <option value="sold">Sold</option>
    </select>

    <div v-for="pet in pets" :key="pet.id">
      {{ pet.name }}
    </div>
  </div>
</template>
```

### 🔒 Security Best Practices

1. **Never expose API secrets to the client** - Use `runtimeConfig.apiSecret` (server-only)
2. **Validate inputs** - Always validate request parameters and body
3. **Add authentication** - Check user permissions in server routes
4. **Rate limiting** - Protect your backend from abuse
5. **Error handling** - Don't leak sensitive error details to clients

### 🤔 When to Use Server Routes vs Client Composables

**Use Server Routes when:**

- ✅ You need to hide API keys/secrets
- ✅ You want to bypass CORS restrictions
- ✅ You need server-side caching or rate limiting
- ✅ You want to transform/sanitize data before sending to client
- ✅ You're building a public-facing application

**Use Client Composables when:**

- ✅ You're building an internal dashboard
- ✅ API is already CORS-enabled and public
- ✅ You want faster development iteration
- ✅ You don't need server-side logic

**You can use both!** Server routes for sensitive operations, client composables for read-only public data.

### 🏗️ Backend for Frontend (BFF) with Transformers

The generator can optionally create a **Backend for Frontend (BFF) layer** that adds business logic, authentication, and data transformation to your server routes│without editing generated files.

#### What is BFF?

BFF is an architectural pattern where you add a custom logic layer between your Nuxt server and the backend API:

```
Client → Server Route (generated) → Transformer (your code) → Backend API
              ?
         Auth Context
```

**Key Benefits:**

- ✅ **Regeneration-Safe**: Your custom code is never overwritten
- ✅ **Auth-Agnostic**: Works with any Nuxt auth module
- 🔒 **Type-Safe**: Full TypeScript support with IntelliSense
- ✅ **Optional**: Routes work with or without BFF (automatic fallback)
- ✅ **Modular**: Separate files for auth and business logic

#### Enabling BFF

When generating Nuxt Server Routes, the CLI will ask:

```
? Enable BFF (Backend for Frontend) with transformers and auth? (Y/n)
```

Select **Yes** to enable BFF features.

#### 📁 Generated BFF Structure

With BFF enabled, the generator creates this structure:

```
server/
  auth/                              🔐 Auth context (YOU customize)
    context.ts                       ✏️ Implement auth logic HERE
    types.ts                         📝 Auth types and helpers
  api/                               ⚠️ Generated routes (DO NOT EDIT)
    pet/
      [id].get.ts                    🔄 Calls transformPet() automatically
      index.post.ts
  bff/
    transformers/                    ⚙️ Business logic (YOU customize)
      pet.ts                         🔄 Transform pet data
      store.ts                       🔄 Transform store data
      user.ts                        🔄 Transform user data
    _transformers.example.ts         📖 Examples (regenerated)
    README.md                        📚 BFF documentation
```

**📋 Which Files Are Safe to Edit?**

| File                                  | Safe to Edit? | Regenerated? | Purpose                  |
| ------------------------------------- | ------------- | ------------ | ------------------------ |
| `server/auth/context.ts`              | ✅ **YES**    | ❌ NO        | Your auth implementation |
| `server/auth/types.ts`                | ✅ **YES**    | ❌ NO        | Custom auth types        |
| `server/bff/transformers/*.ts`        | ✅ **YES**    | ❌ NO        | Your business logic      |
| `server/api/**/*.ts`                  | ❌ **NO**     | ✅ YES       | Generated proxy routes   |
| `server/bff/_transformers.example.ts` | ❌ **NO**     | ✅ YES       | Reference examples       |
| `server/bff/README.md`                | ❌ **NO**     | ✅ YES       | Documentation            |

#### 🔐 Step 1: Implement Authentication

Edit `server/auth/context.ts` to implement your auth logic **once**. The generator provides examples for popular auth modules.

##### Example 1: @sidebase/nuxt-auth

```typescript
// server/auth/context.ts
import type { H3Event } from 'h3';
import type { AuthContext } from './types';
import { getServerSession } from '#auth';

export async function getAuthContext(event: H3Event): Promise<AuthContext> {
  const session = await getServerSession(event);

  if (!session) {
    return {
      isAuthenticated: false,
      userId: null,
      roles: [],
      permissions: [],
    };
  }

  return {
    isAuthenticated: true,
    userId: session.user.id,
    email: session.user.email,
    roles: session.user.roles || [],
    permissions: session.user.permissions || [],
  };
}
```

##### Example 2: Custom JWT

```typescript
// server/auth/context.ts
import { getCookie } from 'h3';
import jwt from 'jsonwebtoken';

export async function getAuthContext(event: H3Event): Promise<AuthContext> {
  const token = getCookie(event, 'auth-token');

  if (!token) {
    return { isAuthenticated: false, userId: null, roles: [], permissions: [] };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    return {
      isAuthenticated: true,
      userId: decoded.sub,
      email: decoded.email,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
    };
  } catch (error) {
    return { isAuthenticated: false, userId: null, roles: [], permissions: [] };
  }
}
```

##### Example 3: Session Cookies

```typescript
// server/auth/context.ts
import { getCookie } from 'h3';

export async function getAuthContext(event: H3Event): Promise<AuthContext> {
  const sessionId = getCookie(event, 'session-id');

  if (!sessionId) {
    return { isAuthenticated: false, userId: null, roles: [], permissions: [] };
  }

  // Look up session in your database/store
  const session = await db.sessions.findOne({ id: sessionId });

  if (!session || session.expiresAt < Date.now()) {
    return { isAuthenticated: false, userId: null, roles: [], permissions: [] };
  }

  return {
    isAuthenticated: true,
    userId: session.userId,
    roles: session.roles || [],
    permissions: session.permissions || [],
  };
}
```

#### 🔧 Step 2: Add Business Logic with Transformers

Transformers receive data from the backend and can modify it before sending to the client. Each resource (pet, store, user) has its own transformer file.

##### Example: Add Permission Flags

```typescript
// server/bff/transformers/pet.ts
import type { H3Event } from 'h3';
import type { AuthContext } from '~/server/auth/types';
import type { Pet } from '~/types/api';

export async function transformPet(
  data: Pet,
  event: H3Event,
  auth: AuthContext | null
): Promise<Pet & { canEdit: boolean; canDelete: boolean }> {
  return {
    ...data,
    // Add permission flags based on user auth
    canEdit: auth?.permissions.includes('pet:write') ?? false,
    canDelete: auth?.permissions.includes('pet:delete') ?? false,
  };
}
```

**Client usage** (no changes needed):

```vue
<script setup lang="ts">
const { data: pet } = await useFetch('/api/pet/123');

// pet.canEdit and pet.canDelete are now available!
</script>

<template>
  <div>
    <h1>{{ pet.name }}</h1>
    <button v-if="pet.canEdit">Edit</button>
    <button v-if="pet.canDelete">Delete</button>
  </div>
</template>
```

##### Example: Filter Sensitive Data

```typescript
// server/bff/transformers/user.ts
export async function transformUser(
  data: any,
  event: H3Event,
  auth: AuthContext | null
): Promise<any> {
  const { password, ssn, internalId, apiKey, ...safe } = data;

  // Only admins can see sensitive fields
  if (auth?.roles.includes('admin')) {
    return data; // Return everything
  }

  return safe; // Return filtered data
}
```

##### Example: Combine Multiple Sources

```typescript
// server/bff/transformers/pet.ts
export async function transformPet(
  data: Pet,
  event: H3Event,
  auth: AuthContext | null
): Promise<any> {
  // Fetch related data
  const owner = await $fetch(`/api/users/${data.ownerId}`);
  const stats = await $fetch(`/api/pets/${data.id}/stats`);

  return {
    ...data,
    owner: {
      name: owner.name,
      email: owner.email,
    },
    stats: {
      likes: stats.likes,
      views: stats.views,
    },
  };
}
```

---

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

### For New Developers & AI Assistants

- **[Quick Start Guide](./docs/QUICK-START.md)** - Understand the project in 5 minutes
  - What is this project and how does it work?
  - Core concepts (two-stage generation, wrapper pattern, runtime architecture)
  - Key files to read first
  - Most common development tasks
  - Quick commands reference

### Architecture & Design

- **[Architecture Documentation](./docs/ARCHITECTURE.md)** - Deep dive into design patterns
  - Architectural overview and component map
  - Core patterns explained (wrapper, two-stage, shared code)
  - Design decisions (ADRs) with rationale
  - Global callbacks system architecture
  - Extension points for customization

### Complete Reference

- **[API Reference](./docs/API-REFERENCE.md)** - Complete technical documentation
  - CLI commands and options
  - All TypeScript interfaces and types
  - Parser, template, and runtime APIs
  - Callback interfaces and execution order
  - Generated composables reference

### Development & Contributing

- **[Development Guide](./docs/DEVELOPMENT.md)** - For contributors and extenders
  - Development workflow and best practices
  - How to add new features (callbacks, generators, parser features)
  - Testing strategies
  - Code style guidelines
  - Debugging tips and tools

### Problem Solving

- **[Troubleshooting Guide](./docs/TROUBLESHOOTING.md)** - Solutions to common issues
  - Installation problems
  - Generation errors
  - Runtime and type errors
  - Callback troubleshooting
  - Performance optimization
  - OpenAPI spec issues

### Quick Links

- **[Documentation Index](./docs/README.md)** - Full navigation and glossary
- **[Contributing Guidelines](./CONTRIBUTING.md)** - How to contribute code

---

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

Before contributing:

1. Read the [Contributing Guidelines](./CONTRIBUTING.md)
2. Check the [Development Guide](./docs/DEVELOPMENT.md)
3. Review the [Code Style Guide](./CONTRIBUTING.md#code-style)
4. Run `npm run validate` before submitting PR

---

## 📄 License

Apache-2.0 License - see [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with these amazing technologies:

- [Nuxt 3](https://nuxt.com/) - The Intuitive Vue Framework
- [OpenAPI Generator](https://openapi-generator.tech/) - Code generation from OpenAPI specs
- [ts-morph](https://ts-morph.com/) - TypeScript AST manipulation
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Prettier](https://prettier.io/) - Code formatting

---

**Ready to get started?** Jump to the [Quick Start](#-quick-start) or read the [Quick Start Documentation](./docs/QUICK-START.md)!

```typescript
// server/bff/transformers/pet.ts
export async function transformPet(
  data: Pet,
  event: H3Event,
  auth: AuthContext | null
): Promise<Pet & { reviews: Review[]; availability: string }> {
  const config = useRuntimeConfig();

  // Fetch additional data in parallel
  const [reviews, availability] = await Promise.all([
    $fetch(`${config.apiBaseUrl}/reviews/${data.id}`),
    $fetch(`${config.apiBaseUrl}/availability/${data.id}`),
  ]);

  return {
    ...data,
    reviews,
    availability,
  };
}
```

##### Example: Permission-Based Filtering

```typescript
// server/bff/transformers/report.ts
export async function transformReport(
  data: any,
  event: H3Event,
  auth: AuthContext | null
): Promise<any> {
  const result = { ...data };

  // Hide financial data for non-admins
  if (!auth?.roles.includes('admin')) {
    delete result.revenue;
    delete result.costs;
    delete result.profitMargin;
  }

  // Hide internal notes unless user has permission
  if (!auth?.permissions.includes('report:read:internal')) {
    delete result.internalNotes;
  }

  return result;
}
```

##### Example: Add Computed Fields

```typescript
// server/bff/transformers/order.ts
export async function transformOrder(
  data: Order,
  event: H3Event,
  auth: AuthContext | null
): Promise<Order & { totalPrice: number; isOwner: boolean }> {
  // Calculate total price
  const totalPrice = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Check ownership
  const isOwner = auth?.userId === data.userId;

  return {
    ...data,
    totalPrice,
    isOwner,
  };
}
```

#### ⚙️ How Generated Routes Use BFF

When BFF is enabled, generated routes automatically call transformers with fallback support:

```typescript
// server/api/pet/[id].get.ts (AUTO-GENERATED)
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'pet');

  // 1. Load auth context (optional, won't break if missing)
  let auth = null;
  try {
    const { getAuthContext } = await import('~/server/auth/context');
    auth = await getAuthContext(event);
  } catch {
    // Auth not configured - continue without it
  }

  // 2. Fetch from backend API
  const config = useRuntimeConfig();
  const data = await $fetch(`${config.apiBaseUrl}/pet/${id}`);

  // 3. Transform data (optional, won't break if missing)
  try {
    const { transformPet } = await import('~/server/bff/transformers/pet');
    return await transformPet(data, event, auth);
  } catch {
    // Transformer not found - return raw data
    return data;
  }
});
```

**Key features:**

- ✅ Works without auth implementation (returns `null`)
- ✅ Works without transformer (returns raw data)
- ✅ Fully type-safe with TypeScript
- ✅ Zero runtime errors from missing files

#### ✅ Regeneration Safety

**Critical feature:** When you regenerate routes with the CLI:

```bash
nxh generate -i updated-swagger.yaml -o ./swagger
```

**What happens:**

- 🔄 `server/api/**/*.ts` are **regenerated** (expected)
- ✅ `server/auth/context.ts` is **preserved** (your auth code is safe!)
- ✅ `server/auth/types.ts` is **preserved** (your types are safe!)
- ✅ `server/bff/transformers/*.ts` are **preserved** (your logic is safe!)
- ✨ New transformers are created only if they don't exist
- 🔄 Examples and docs are regenerated (for reference)

**Console output shows what's preserved:**

```
🏗️ Generating BFF structure...

   ⏭️  Skipped: server/auth/context.ts (already exists)
   ⏭️  Skipped: server/auth/types.ts (already exists)
   ⏭️  Skipped: server/bff/transformers/pet.ts (already exists)
   ✅ Created: server/bff/transformers/order.ts (customize this)
   🔄 Updated: server/bff/_transformers.example.ts (reference only)
   🔄 Updated: server/bff/README.md
```

This ensures **your custom code is never lost** when updating your API.

#### 💡 Best Practices

1. **Keep Transformers Pure**
   - Focus on data transformation, not side effects
   - Avoid database writes or external API calls that change state
   - Use for enriching, filtering, and computing data

2. **One Transformer Per Resource**
   - Keep files organized: `pet.ts`, `store.ts`, `user.ts`
   - Each transformer handles one API resource
   - Share common logic through utility functions

3. **Use TypeScript**

   ```typescript
   // Good: Explicit types
   export async function transformPet(
     data: Pet,
     event: H3Event,
     auth: AuthContext | null
   ): Promise<Pet & { canEdit: boolean }> {
     // TypeScript helps you here!
   }
   ```

4. **Handle Edge Cases**

   ```typescript
   export async function transformPet(data: any, event, auth) {
     // Handle null/undefined
     if (!data) return data;

     // Handle arrays
     if (Array.isArray(data)) {
       return data.map((item) => ({ ...item, transformed: true }));
     }

     // Handle single object
     return { ...data, transformed: true };
   }
   ```

5. **Document Your Logic**

   ```typescript
   /**
    * Transform pet data to include:
    * - User permissions (canEdit, canDelete)
    * - Availability status from separate API
    * - Owner information if user is authenticated
    */
   export async function transformPet(data, event, auth) {
     // Implementation
   }
   ```

6. **Use Helpers from `types.ts`**

   ```typescript
   import { hasPermission, hasRole } from '~/server/auth/types';

   export async function transformPet(data, event, auth) {
     return {
       ...data,
       canEdit: hasPermission(auth, 'pet:write'),
       isAdmin: hasRole(auth, 'admin'),
     };
   }
   ```

7. **Performance Considerations**

   ```typescript
   // Use Promise.all for parallel requests
   const [reviews, availability] = await Promise.all([
     fetchReviews(data.id),
     fetchAvailability(data.id),
   ]);

   // Cache expensive operations
   const cached = await useStorage().getItem(`pet:${data.id}`);
   if (cached) return cached;
   ```

#### 🐛 Troubleshooting BFF

**Problem**: Transformer not being called

**Solution**:

- Verify the transformer file exists: `server/bff/transformers/{resource}.ts`
- Check the function name matches: `transform{Resource}` (PascalCase)
- Look for import errors in browser/server console

**Problem**: Auth context is always `null`

**Solution**:

- Verify `getAuthContext()` is implemented in `server/auth/context.ts`
- Check for errors in auth implementation (try/catch hides them)
- Test auth logic independently before using in transformers

**Problem**: Types not working

**Solution**:

- Ensure types are exported from `~/types/api`
- Add explicit type parameters to transformer functions
- Run `npm run dev` to regenerate type definitions

**Problem**: Regeneration overwrites my code

**Solution**:

- Never edit files in `server/api/` directory (always regenerated)
- Only edit `server/auth/` and `server/bff/transformers/`
- Check console output - it shows which files are skipped

#### 📖 More Examples

For comprehensive examples of transformer patterns, see the generated file:

```
server/bff/_transformers.example.ts
```

This file includes examples for:

- Basic transformation
- Filtering sensitive data
- Adding permission flags
- Combining multiple sources
- Permission-based filtering
- Array transformations
- Error handling

And the generated documentation:

```
server/bff/README.md
```

---

## 📋 API Reference

### Generated Composable Signature

```typescript
export const useFetch[MethodName] = (
  params: [RequestType],
  options?: ApiRequestOptions<[ResponseType]>
) => UseFetchReturn<[ResponseType]>
```

### ApiRequestOptions

```typescript
interface ApiRequestOptions<T> {
  // Callbacks
  onRequest?: (context: RequestContext) => void | ModifiedRequestContext;
  onSuccess?: (data: any) => void | Promise<void>; // Receives transformed data
  onError?: (error: any) => void | Promise<void>;
  onFinish?: (context: FinishContext<any>) => void | Promise<void>;

  // Data transformations
  transform?: (data: T) => any; // Transform response with auto type inference
  pick?: ReadonlyArray<string>; // Pick specific fields (supports dot notation)

  // All useFetch options
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  query?: Record<string, any>;
  lazy?: boolean;
  server?: boolean;
  immediate?: boolean;
  watch?: WatchSource[];
  // ... and all other useFetch options
}
```

#### Transform & Pick Options

**`transform?: (data: T) => any`**

Transform the API response before callbacks and data ref are updated. TypeScript automatically infers the return type.

```typescript
// Example: Transform Pet to display format
transform: (pet) => ({
  displayName: pet.name.toUpperCase(),
  available: pet.status === 'available',
});
// Return type is inferred as { displayName: string, available: boolean }
```

**`pick?: ReadonlyArray<string>`**

Select specific fields from the response. Supports dot notation for nested paths. Applied _before_ `transform`.

```typescript
// Simple field selection
pick: ['id', 'name', 'status'];

// Nested paths with dot notation
pick: ['person.name', 'person.email', 'company.address.city'];
// Result maintains structure: { person: { name, email }, company: { address: { city } } }
```

**Execution Order**: `API Response` → `pick` → `transform` → `onSuccess` → `data ref`

---

## 🔒 TypeScript Support

All generated composables are fully typed:

```typescript
// Request params are typed
const params: AddPetRequest = {
  pet: {
    name: 'Max',
    status: 'available',
  },
};

// Response is typed
const { data } = useFetchAddPet(params);
// data is Ref<Pet | null>

// Callbacks receive typed parameters
onSuccess: (pet) => {
  // pet is typed as Pet
  pet.name; // ✅ Autocomplete works
  pet.status; // ✅ Type-safe
};
```

---

## 📄 Example OpenAPI File

```yaml
openapi: 3.0.0
info:
  title: Pet Store API
  version: 1.0.0
paths:
  /pet:
    post:
      operationId: addPet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
      responses:
        '200':
          description: Successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
  /pet/{petId}:
    get:
      operationId: getPetById
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
components:
  schemas:
    Pet:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        status:
          type: string
          enum: [available, pending, sold]
```

---

## 🔧 Troubleshooting

### "Cannot find module '@/api/composables/use-fetch'"

Make sure the path alias is configured in your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  alias: {
    '@': fileURLToPath(new URL('./', import.meta.url)),
  },
});
```

### "useFetch is not defined"

The generated composables require a Nuxt 3 environment. Make sure you're importing them in a `.vue` file or Nuxt context.

### Re-generating composables

Simply run the generate command again:

```bash
nxh generate -i ./swagger.yaml -o ./api
```

Select the composables you want to regenerate.

---

## 📄 License

MIT

---

## 🤝 Contributing

We welcome contributions! Whether it's bug reports, feature requests, or code contributions, all are appreciated.

### How to Contribute

1. **Read the guidelines**: See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines
2. **Development docs**: See [INSTRUCTIONS.md](./INSTRUCTIONS.md) for technical documentation
3. **Code style**: We use ESLint + Prettier for consistent code formatting
4. **Before submitting**:
   ```bash
   npm run format      # Format code
   npm run lint:fix    # Fix linting issues
   npm run validate    # Run all checks
   ```

### Development Setup

```bash
# Clone and install
git clone https://github.com/dmartindiaz/nuxt-openapi-hyperfetch.git
cd nuxt-openapi-hyperfetch
npm install

# Build and test
npm run build
npm run generator
```

---

**Made with ❤️ for Nuxt developers**
