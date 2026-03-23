# 🐛 Troubleshooting Guide

> **Purpose**: Solutions for common problems encountered when using or developing the generator.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Generation Errors](#generation-errors)
- [Runtime Errors](#runtime-errors)
- [Type Errors](#type-errors)
- [Callback Issues](#callback-issues)
- [Performance Issues](#performance-issues)
- [OpenAPI Spec Issues](#openapi-spec-issues)

## Installation Issues

### Error: `Cannot find module 'commander'`

**Symptom:**

```
Error: Cannot find module 'commander'
```

**Cause**: Dependencies not installed

**Solution:**

```bash
npm install
```

---

### Error: `Permission denied` (Unix/Mac)

**Symptom:**

```
Error: EACCES: permission denied
```

**Cause**: Need sudo for global install

**Solution:**

```bash
# Use npx instead
nxh generate

# Or fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

---

### Build Fails with TypeScript Errors

**Symptom:**

```
error TS2307: Cannot find module 'ts-morph'
```

**Cause**: Missing or corrupted node_modules

**Solution:**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Generation Errors

### Error: `APIs directory not found`

**Symptom:**

```
Error: APIs directory not found: ./swagger/apis
```

**Cause**: Output directory doesn't contain OpenAPI-generated files

**Solution:**

```bash
# Generate OpenAPI files first
npx @openapitools/openapi-generator-cli generate \
  -i swagger.yaml \
  -g typescript-fetch \
  -o ./swagger

# Then generate composables
node dist/index.js generate -i ./swagger -o ./output
```

**Note**: The tool expects **TWO** directories:

- **Input**: OpenAPI Generator output (e.g., `./swagger`)
- **Output**: Where composables will be written (e.g., `./output`)

---

### Error: `Found 0 methods in API file`

**Symptom:**

```
✓ Parsed PetApi
  Found 0 methods in PetApi
```

**Cause**: Parser can't find `xxxRequestOpts()` methods

**Debug Steps:**

1. **Check Generated API File**:

```bash
cat swagger/apis/PetApi.ts | grep RequestOpts
```

Should see methods like:

```typescript
async addPetRequestOpts(params: AddPetRequest): Promise<RequestOpts> { ... }
```

2. **Verify OpenAPI Generator Version**:

```bash
npx @openapitools/openapi-generator-cli version
```

Recommended: `7.14.0`

3. **Check TypeScript Syntax**:

```bash
# Install ts-morph globally
npm install -g ts-morph

# Parse file
ts-morph parse swagger/apis/PetApi.ts
```

**Solution**: Regenerate with correct OpenAPI Generator version:

```bash
npx @openapitools/openapi-generator-cli generate \
  -i swagger.yaml \
  -g typescript-fetch \
  -o ./swagger \
  --additional-properties=supportsES6=true
```

---

### Error: `Could not parse method X`

**Symptom:**

```
Warning: Could not parse method addPet: Cannot read property 'getText' of undefined
```

**Cause**: Unexpected method signature or return type

**Debug**:

```typescript
// Add to parser.ts temporarily
try {
  const method = extractMethodInfo(methodNode, sourceFile);
  console.log('Extracted method:', JSON.stringify(method, null, 2));
} catch (error) {
  console.error('Error:', error);
  console.error('Method text:', methodNode.getText());
}
```

**Common Causes**:

- No parameters → `requestType` is `undefined`
- No return type → `responseType` extraction fails
- Complex generics → Type text extraction fails

**Solution**: Update parser to handle edge cases:

```typescript
const requestType =
  params.length > 0
    ? params[0]
        .getType()
        .getText()
        .replace(/^import\(.*?\)\./, '')
    : undefined; // Handle no params gracefully
```

---

### Error: `ENOENT: no such file or directory`

**Symptom:**

```
Error: ENOENT: no such file or directory, scandir './swagger/apis'
```

**Cause**: Wrong input directory path

**Solution**:

```bash
# Check directory exists
ls ./swagger/apis

# If not, check OpenAPI output location
ls ./swagger

# Use absolute path
node dist/index.js generate -i $(pwd)/swagger -o ./output
```

---

### Warning: `Could not copy plugin template`

**Symptom:**

```
Warning: Could not copy plugin template: ...
```

**Cause**: Plugins directory doesn't exist or permissions issue

**Impact**: Non-critical - global callbacks won't work but composables will

**Solution**:

```bash
# Create plugins directory manually
mkdir -p plugins

# Copy template manually
cp src/generators/shared/templates/api-callbacks-plugin.ts plugins/api-callbacks.ts
```

## Runtime Errors

### Error: `Cannot find module '../apis/PetApi'`

**Symptom** (in Nuxt project):

```
Error: Cannot find module '../apis/PetApi'
```

**Cause**: Generated imports are incorrect (wrong relative path)

**Debug**:

Check generated file:

```typescript
// In use-fetch-add-pet.ts
import type { Pet, AddPetRequest } from '../apis/PetApi'; // ← Check this path
```

Verify actual location:

```bash
# From composable file location:
ls ../apis/PetApi.ts
```

**Solution**: Fix import path calculation in templates:

```typescript
// In templates.ts
let relativePath = path.relative(composablesDir, apisDir);
relativePath = relativePath.replace(/\\/g, '/'); // Windows compatibility
if (!relativePath.startsWith('.')) {
  relativePath = './' + relativePath;
}
```

---

### Error: `useFetch is not defined` (SSR)

**Symptom**:

```
ReferenceError: useFetch is not defined
```

**Cause**: Runtime wrapper expects Nuxt environment

**Solution**: Ensure files are in Nuxt project's `composables/` directory:

```
my-nuxt-app/
  composables/
    use-fetch/
      use-fetch-add-pet.ts       # Generated composables
      runtime/
        useApiRequest.ts          # Wrapper
    shared/
      runtime/
        apiHelpers.ts             # Helpers
```

Nuxt auto-imports composables from `composables/` directory.

---

### Error: `$fetch is not defined`

**Symptom**:

```
ReferenceError: $fetch is not defined
```

**Cause**: Missing Nuxt app context (useAsyncData composables)

**Solution**: Ensure using composables in proper context:

```vue
<!-- ✅ Good: In component setup -->
<script setup>
const { data } = useAsyncDataGetPet({ petId: 123 });
</script>

<!-- ❌ Bad: Outside component -->
<script>
const { data } = useAsyncDataGetPet({ petId: 123 }); // No Nuxt context
</script>
```

---

### Error: `Cannot watch reactive object`

**Symptom**:

```
Error: Cannot watch reactive object
```

**Cause**: Watching refs incorrectly in wrapper

**Solution**: Use getter function:

```typescript
// ✅ Good
watch(() => result.data.value, (data) => { ... });

// ❌ Bad
watch(result.data, (data) => { ... });
```

## Type Errors

### Error: `Type 'Pet' is not assignable`

**Symptom**:

```
Type 'Pet | null' is not assignable to type 'Pet'
```

**Cause**: Nuxt composables return `Ref<T | null>`, not `Ref<T>`

**Solution**: Handle null case:

```typescript
const { data } = useFetchGetPet({ petId: 123 });

// ✅ Good: Check for null
if (data.value) {
  console.log(data.value.name);
}

// ❌ Bad: Assume non-null
console.log(data.value.name); // Error if null
```

---

### Error: `Cannot find name 'ApiRequestOptions'`

**Symptom**:

```
Cannot find name 'ApiRequestOptions'
```

**Cause**: TypeScript can't find runtime types

**Solution**: Check import path in generated file:

```typescript
// Generated file should have:
import { useApiRequest, type ApiRequestOptions } from '../runtime/useApiRequest';

// Verify file exists:
// ls composables/use-fetch/runtime/useApiRequest.ts
```

**If missing**: Regenerate with correct output structure.

---

### Error: `Property 'pet' does not exist on type`

**Symptom**:

```
Property 'pet' does not exist on type 'AddPetRequest'
```

**Cause**: Parser extracted wrong body field

**Debug**: Check generated composable:

```typescript
// Should be:
body: computed(() => p.value.pet);

// Not:
body: params; // Wrong
```

**Solution**: Check parser's bodyField extraction:

```typescript
// In parser.ts
const bodyProperty = returnObj.getProperty('body');
const bodyText = bodyProperty?.getInitializer()?.getText();

console.log('Body text:', bodyText); // Should be: PetToJSON(params.pet)

// Extract field name (actual parser pattern)
const bodyField = bodyText?.match(/requestParameters(?:\['(\w+)'\]|\.(\w+))/)?.[1];
```

## Callback Issues

### Callback Not Firing

**Symptom**: `onSuccess` defined but never called

**Debug**:

```typescript
useFetchAddPet(
  { pet: { name: 'Fluffy' } },
  {
    onRequest: (ctx) => {
      console.log('onRequest called');
    },
    onSuccess: (data) => {
      console.log('onSuccess called:', data);
    },
    onError: (error) => {
      console.log('onError called:', error);
    },
  }
);
```

**Common Causes**:

1. **Request Failed**: Check `onError` instead
2. **Global Callback Returned false**: Check global plugin
3. **Watch Not Triggering**: Data might be same reference
4. **Async Issue**: Callback execution is async

**Solution**: Check wrapper implementation:

```typescript
// In useApiRequest.ts
watch(
  () => [result.data.value, result.error.value, result.pending.value] as const,
  async ([data, error, pending], [prevData, prevError, prevPending]) => {
    console.log('Watch triggered:', { data, error, pending }); // Add this

    if (data && data !== prevData) {
      console.log('Calling onSuccess'); // Add this
      await mergedCallbacks.onSuccess?.(data);
    }
  },
  { immediate: true }
);
```

---

### Global Callbacks Not Working

**Symptom**: Plugin defined but global callbacks don't execute

**Debug**:

1. **Check Plugin Exists**:

```bash
ls plugins/api-callbacks.ts
```

2. **Check Plugin Registration**:

```typescript
// In plugins/api-callbacks.ts
export default defineNuxtPlugin(() => {
  console.log('Plugin loaded'); // Add this

  return {
    provide: {
      getGlobalApiCallbacks: () => {
        console.log('getGlobalApiCallbacks called'); // Add this
        return {
          /* ... */
        };
      },
    },
  };
});
```

3. **Check Helper Function**:

```typescript
// In apiHelpers.ts
export function getGlobalCallbacks() {
  try {
    const nuxtApp = useNuxtApp();
    console.log('nuxtApp:', nuxtApp); // Add this
    console.log('getGlobalApiCallbacks:', nuxtApp.$getGlobalApiCallbacks); // Add this

    if (nuxtApp.$getGlobalApiCallbacks) {
      return nuxtApp.$getGlobalApiCallbacks();
    }
  } catch (error) {
    console.error('Error getting global callbacks:', error);
  }
  return null;
}
```

**Common Causes**:

- Plugin file not in `plugins/` directory
- Plugin not registered in Nuxt config
- `skipGlobalCallbacks: true` in options
- Pattern doesn't match URL

**Solution**: Verify plugin location and content:

```bash
# Should be here:
ls plugins/api-callbacks.ts

# Check Nuxt detects it:
npm run dev
# Look for: "Registered plugins: ... api-callbacks"
```

---

### `return false` Not Cancelling Local Callback

**Symptom**: Global returns `false` but local still executes

**Cause**: Logic error in `mergeCallbacks()`

**Check**:

```typescript
// In apiHelpers.ts
const merged = {
  onSuccess: (data, ctx) => {
    if (global.onSuccess && shouldApply('onSuccess')) {
      const result = global.onSuccess(data, ctx);
      if (result === false) {
        console.log('Global returned false, skipping local'); // Add this
        return; // ← This should prevent local from running
      }
    }
    if (local.onSuccess) {
      console.log('Running local onSuccess'); // Add this
      local.onSuccess(data, ctx);
    }
  },
};
```

**Solution**: Ensure early return after `result === false`.

## Performance Issues

### Generation is Slow

**Symptom**: Takes >10 seconds to generate composables

**Causes**:

- Large OpenAPI spec (100+ endpoints)
- Prettier formatting each file individually
- Disk I/O bottleneck

**Solutions**:

1. **Batch Prettier Formatting**:

```typescript
// Instead of:
for (const method of methods) {
  const content = generateComposableFile(method);
  const formatted = await prettier.format(content); // Slow: One at a time
  await fs.writeFile(path, formatted);
}

// Do:
const tasks = methods.map(async (method) => {
  const content = generateComposableFile(method);
  const formatted = await prettier.format(content);
  return { path: method.fileName, content: formatted };
});

const results = await Promise.all(tasks); // Fast: Parallel
for (const { path, content } of results) {
  await fs.writeFile(path, content);
}
```

2. **Skip Formatting in Development**:

```bash
node dist/index.js generate -i swagger.yaml -o ./output --skip-formatting
```

3. **Reduce OpenAPI Spec Size**: Split into multiple specs

---

### Runtime is Slow (Request Delays)

**Symptom**: API requests take longer than expected

**Causes**:

- Synchronous callbacks blocking request
- Heavy computation in `onRequest`
- Inefficient `pick` or `transform`

**Solutions**:

1. **Make Callbacks Async**:

```typescript
onRequest: async (ctx) => {
  // ❌ Bad: Blocks request
  const token = expensiveComputationSync();

  // ✅ Good: Non-blocking
  const token = await expensiveComputationAsync();

  return { headers: { Authorization: token } };
};
```

2. **Optimize `pick`**:

```typescript
// ❌ Bad: Pick deeply nested field
pick: ['users.0.profile.avatar.url.thumbnail'];

// ✅ Good: Pick at shallower level
pick: ['users'];
// Then access in component:
const thumbnail = data.value.users[0]?.profile?.avatar?.url?.thumbnail;
```

3. **Debounce Rapid Calls**:

```typescript
import { useDebounceFn } from '@vueuse/core';

const debouncedFetch = useDebounceFn(() => {
  useFetchGetData(params);
}, 300);
```

## OpenAPI Spec Issues

### Generated Types Have `any`

**Symptom**:

```typescript
export interface Pet {
  name: any; // Should be string
}
```

**Cause**: OpenAPI spec missing type definitions

**Solution**: Add types to OpenAPI spec:

```yaml
# ❌ Bad
Pet:
  properties:
    name: {}

# ✅ Good
Pet:
  properties:
    name:
      type: string
```

---

### Missing Request/Response Types

**Symptom**:

```
Cannot find name 'AddPetRequest'
```

**Cause**: OpenAPI spec missing `requestBody` or doesn't use schemas

**Solution**: Define schemas in OpenAPI:

```yaml
paths:
  /pet:
    post:
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
```

---

### Path Parameters Not Replaced

**Symptom**: Generated URL is `/pet/{petId}` instead of `` `/pet/${params.petId}` ``

**Cause**: Parser not detecting path parameters

**Debug**: Check parser output:

```typescript
// Add to parser.ts
console.log('Path params:', method.pathParams);
```

**Solution**: Ensure OpenAPI spec defines path params:

```yaml
paths:
  /pet/{petId}:
    get:
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
```

## Getting Help

### Before Opening an Issue

1. ✅ Check this troubleshooting guide
2. ✅ Read relevant documentation:
   - [Quick Start](./QUICK-START.md)
   - [Architecture](./ARCHITECTURE.md)
   - [API Reference](./API-REFERENCE.md)
3. ✅ Search existing issues on GitHub
4. ✅ Test with example `swagger.yaml` from repository
5. ✅ Try with latest version: `npm install -g nuxt-openapi-hyperfetch@latest`

### What to Include in Bug Reports

````markdown
**Environment:**

- Node version: 18.16.0
- npm version: 9.5.1
- OS: Windows 11
- Nuxt Generator version: 1.5.0

**Steps to Reproduce:**

1. Run: `node dist/index.js generate -i swagger.yaml -o ./output`
2. Check output file: `output/composables/use-fetch/use-fetch-get-pet.ts`
3. See error: ...

**Expected Behavior:**
Should generate valid TypeScript file with correct imports.

**Actual Behavior:**
Error: Cannot find module '../apis/PetApi'

**OpenAPI Spec (simplified):**

```yaml
openapi: 3.0.0
paths:
  /pet:
    get:
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
```
````

**Generated File:**

```typescript
import type { Pet } from '../apis/PetApi'; // ← Wrong path
```

**Additional Context:**
Works fine on Mac, only fails on Windows.

````

### Useful Debug Commands

```bash
# Check versions
node --version
npm --version
npx nuxt-openapi-hyperfetch --version

# Verbose build
npm run build -- --verbose

# Check generated files
ls -R swagger/
ls -R output/composables/

# Validate OpenAPI spec
npx @openapitools/openapi-generator-cli validate -i swagger.yaml

# Check TypeScript compilation
npx tsc --noEmit

# Check linting
npm run lint
````

---

**Need more help?** See [CONTRIBUTING.md](../CONTRIBUTING.md) or open an issue on GitHub.
