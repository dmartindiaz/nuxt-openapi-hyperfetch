# 🏗️ Architecture & Design Decisions

> **Purpose**: Understand WHY the codebase is structured this way and the trade-offs made.

## Table of Contents

- [Architectural Overview](#architectural-overview)
- [Core Patterns](#core-patterns)
- [Design Decisions (ADRs)](#design-decisions-adrs)
- [Component Map](#component-map)
- [Data Flow](#data-flow)
- [Extension Points](#extension-points)

## Architectural Overview

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         CLI Tool                              │
│  (Runs on developer's machine during development)            │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│          OpenAPI Generator (typescript-fetch)                │
│          Generates: PetApi.ts, models/, runtime.ts           │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    Parser (ts-morph)                         │
│     Extracts: method names, params, paths, HTTP details     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│               Template Generator                              │
│        Creates: useFetchAddPet, useAsyncDataGetPet          │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                User's Nuxt Project                            │
│  Runtime: useApiRequest, apiHelpers, global callbacks       │
│  Generated: Individual composables per endpoint              │
└──────────────────────────────────────────────────────────────┘
```

### Two-Runtime Architecture

This project operates in **two separate runtime contexts**:

#### 1. **Build-time Runtime** (CLI Tool)

- Runs during development
- Uses Node.js, TypeScript, ts-morph
- Has access to file system
- Generates code as strings

#### 2. **User Runtime** (Nuxt Project)

- Runs in production (browser + server)
- Uses Vue 3, Nuxt 3 APIs
- No access to our CLI dependencies
- Executes generated composables

**Critical implication**: Runtime files can't be imported from our npm package - they must be **copied** to user's project.

## Core Patterns

### 1. Two-Stage Generation Pattern

**Problem**: OpenAPI specs are verbose XML/YAML. Nuxt needs composables.

**Solution**: Use an existing OpenAPI client generator for Stage 1, then parse and transform its output in Stage 2.

```
OpenAPI Spec → [Stage 1: backend A or B] → TypeScript Client
TypeScript Client → [Stage 2: Our Parser + Templates] → Nuxt Composables
```

**Two supported backends for Stage 1:**

| Backend | Package | Requires | Parser used in Stage 2 |
|---|---|---|---|
| `official` | `@openapitools/openapi-generator-cli` | Java 11+ | `official-parser.ts` (reads `apis/*.ts`) |
| `heyapi` | `@hey-api/openapi-ts` | Node.js only | `heyapi-parser.ts` (reads `sdk.gen.ts` + `types.gen.ts`) |

Both parsers (`src/generators/shared/parsers/`) produce identical `MethodInfo[]` output, so all downstream templates are shared and backend-agnostic.

**Benefits**:

- ✅ Leverage mature OpenAPI ecosystem
- ✅ Don't reinvent OpenAPI parsing
- ✅ No Java required when using heyapi backend
- ✅ Templates work identically regardless of backend

**Trade-offs**:

- ⚠️ official backend depends on openapi-generator-cli staying stable
- ⚠️ Must parse TypeScript (additional complexity)
- ⚠️ Two-step process (slower than direct)

### 2. Wrapper Pattern

**Problem**: Want to add features (callbacks, auth) without modifying generated code.

**Solution**: Wrap native Nuxt composables with our enhanced version.

```typescript
// Generated composable (auto-regenerated)
export const useFetchAddPet = (
  params: MaybeRef<AddPetRequest>,
  options?: ApiRequestOptions<Pet>
) => {
  const p = isRef(params) ? params : shallowRef(params);
  return useApiRequest<Pet>(() => `/pet`, {
    method: 'POST',
    body: computed(() => p.value.pet),
    ...options,
  });
};

// Our wrapper (user-modifiable)
export function useApiRequest<T>(url: string | (() => string), options?: ApiRequestOptions<T>) {
  const result = useFetch<T>(url, options);
  // Add: callbacks, auth, transforms, etc.
  return result;
}
```

**Benefits**:

- ✅ Generated code stays simple
- ✅ Features in one place (DRY)
- ✅ Easy to extend without regeneration
- ✅ Users can customize wrappers

**Trade-offs**:

- ⚠️ Extra function call (negligible overhead)
- ⚠️ Wrapper logic applies to all endpoints

### 3. Shared Code Architecture

**Problem**: Multiple generators (useFetch, useAsyncData, nuxt-server) duplicate logic.

**Solution**: Extract common code to `shared/` folder.

```
generators/
  shared/
    types.ts           # MethodInfo interface (all generators use)
    runtime/
      apiHelpers.ts    # Callbacks, auth, transforms (all wrappers use)
  use-fetch/
    parser.ts          # Re-exported from shared
    templates.ts       # Specific to useFetch
  use-async-data/
    parser.ts          # Re-exported from shared
    templates.ts       # Specific to useAsyncData
```

**Benefits**:

- ✅ Single source of truth
- ✅ Bug fixes apply everywhere
- ✅ Easier to add new generators

**Trade-offs**:

- ⚠️ Changes affect all generators
- ⚠️ Must maintain backward compatibility

### 4. Template-Based Code Generation

**Problem**: Generating code programmatically is error-prone with string concatenation.

**Solution**: Use template functions that interpolate variables.

```typescript
function generateFunctionBody(method: MethodInfo): string {
  return `export const ${method.composableName} = (
    params: MaybeRef<${method.requestType}>,
    options?: ApiRequestOptions<${method.responseType}>
  ) => {
    const p = isRef(params) ? params : shallowRef(params)
    return useApiRequest<${method.responseType}>(
      () => \`${method.path}\`,
      { method: '${method.method}', body: computed(() => p.value.${method.bodyField}), ...options }
    )
  }`;
}
```

**Benefits**:

- ✅ Easier to read/maintain
- ✅ Clear what's generated
- ✅ Can format with Prettier

**Trade-offs**:

- ⚠️ Escaping can be tricky
- ⚠️ Template strings can get long

### 5. Copy vs Import Pattern (Runtime Files)

**Problem**: How do users get runtime code (wrappers, helpers)?

**Option A**: Import from our npm package
**Option B**: Copy files to user's project

**Decision**: **Copy files** (Option B)

**Rationale**:

- ✅ Zero runtime dependencies
- ✅ Users can customize wrappers
- ✅ Works with any Nuxt setup
- ✅ No version conflicts
- ✅ Framework agnostic

**Trade-offs**:

- ⚠️ File duplication
- ⚠️ Updates require regeneration
- ⚠️ User modifications can break things

**Implementation**: Use `fs.copy()` to copy `runtime/` files to output.

### 6. Global Callbacks System

**Problem**: Repeating same callbacks (auth, error handling) on every API call.

**Solution**: Plugin-based global callbacks with 3 control options.

```typescript
// Define once in plugin
export default defineNuxtPlugin(() => ({
  provide: {
    getGlobalApiCallbacks: () => ({
      onRequest: (ctx) => {
        /* Add auth header to all requests */
      },
      onError: (error) => {
        /* Handle 401/500 errors globally */
      },
    }),
  },
}));

// Control per-call
useFetchGetPet({ petId: 123 }, {
  skipGlobalCallbacks: true, // Option 1: Disable
});

// Or in global callback
onError: (error) => {
  if (error.status >= 500) return false; // Option 2: Cancel local
};

// Or with patterns
{
  patterns: ['/api/auth/**'], // Option 3: URL matching
}
```

See [Global Callbacks Deep Dive](#global-callbacks-deep-dive) below.

## Design Decisions (ADRs)

### ADR-001: Use ts-morph Instead of Regex

**Context**: Need to parse generated TypeScript to extract API info.

**Decision**: Use ts-morph library for TypeScript AST parsing.

**Alternatives Considered**:

- ❌ Regex: Too fragile, can't handle complex syntax
- ❌ Babel: Wrong target (designed for JS, not TS)
- ❌ TypeScript Compiler API: Too low-level

**Rationale**:

- ✅ Type-aware parsing
- ✅ Handles complex TypeScript syntax
- ✅ Provides semantic information
- ✅ Less brittle than regex
- ✅ Good documentation

**Trade-offs**:

- ⚠️ Dependency on ts-morph (large library)
- ⚠️ AST navigation can be complex

**Status**: ✅ Accepted (v1.0)

**Date**: Initial design

---

### ADR-002: Copy Runtime Files Instead of NPM Package

**Context**: Users need runtime code (wrappers, helpers) in their Nuxt project.

**Decision**: Copy runtime files to user's project instead of npm import.

**Alternatives Considered**:

- ❌ Import from npm: `import { useApiRequest } from 'nuxt-generator/runtime'`
- ❌ Virtual modules: Nuxt module that provides runtime

**Rationale**:

- ✅ **Zero dependencies**: User doesn't need to install our package in production
- ✅ **Customizable**: Users can modify wrappers for their needs
- ✅ **Framework agnostic**: Works with any Nuxt setup
- ✅ **No version conflicts**: Each project has its own copy
- ✅ **Explicit**: Users see exactly what code runs

**Trade-offs**:

- ⚠️ File duplication across projects
- ⚠️ Updates require regeneration
- ⚠️ Users might break things with modifications

**Status**: ✅ Accepted (v1.0)

**Date**: Initial design

---

### ADR-003: @ts-nocheck in Runtime Files

**Context**: Runtime files are copied to user's Nuxt project with different TypeScript config.

**Decision**: Add `// @ts-nocheck` to all runtime files.

**Rationale**:

- ✅ Files run in user's project with different `tsconfig.json`
- ✅ May use different TS version
- ✅ Different strict mode settings
- ✅ CLI doesn't need to compile them

**Trade-offs**:

- ⚠️ No type checking in our development
- ⚠️ Potential bugs hidden

**Status**: ✅ Accepted (v1.2)

**Date**: After user reports of TS errors

---

### ADR-004: Dual Composables for useAsyncData (Normal + Raw)

**Context**: Some users need response headers/status, others just need data.

**Decision**: Generate both normal and raw versions when possible.

```typescript
// Normal: Simple data access
const { data } = useAsyncDataGetPet({ petId: 123 });
// data: Ref<Pet>

// Raw: With headers/status
const { data } = useAsyncDataGetPetRaw({ petId: 123 });
// data: Ref<{ data: Pet, headers: Headers, status: number }>
```

**Rationale**:

- ✅ Covers both use cases
- ✅ Clean API for simple cases
- ✅ Power when needed (auth, rate limiting, caching)

**Trade-offs**:

- ⚠️ 2x composables generated (double the code)
- ⚠️ Users might be confused which to use

**Status**: ✅ Accepted (v1.3)

**Date**: When Raw support added

---

### ADR-005: Plugin Template Never Regenerated

**Context**: Global callbacks plugin needs user customization.

**Decision**: Copy plugin template once, never overwrite.

**Implementation**:

```typescript
if (await fs.pathExists(pluginPath)) {
  return; // Already exists, don't overwrite
}
await fs.copy(templatePath, pluginPath);
```

**Rationale**:

- ✅ Preserves user customizations
- ✅ Clear ownership (user's file)
- ✅ Safe regeneration

**Trade-offs**:

- ⚠️ Updates to template don't apply automatically
- ⚠️ Users might not know it exists

**Status**: ✅ Accepted (v1.4)

**Date**: Global callbacks feature

---

### ADR-006: ESLint Flat Config for Modern Standards

**Context**: Need linting for maintainability and PR contributions.

**Decision**: Use ESLint v9+ flat config format.

**Rationale**:

- ✅ Future-proof (ESLint's new standard)
- ✅ Better TypeScript integration
- ✅ Simpler configuration

**Trade-offs**:

- ⚠️ Requires ESLint 9+ (breaking for some users)

**Status**: ✅ Accepted (v1.5)

**Date**: 2026-03-21

## Component Map

### Dependency Graph

```
┌──────────────────────────────────────────────────────────────┐
│                      CLI Entry (index.ts)                     │
│                  Commands: generate, ...                      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ├─► generate.ts (OpenAPI Generator wrapper)
                         │
                         └─► generators/
                              │
                              ├─► shared/
                              │    ├─ types.ts (MethodInfo, ApiClassInfo)
                              │    ├─ runtime/apiHelpers.ts (copied to output)
                              │    └─ templates/api-callbacks-plugin.ts (copied once)
                              │
                              ├─► use-fetch/
                              │    ├─ parser.ts → shared/types.ts
                              │    ├─ templates.ts → parser.ts
                              │    ├─ generator.ts → parser.ts + templates.ts
                              │    └─ runtime/useApiRequest.ts → shared/runtime/
                              │
                              ├─► use-async-data/
                              │    ├─ parser.ts (re-exports from use-fetch)
                              │    ├─ templates.ts → parser.ts
                              │    ├─ generator.ts → parser.ts + templates.ts
                              │    └─ runtime/
                              │         ├─ useApiAsyncData.ts → shared/runtime/
                              │         └─ useApiAsyncDataRaw.ts → shared/runtime/
                              │
                              └─► nuxt-server/
                                   ├─ parser.ts (re-exports from use-fetch)
                                   ├─ templates.ts
                                   ├─ bff-templates.ts (auth + transformers)
                                   └─ generator.ts → templates + bff-templates
```

### Information Flow

```
swagger.yaml
    │
    ▼
[OpenAPI Generator]
    │
    ├─► apis/PetApi.ts
    ├─► models/Pet.ts
    └─► runtime.ts
         │
         ▼
    [Parser]
         │
         ├─► MethodInfo {
         │     name: 'addPet',
         │     path: '/pet',
         │     method: 'POST',
         │     requestType: 'AddPetRequest',
         │     responseType: 'Pet',
         │     ...
         │   }
         │
         ▼
   [Template Generator]
         │
         ├─► useFetchAddPet.ts
         ├─► useFetchUpdatePet.ts
         ├─► ...
         │
         ▼
   [User's Nuxt Project]
         │
         ├─► composables/use-fetch/ (composables)
         ├─► composables/shared/runtime/ (helpers)
         └─► plugins/api-callbacks.ts (global config)
```

## Global Callbacks Deep Dive

### Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    User's Nuxt Project                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  plugins/api-callbacks.ts (NEVER regenerated)                  │
│  ┌──────────────────────────────────────────────────┐         │
│  │ defineNuxtPlugin(() => ({                        │         │
│  │   provide: {                                      │         │
│  │     getGlobalApiCallbacks: () => ({             │         │
│  │       patterns: ['/api/auth/**'],                │         │
│  │       onRequest: (ctx) => { ... },               │         │
│  │       onSuccess: (data) => { ... },              │         │
│  │       onError: (error) => { ... }                │         │
│  │     })                                            │         │
│  │   }                                               │         │
│  │ }))                                               │         │
│  └──────────────────────────────────────────────────┘         │
│                              ↓ provide                          │
│  ┌──────────────────────────────────────────────────┐         │
│  │       nuxtApp.$getGlobalApiCallbacks()           │         │
│  └──────────────────────────────────────────────────┘         │
│                              ↓ called by                       │
│  ┌──────────────────────────────────────────────────┐         │
│  │  composables/shared/runtime/apiHelpers.ts        │         │
│  │  - getGlobalCallbacks()                          │         │
│  │  - shouldApplyGlobalCallback()                   │         │
│  │  - mergeCallbacks()                              │         │
│  └──────────────────────────────────────────────────┘         │
│                              ↓ used by                         │
│  ┌──────────────────────────────────────────────────┐         │
│  │  composables/use-fetch/runtime/useApiRequest.ts  │         │
│  │  - Calls mergeCallbacks()                        │         │
│  │  - Executes merged callbacks in watch()          │         │
│  └──────────────────────────────────────────────────┘         │
│                              ↓ called by                       │
│  ┌──────────────────────────────────────────────────┐         │
│  │  composables/use-fetch/useFetchAddPet.ts         │         │
│  │  (Generated - CAN be regenerated safely)         │         │
│  └──────────────────────────────────────────────────┘         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Execution Flow

```
User calls: useFetchGetPet({ petId: 123 }, { onSuccess: localCallback })
    │
    ▼
useApiRequest(url, options)
    │
    ├─► Extract: skipGlobalCallbacks from options
    │
    ├─► Call: mergeCallbacks(url, localCallbacks, skipGlobalCallbacks)
    │    │
    │    ├─► getGlobalCallbacks() → reads nuxtApp.$getGlobalApiCallbacks()
    │    │
    │    ├─► For each callback type (onRequest, onSuccess, onError, onFinish):
    │    │    │
    │    │    ├─► shouldApplyGlobalCallback(name, skipConfig, url, patterns)
    │    │    │    │
    │    │    │    ├─► Check skipConfig: true / array?
    │    │    │    ├─► Match URL against patterns
    │    │    │    └─► Return: boolean
    │    │    │
    │    │    └─► Create merged function:
    │    │         (args) => {
    │    │           if (global && shouldApply) {
    │    │             result = global(args);
    │    │             if (result === false) return; // Cancel local
    │    │           }
    │    │           if (local) local(args);
    │    │         }
    │    │
    │    └─► Return: { onRequest, onSuccess, onError, onFinish }
    │
    ├─► useFetch(url, options)
    │
    └─► watch(data/error/pending) → Execute merged callbacks
```

## Extension Points

### Want to add a new callback?

**Files to modify**:

1. `src/generators/shared/runtime/apiHelpers.ts`
   - Add to `GlobalCallbacksConfig` interface
   - Update `mergeCallbacks()` function
2. `src/generators/use-fetch/runtime/useApiRequest.ts`
   - Add callback execution in `watch()`
3. `src/generators/use-async-data/runtime/useApiAsyncData.ts`
   - Add callback execution in try/catch/finally
4. `src/generators/shared/templates/api-callbacks-plugin.ts`
   - Add examples and documentation
5. `docs/API-REFERENCE.md`
   - Document the new callback

### Want to add a new generator?

**Steps**:

1. Copy `src/generators/use-fetch/` → `src/generators/your-generator/`
2. Modify `templates.ts` for your output format
3. Create/modify `runtime/` wrapper for your needs
4. Update `src/index.ts` to add CLI choice
5. Test: `npm run build && node dist/index.js generate`

### Want to add parser feature?

**Steps**:

1. Edit `src/generators/shared/types.ts` - Add field to `MethodInfo`
2. Edit `src/generators/use-fetch/parser.ts` - Extract from AST
3. Edit `src/generators/*/templates.ts` - Use in generation
4. Test with complex OpenAPI spec

---

**Next**: [API Reference](./API-REFERENCE.md) | [Development Guide](./DEVELOPMENT.md)
