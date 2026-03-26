# 📖 API Reference - Complete Technical Reference

> **Purpose**: Complete technical documentation of all interfaces, functions, and configuration options.

## Table of Contents

- [CLI Commands](#cli-commands)
- [Configuration](#configuration)
- [Interfaces & Types](#interfaces--types)
- [Parser API](#parser-api)
- [Template API](#template-api)
- [Runtime APIs](#runtime-apis)
- [Callback Interfaces](#callback-interfaces)
- [Generated Composables](#generated-composables)

## CLI Commands

### `generate`

Generate Nuxt composables from OpenAPI/Swagger specifications.

```bash
nxh generate [options]
```

**Options:**

| Option                  | Alias | Type     | Description                |
| ----------------------- | ----- | -------- | -------------------------- |
| `--input <file>`        | `-i`  | `string` | OpenAPI/Swagger file path  |
| `--output <directory>`  | `-o`  | `string` | Output directory           |
| `--composables <types>` | `-c`  | `string` | Comma-separated types list |

**Composable Types:**

- `useFetch` - Nuxt 3 useFetch composables
- `useAsyncData` - Nuxt 3 useAsyncData composables (normal + raw)
- `nuxt-server` - Nuxt server routes with BFF pattern

**Interactive Mode:**

```bash
nxh generate
# Prompts for input file, output directory, and composable types
```

**Non-Interactive Mode:**

```bash
nxh generate -i swagger.yaml -o ./swagger
# Still prompts for composable types
```

**Fully Automated:**

```bash
echo "useFetch" | nxh generate -i swagger.yaml -o ./swagger
```

**Exit Codes:**

- `0` - Success
- `1` - Error (missing files, parsing errors, etc.)

## Configuration

### OpenAPI Generator Config

Located in: `openapitools.json` (auto-created if missing)

```json
{
  "generator-cli": {
    "version": "7.14.0",
    "generators": {
      "typescript": {
        "generatorName": "typescript-fetch",
        "output": "./swagger"
      }
    }
  }
}
```

**Key Settings:**

- `generatorName`: Must be `typescript-fetch` (only supported target)
- `output`: Where OpenAPI Generator writes TypeScript files
- `version`: OpenAPI Generator CLI version

### Prettier Config

Generated files are formatted with Prettier using these settings:

```typescript
{
  parser: 'typescript',
  singleQuote: true,
  semi: true,
  trailingComma: 'es5',
  printWidth: 100
}
```

## Interfaces & Types

### MethodInfo

**File**: `src/generators/shared/types.ts`

**Purpose**: Represents a single API endpoint with all information needed for code generation.

```typescript
export interface MethodInfo {
  // Basic info
  name: string; // e.g., 'addPet'
  composableName: string; // e.g., 'useFetchAddPet'
  path: string; // e.g., '/pet' or '/pet/{petId}'
  httpMethod: string; // 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH'

  // Type information
  requestType?: string; // e.g., 'AddPetRequest'
  responseType: string; // e.g., 'Pet'

  // Request details
  pathParams: string[]; // e.g., ['petId']
  queryParams: string[]; // e.g., ['status', 'limit']
  headers: Record<string, string>; // Default headers to include
  hasBody: boolean; // true if method uses a request body
  bodyField?: string; // e.g., 'pet' (from requestParameters['pet'])
  hasQueryParams: boolean; // true if has query parameters

  // Metadata
  description?: string; // JSDoc description from the method
  hasRawMethod: boolean; // true if xxxRaw() method exists
  rawMethodName?: string; // e.g., 'addPetRaw'
}
```

**Example:**

```typescript
{
  name: 'addPet',
  composableName: 'useFetchAddPet',
  path: '/pet',
  httpMethod: 'POST',
  requestType: 'AddPetRequest',
  responseType: 'Pet',
  pathParams: [],
  queryParams: [],
  headers: {},
  hasBody: true,
  bodyField: 'pet',
  hasQueryParams: false,
  hasRawMethod: false
}
```

### ApiClassInfo

**File**: `src/generators/shared/types.ts`

**Purpose**: Groups all methods from a single API class.

```typescript
export interface ApiClassInfo {
  className: string; // e.g., 'PetApi'
  methods: MethodInfo[]; // All methods from this API class
}
```

### RequestContext

**File**: `src/generators/shared/runtime/apiHelpers.ts`

**Purpose**: Context object passed to `onRequest` callback.

```typescript
export interface RequestContext {
  url: string; // Request URL
  method: string; // HTTP method
  body?: any; // Request body
  headers?: Record<string, string>; // Headers
  query?: Record<string, any>; // Query params
}
```

**Usage:**

```typescript
onRequest: (ctx: RequestContext) => {
  console.log(`Making ${ctx.method} request to ${ctx.url}`);
};
```

### ModifiedRequestContext

**File**: `src/generators/shared/runtime/apiHelpers.ts`

**Purpose**: Returned by `onRequest` to modify the request.

```typescript
export interface ModifiedRequestContext {
  headers?: Record<string, string>; // Modified headers
  query?: Record<string, any>; // Modified query params
  body?: any; // Modified body
}
```

**Usage:**

```typescript
onRequest: (ctx) => {
  return {
    headers: {
      ...ctx.headers,
      Authorization: `Bearer ${token}`,
    },
  };
};
```

### SuccessContext

**File**: `src/generators/shared/runtime/apiHelpers.ts`

**Purpose**: Context passed to `onSuccess` callback. Different for normal vs raw.

**Normal Version:**

```typescript
export interface SuccessContext {
  url: string;
  method: string;
}
```

**Raw Version:**

```typescript
export interface SuccessContext {
  url: string;
  method: string;
  headers: Headers; // Response headers
  status: number; // HTTP status code
  statusText: string; // Status text
}
```

**Usage:**

```typescript
// Normal
onSuccess: (data: Pet, ctx: SuccessContext) => {
  console.log(`Got pet from ${ctx.url}`);
};

// Raw
onSuccess: (data: Pet, ctx: SuccessContext) => {
  const token = ctx.headers.get('X-Auth-Token');
  console.log(`Status: ${ctx.status}`);
};
```

### ErrorContext

**File**: `src/generators/shared/runtime/apiHelpers.ts`

**Purpose**: Context passed to `onError` callback.

```typescript
export interface ErrorContext {
  url: string;
  method: string;
  status?: number; // HTTP status if available
  message: string; // Error message
}
```

### FinishContext

**File**: `src/generators/shared/runtime/apiHelpers.ts`

**Purpose**: Context passed to `onFinish` callback.

```typescript
export interface FinishContext {
  success: boolean; // true if succeeded, false if error
  data?: any; // Data if success
  error?: any; // Error if failed
  duration?: number; // Optional: request duration in ms
  url: string;
  method: string;
}
```

### ApiRequestOptions

**File**: `src/generators/shared/runtime/apiHelpers.ts`

**Purpose**: Options for all `useApiRequest` calls.

```typescript
export interface ApiRequestOptions<T> {
  // useFetch native options
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  query?: Record<string, any>;
  baseURL?: string;
  server?: boolean;
  lazy?: boolean;
  immediate?: boolean;

  // Custom features
  pick?: string[]; // Dot notation field selection
  transform?: (data: T) => any; // Transform response

  // Lifecycle callbacks
  onRequest?: (ctx: RequestContext) => void | ModifiedRequestContext | false;
  onSuccess?: (data: T, ctx: SuccessContext) => void | false;
  onError?: (error: any, ctx: ErrorContext) => void | false;
  onFinish?: (ctx: FinishContext) => void;

  // Global callbacks control
  skipGlobalCallbacks?: boolean | Array<'onRequest' | 'onSuccess' | 'onError' | 'onFinish'>;

  // Any other useFetch options
  [key: string]: any;
}
```

### ApiAsyncDataOptions

**File**: `src/generators/use-async-data/runtime/useApiAsyncData.ts`

**Purpose**: Options for `useAsyncData` composables (normal version).

```typescript
export interface ApiAsyncDataOptions<T> {
  // useAsyncData native options
  server?: boolean;
  lazy?: boolean;
  immediate?: boolean;
  dedupe?: 'cancel' | 'defer';

  /**
   * Disable automatic refresh when reactive params change.
   * Set to false to prevent re-fetching when params/url refs update.
   * @default true
   */
  watch?: boolean;

  // Custom features
  pick?: string[];
  transform?: (data: T) => any;

  // Lifecycle callbacks
  onRequest?: (ctx: RequestContext) => void | ModifiedRequestContext | false;
  onSuccess?: (data: T) => void | false;
  onError?: (error: any) => void | false;
  onFinish?: (ctx: FinishContext) => void;

  // Global callbacks control
  skipGlobalCallbacks?: boolean | string[];
}
```

### ApiAsyncDataRawOptions

**File**: `src/generators/use-async-data/runtime/useApiAsyncDataRaw.ts`

**Purpose**: Options for `useAsyncData` raw composables.

```typescript
export interface ApiAsyncDataRawOptions<T> extends ApiAsyncDataOptions<T> {
  // Same as ApiAsyncDataOptions
  // But onSuccess signature is different:
  // onSuccess?: (data: T, ctx: SuccessContext) => void | false
  // where ctx includes: headers, status, statusText
}
```

### RawResponse

**File**: `src/generators/use-async-data/runtime/useApiAsyncDataRaw.ts`

**Purpose**: Response structure for raw composables.

```typescript
export interface RawResponse<T> {
  data: T; // Actual response data
  headers: Headers; // Response headers
  status: number; // HTTP status code
  statusText: string; // Status text
}
```

**Usage:**

```typescript
const { data, pending } = useAsyncDataGetPetRaw({ petId: 123 });
// data.value = { data: Pet, headers: Headers, status: 200, statusText: 'OK' }

const pet = data.value?.data;
const authToken = data.value?.headers.get('X-Auth-Token');
const wasCreated = data.value?.status === 201;
```

## Parser API

### extractMethodInfo()

**File**: `src/generators/use-fetch/parser.ts`

**Signature:**

```typescript
function extractMethodInfo(method: MethodDeclaration, sourceFile: SourceFile): MethodInfo | null;
```

**Purpose**: Extract API information from a TypeScript method.

**Parameters:**

- `method`: ts-morph MethodDeclaration node
- `sourceFile`: ts-morph SourceFile for context

**Returns**: `MethodInfo` object or `null` if extraction fails

**Algorithm:**

1. Extract method name
2. Find `xxxRequestOpts()` method (contains HTTP details)
3. Parse return statement to get path, method, body, headers
4. Extract parameter types
5. Extract return type (response type)
6. Generate composable name and file name

**Error Handling**: Returns `null` on errors (logged to console)

### getApiFiles()

**File**: `src/generators/use-fetch/parser.ts`

**Signature:**

```typescript
function getApiFiles(inputDir: string): string[];
```

**Purpose**: Find all API files in the `apis/` subdirectory.

**Parameters:**

- `inputDir`: Path to the root output directory (e.g., `./swagger`). The function appends `/apis` internally.

**Returns**: Array of absolute file paths

**Filters**: Only includes `*.ts` files that are not `index.ts`

### parseApiFile()

**File**: `src/generators/use-fetch/parser.ts`

**Signature:**

```typescript
function parseApiFile(filePath: string): ApiClassInfo;
```

**Purpose**: Parse a single API file and extract all methods.

**Parameters:**

- `filePath`: Absolute path to API file

**Returns**: `ApiClassInfo` for the first class found in the file

**Algorithm:**

1. Create ts-morph Project
2. Add source file
3. Find all classes
4. For each class:
   - Extract all methods
   - Call `extractMethodInfo()` for each
   - Filter out nulls
5. Return array of ApiClassInfo

## Template API

### generateFileHeader()

**File**: `src/generators/use-fetch/templates.ts`

**Signature:**

```typescript
function generateFileHeader(): string;
```

**Returns**: TypeScript header comment

```typescript
// @ts-nocheck - This file runs in user's Nuxt project with different tsconfig
```

### generateImports()

**File**: `src/generators/use-fetch/templates.ts`

**Signature:**

```typescript
function generateImports(method: MethodInfo, apiImportPath: string): string;
```

**Purpose**: Generate import statements for composable file.

**Returns:**

```typescript
import type { AddPetRequest, Pet } from '../apis/PetApi';
import { useApiRequest, type ApiRequestOptions } from '../runtime/useApiRequest';
```

### generateFunctionBody()

**File**: `src/generators/use-fetch/templates.ts`

**Signature:**

```typescript
function generateFunctionBody(method: MethodInfo): string;
```

**Purpose**: Generate composable function code.

**Returns:**

```typescript
export const useFetchAddPet = (
  params: MaybeRef<AddPetRequest>,
  options?: ApiRequestOptions<Pet>
) => {
  const p = isRef(params) ? params : shallowRef(params);
  return useApiRequest<Pet>('/pet', {
    method: 'POST',
    body: computed(() => p.value.pet),
    ...options,
  });
};
```

**Handles:**

- Static URLs (`'/pet'`)
- Reactive URLs with path params via `() => \`/pet/${p.value.petId}\``
- Query params as `computed(() => ({ ... }))` for reactivity
- Body field extraction
- `MaybeRef<T>` params — plain objects are auto-wrapped in `shallowRef`

### generateComposableFile()

**File**: `src/generators/use-fetch/templates.ts`

**Signature:**

```typescript
function generateComposableFile(method: MethodInfo, apiImportPath: string): string;
```

**Purpose**: Generate complete file content for a composable.

**Returns**: Full file content (header + imports + function)

## Runtime APIs

### useApiRequest()

**File**: `src/generators/use-fetch/runtime/useApiRequest.ts`

**Signature:**

```typescript
export function useApiRequest<T>(
  url: string | (() => string),
  options?: ApiRequestOptions<T>
): UseFetchReturn<T>;
```

**Purpose**: Wrapper for `useFetch` with lifecycle callbacks.

**Features:**

- ✅ Execute callbacks in correct order
- ✅ Apply `pick` for field selection
- ✅ Apply `transform` for data transformation
- ✅ Merge global and local callbacks
- ✅ Support request modification via `onRequest`
- ✅ Full TypeScript type safety

**Implementation Details:**

```typescript
export function useApiRequest<T>(url: string, options?: ApiRequestOptions<T>) {
  // 1. Extract skipGlobalCallbacks
  const skipGlobalCallbacks = options?.skipGlobalCallbacks;

  // 2. Merge callbacks
  const mergedCallbacks = mergeCallbacks(
    url,
    {
      onRequest: options?.onRequest,
      onSuccess: options?.onSuccess,
      onError: options?.onError,
      onFinish: options?.onFinish,
    },
    skipGlobalCallbacks
  );

  // 3. Execute onRequest
  let modifiedOptions = { ...options };
  if (mergedCallbacks.onRequest) {
    const ctx = { url, method: options?.method, ... };
    const result = mergedCallbacks.onRequest(ctx);
    if (result) {
      modifiedOptions = applyRequestModifications(modifiedOptions, result);
    }
  }

  // 4. Call useFetch
  const result = useFetch<T>(url, modifiedOptions);

  // 5. Watch for data, error, and pending state changes
  watch(
    () => [result.data.value, result.error.value, result.pending.value] as const,
    async ([data, error, pending], [prevData, prevError, prevPending]) => {
      if (data && data !== prevData) {
        // Apply pick/transform
        let processedData = data;
        if (pick) processedData = applyPick(data, pick);
        if (transform) processedData = transform(processedData);

        // onSuccess
        if (mergedCallbacks.onSuccess) {
          await mergedCallbacks.onSuccess(processedData);
        }
      }

      if (error && error !== prevError) {
        // onError
        if (mergedCallbacks.onError) {
          await mergedCallbacks.onError(error);
        }
      }

      // onFinish when request completes (was pending, now not)
      if (prevPending && !pending && mergedCallbacks.onFinish) {
        await mergedCallbacks.onFinish({ data: ..., error: ..., success: !error });
      }
    },
    { immediate: true }
  );

  return result;
}
```

### useApiAsyncData()

**File**: `src/generators/use-async-data/runtime/useApiAsyncData.ts`

**Signature:**

```typescript
export function useApiAsyncData<T>(
  key: string,
  url: string | (() => string),
  options?: ApiAsyncDataOptions<T>
): AsyncDataReturn<T>;
```

**Purpose**: Wrapper for `useAsyncData` with callbacks (normal version).

**Key Differences from useApiRequest:**

- Uses `$fetch` inside a `useAsyncData` handler instead of `useFetch` directly
- Callbacks execute in try/catch inside the fetch function
- Reactive watching via explicit `watchSources` (URL functions + body/params refs)
- Requires unique `key` parameter
- `watch: false` disables all reactive re-fetching

### useApiAsyncDataRaw()

**File**: `src/generators/use-async-data/runtime/useApiAsyncDataRaw.ts`

**Signature:**

```typescript
export function useApiAsyncDataRaw<T>(
  key: string,
  url: string,
  options?: ApiAsyncDataRawOptions<T>
): AsyncDataReturn<RawResponse<T>>;
```

**Purpose**: Wrapper with full response (data + headers + status).

**Key Differences:**

- Uses `$fetch.raw` instead of `$fetch`
- Returns `RawResponse<T>` instead of `T`
- `onSuccess` receives `(data, responseContext)` with headers/status
- `pick`/`transform` apply only to data, not full response

## Callback Interfaces

### Global Callbacks Config

**File**: `plugins/api-callbacks.ts` (copied to user's project)

**Structure:**

```typescript
export default defineNuxtPlugin(() => {
  return {
    provide: {
      getGlobalApiCallbacks: () => ({
        patterns: string[]; // Optional URL patterns
        onRequest?: (ctx: RequestContext) => void | ModifiedRequestContext | false;
        onSuccess?: (data: any, ctx: SuccessContext) => void | false;
        onError?: (error: any, ctx: ErrorContext) => void | false;
        onFinish?: (ctx: FinishContext) => void;
      }),
    },
  };
});
```

**Pattern Syntax:**

- `**` - Matches any number of path segments
- `*` - Matches single path segment
- No pattern - Applies to all URLs

**Examples:**

```typescript
patterns: [
  '/api/auth/**', // All auth endpoints
  '/api/users/**', // All user endpoints
  '/api/admin/*/logs', // /api/admin/{id}/logs only
];
```

### Helper Functions

#### getGlobalCallbacks()

```typescript
function getGlobalCallbacks(): GlobalCallbacksConfig | null;
```

**Purpose**: Read global callbacks from Nuxt plugin.

**Returns**: Global config or `null` if plugin doesn't exist

#### shouldApplyGlobalCallback()

```typescript
function shouldApplyGlobalCallback(
  callbackName: string,
  skipConfig: SkipGlobalCallbacks | undefined,
  url: string,
  patterns?: string[]
): boolean;
```

**Purpose**: Determine if global callback should run.

**Checks:**

1. `skipConfig === true` → false
2. `skipConfig.includes(callbackName)` → false
3. URL matches patterns (if patterns exist) → true/false
4. Otherwise → true

#### mergeCallbacks()

```typescript
function mergeCallbacks(
  url: string,
  localCallbacks: Partial<GlobalCallbacksConfig>,
  skipGlobalCallbacks?: SkipGlobalCallbacks
): Required<Omit<GlobalCallbacksConfig, 'patterns'>>;
```

**Purpose**: Merge global and local callbacks.

**Returns**: Object with all 4 callbacks (onRequest, onSuccess, onError, onFinish)

**Execution Order:**

1. Global callback runs first
2. If global returns `false`, local is skipped (except onFinish)
3. Local callback runs second

## Generated Composables

### useFetch Composables

**Pattern**: `useFetch[MethodName]`

**Example:**

```typescript
export const useFetchAddPet = (params: AddPetRequest, options?: ApiRequestOptions<Pet>) => {
  return useApiRequest<Pet>('/pet', {
    method: 'POST',
    body: params.pet,
    ...options,
  });
};
```

**Usage:**

```typescript
const { data, pending, error, refresh } = useFetchAddPet(
  { pet: { name: 'Fluffy', status: 'available' } },
  {
    onSuccess: (pet) => console.log('Pet added:', pet),
    onError: (error) => console.error('Failed:', error),
  }
);
```

### useAsyncData Composables

**Pattern**: `useAsyncData[MethodName]` & `useAsyncData[MethodName]Raw`

**Normal Version:**

```typescript
export const useAsyncDataGetPet = (params: GetPetRequest, options?: ApiAsyncDataOptions<Pet>) => {
  return useApiAsyncData<Pet>('useAsyncDataGetPet', `/pet/${params.petId}`, {
    method: 'GET',
    ...options,
  });
};
```

**Raw Version:**

```typescript
export const useAsyncDataGetPetRaw = (
  params: GetPetRequest,
  options?: ApiAsyncDataRawOptions<Pet>
) => {
  return useApiAsyncDataRaw<Pet>('useAsyncDataGetPetRaw', `/pet/${params.petId}`, {
    method: 'GET',
    ...options,
  });
};
```

**Usage:**

```typescript
// Normal
const { data, pending } = useAsyncDataGetPet({ petId: 123 });
// data.value: Pet

// Raw
const { data: rawData } = useAsyncDataGetPetRaw({ petId: 123 });
// rawData.value: { data: Pet, headers: Headers, status: 200, statusText: 'OK' }
const pet = rawData.value?.data;
const token = rawData.value?.headers.get('X-Auth-Token');
```

---

**Next**: [Development Guide](./DEVELOPMENT.md) | [Troubleshooting](./TROUBLESHOOTING.md)
