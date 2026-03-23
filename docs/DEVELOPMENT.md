# 🔧 Development Guide - Contributing & Extending

> **Purpose**: Practical guide for developers who want to contribute, extend, or customize the generator.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Adding Features](#adding-features)
- [Testing Changes](#testing-changes)
- [Code Style](#code-style)
- [Common Tasks](#common-tasks)
- [Extension Points](#extension-points)
- [Debugging Guide](#debugging-guide)

## Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **TypeScript**: Basic knowledge
- **Git**: For version control

### Initial Setup

```bash
# Clone repository
git clone https://github.com/dmartindiaz/nuxt-openapi-hyperfetch.git
cd nuxt-openapi-hyperfetch

# Install dependencies
npm install

# Build project
npm run build

# Test generation
npm run generator

# Or with parameters
echo "useFetch" | npm run generator
```

### Project Scripts

| Command                | Purpose                                |
| ---------------------- | -------------------------------------- |
| `npm run build`        | Compile TypeScript to JavaScript       |
| `npm run generator`    | Test generation with example swagger   |
| `npm run lint`         | Run ESLint checks                      |
| `npm run lint:fix`     | Auto-fix ESLint issues                 |
| `npm run format`       | Format with Prettier                   |
| `npm run format:check` | Check formatting                       |
| `npm run type-check`   | TypeScript type checking               |
| `npm run validate`     | Run all checks (lint + format + types) |

### Development Tools

- **VS Code**: Recommended IDE with extensions:
  - ESLint
  - Prettier
  - TypeScript
  - EditorConfig

- **Terminal**: PowerShell (Windows) or Bash (Unix)

## Development Workflow

### 1. Make Changes

Edit files in `src/` directory:

```
src/
  index.ts                    # CLI entry point
  generate.ts                 # OpenAPI wrapper
  generators/
    shared/                   # Common code
    use-fetch/                # useFetch generator
    use-async-data/           # useAsyncData generator
    nuxt-server/              # Server routes generator
```

### 2. Build

```bash
npm run build
```

**Output**: `dist/` directory with compiled JavaScript

### 3. Test Locally

```bash
# Interactive mode
node dist/index.js generate

# With arguments
node dist/index.js generate -i swagger.yaml -o ./test-output

# Piped input for composable type
echo "useFetch" | node dist/index.js generate -i swagger.yaml -o ./test-output
```

### 4. Validate Code Quality

```bash
# Run all checks
npm run validate

# Or individually
npm run lint
npm run format:check
npm run type-check
```

### 5. Commit

```bash
git add .
git commit -m "feat: add support for X"
git push
```

**Commit Convention**: Use [Conventional Commits](https://www.conventionalcommits.org/)

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Build/tooling changes

## Adding Features

### Add a New Callback Type

**Example**: Add `onRetry` callback

**1. Update Interfaces** (`src/generators/shared/runtime/apiHelpers.ts`)

```typescript
export interface ApiRequestOptions<T> {
  // ... existing
  onRetry?: (attempt: number, error: any) => void | false;
}

export interface GlobalCallbacksConfig {
  // ... existing
  onRetry?: (attempt: number, error: any) => void | false;
}
```

**2. Update mergeCallbacks()** (`src/generators/shared/runtime/apiHelpers.ts`)

```typescript
export function mergeCallbacks(/* ... */) {
  // ... existing

  const merged: any = {
    // ... existing callbacks

    onRetry: (attempt: number, error: any) => {
      if (global.onRetry && shouldApplyGlobalCallback('onRetry', skipConfig, url, patterns)) {
        const result = global.onRetry(attempt, error);
        if (result === false) return; // Cancel local
      }
      if (local.onRetry) {
        local.onRetry(attempt, error);
      }
    },
  };

  return merged;
}
```

**3. Update Runtime Wrappers**

`src/generators/use-fetch/runtime/useApiRequest.ts`:

```typescript
export function useApiRequest<T>(url: string, options?: ApiRequestOptions<T>) {
  // ... existing code

  // Add retry logic
  const executeWithRetry = async (fn: () => Promise<T>, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (mergedCallbacks.onRetry) {
          mergedCallbacks.onRetry(attempt, error);
        }

        if (attempt === maxRetries) throw error;
      }
    }
  };

  // ... use executeWithRetry
}
```

**4. Update Plugin Template** (`src/generators/shared/templates/api-callbacks-plugin.ts`)

Add documentation and examples:

```typescript
/**
 * onRetry: Called when a request fails and will be retried
 * Parameters: (attempt: number, error: any)
 * Return: void | false (return false to cancel local onRetry)
 *
 * @example
 * onRetry: (attempt, error) => {
 *   console.log(`Retry attempt ${attempt}`);
 *   if (error.status === 429) {
 *     // Wait before retry
 *     return new Promise(resolve => setTimeout(resolve, 1000));
 *   }
 * }
 */
```

**5. Update Documentation** (`docs/API-REFERENCE.md`)

Add to callback interfaces section and usage examples.

**6. Test**

```bash
npm run build
node dist/index.js generate -i swagger.yaml -o ./test-output
```

Verify callback is called correctly.

### Add a New Generator Type

**Example**: Add TanStack Query generator

**1. Create Generator Directory**

```bash
mkdir src/generators/tanstack-query
cd src/generators/tanstack-query
```

**2. Create Files**

```
tanstack-query/
  types.ts          # Re-export from shared/types.ts
  parser.ts         # Re-export from use-fetch/parser.ts
  templates.ts      # Generate TanStack Query code
  generator.ts      # Main orchestration
  runtime/
    useApiQuery.ts  # TanStack Query wrapper
```

**3. Implement Parser** (`parser.ts`)

```typescript
// Re-export shared parser
export * from '../shared/types';
export { parseApiFile, getApiFiles } from '../use-fetch/parser';
```

**4. Implement Templates** (`templates.ts`)

```typescript
import type { MethodInfo } from './types';

export function generateFileHeader(): string {
  return `// @ts-nocheck - TanStack Query composable\n`;
}

export function generateImports(method: MethodInfo, apiImportPath: string): string {
  return `import { useQuery } from '@tanstack/vue-query';
import type { ${method.requestType}, ${method.responseType} } from '${apiImportPath}';
`;
}

export function generateFunctionBody(method: MethodInfo): string {
  const url =
    method.pathParams.length === 0
      ? `'${method.path}'`
      : `\`${method.path.replace(/{(\w+)}/g, '${params.$1}')}\``;

  return `export const useQuery${method.name} = (params: ${method.requestType}) => {
  return useQuery({
    queryKey: ['${method.name}', params],
    queryFn: async () => {
      const response = await $fetch<${method.responseType}>(${url}, {
        method: '${method.method}',
        ${method.bodyField ? `body: params.${method.bodyField},` : ''}
      });
      return response;
    },
  });
};`;
}

export function generateComposableFile(method: MethodInfo, apiImportPath: string): string {
  const header = generateFileHeader();
  const imports = generateImports(method, apiImportPath);
  const body = generateFunctionBody(method);

  return `${header}${imports}\n${body}\n`;
}
```

**5. Implement Generator** (`generator.ts`)

```typescript
import * as fs from 'fs-extra';
import * as path from 'path';
import * as p from '@clack/prompts';
import prettier from 'prettier';
import { parseApiFile, scanApiFiles, type MethodInfo } from './parser';
import { generateComposableFile } from './templates';

export async function generateTanstackQueryComposables(
  inputDir: string,
  outputDir: string
): Promise<void> {
  p.log.step('📦 Starting TanStack Query composables generation...');

  // 1. Scan and parse
  const apiFiles = getApiFiles(inputDir);

  const allMethods: MethodInfo[] = [];
  for (const apiFile of apiFiles) {
    const apiClass = parseApiFile(apiFile);
    allMethods.push(...apiClass.methods);
  }

  // 2. Create directories
  const composablesDir = path.join(outputDir, 'composables', 'tanstack-query');
  await fs.ensureDir(composablesDir);

  // 3. Generate files
  for (const method of allMethods) {
    const content = generateComposableFile(method, '../apis');
    const formatted = await prettier.format(content, { parser: 'typescript' });
    await fs.writeFile(path.join(composablesDir, method.fileName), formatted);
    p.log.success(`  ✓ useQuery${method.name}`);
  }

  p.log.success(`✅ Generated ${allMethods.length} TanStack Query composables`);
}
```

**6. Register in CLI** (`src/index.ts`)

```typescript
const composableChoice = await p.multiselect({
  message: 'Select composables to generate:',
  options: [
    { value: 'useFetch', label: 'useFetch (Nuxt 3 useFetch)' },
    { value: 'useAsyncData', label: 'useAsyncData (Nuxt 3 useAsyncData)' },
    { value: 'tanstack-query', label: '@tanstack/vue-query (TanStack Query)' }, // NEW
    { value: 'nuxt-server', label: 'nuxt-server (Nuxt Server Routes)' },
  ],
});

// ... later
if (selectedComposables.includes('tanstack-query')) {
  const { generateTanstackQueryComposables } =
    await import('./generators/tanstack-query/generator');
  await generateTanstackQueryComposables(input, output);
}
```

**7. Test**

```bash
npm run build
node dist/index.js generate -i swagger.yaml -o ./test-output
# Select TanStack Query option
```

### Add Parser Feature

**Example**: Extract response headers from OpenAPI

**1. Update MethodInfo** (`src/generators/shared/types.ts`)

```typescript
export interface MethodInfo {
  // ... existing
  responseHeaders?: string[]; // NEW: Expected response headers
}
```

**2. Update Parser** (`src/generators/use-fetch/parser.ts`)

```typescript
export function extractMethodInfo(
  method: MethodDeclaration,
  sourceFile: SourceFile
): MethodInfo | null {
  // ... existing extraction logic

  // Extract response headers from JSDoc or OpenAPI comments
  const jsdocTags = method.getJsDocs();
  const responseHeaders: string[] = [];

  for (const jsdoc of jsdocTags) {
    const tags = jsdoc.getTags();
    for (const tag of tags) {
      if (tag.getTagName() === 'responseHeader') {
        const headerName = tag.getCommentText();
        if (headerName) responseHeaders.push(headerName);
      }
    }
  }

  return {
    // ... existing fields
    responseHeaders: responseHeaders.length > 0 ? responseHeaders : undefined,
  };
}
```

**3. Use in Templates** (`src/generators/use-fetch/templates.ts`)

```typescript
export function generateFunctionBody(method: MethodInfo): string {
  const headerChecks = method.responseHeaders
    ? method.responseHeaders.map((h) => `  console.log('${h}:', headers.get('${h}'));`).join('\n')
    : '';

  return `export const ${method.composableName} = (...) => {
  const result = useApiRequest(...);

  ${
    headerChecks
      ? `watch(result.data, (data) => {
    if (data) {
      ${headerChecks}
    }
  });`
      : ''
  }

  return result;
};`;
}
```

**4. Test**

```bash
npm run build
node dist/index.js generate -i swagger.yaml -o ./test-output
# Check generated composables for header logging
```

## Testing Changes

### Manual Testing

**1. Build**

```bash
npm run build
```

**2. Generate with Test Swagger**

```bash
# Use included swagger.yaml
node dist/index.js generate -i swagger.yaml -o ./test-output
```

**3. Check Output**

```bash
# List generated files
ls test-output/composables/use-fetch/

# Read a generated file
cat test-output/composables/use-fetch/use-fetch-add-pet.ts
```

**4. Test in Nuxt Project**

```bash
# Copy to a Nuxt project
cp -r test-output/composables ~/my-nuxt-app/composables/

# In Nuxt project
cd ~/my-nuxt-app
npm run dev

# Try using composable in a page
# pages/test.vue
<script setup>
const { data } = useFetchAddPet({ pet: { name: 'Fluffy' } });
</script>
```

### Testing Checklist

- [ ] `npm run build` succeeds
- [ ] `npm run validate` passes
- [ ] Generation completes without errors
- [ ] All expected files are created
- [ ] Generated code has correct imports
- [ ] Generated code compiles in TypeScript
- [ ] Composables work in Nuxt project
- [ ] Callbacks fire correctly
- [ ] Types are correct
- [ ] Edge cases handled (no params, path params, etc.)

### Debugging Tips

See [Debugging Guide](#debugging-guide) section below.

## Code Style

### TypeScript Style

```typescript
// ✅ Good: Explicit types
export interface MethodInfo {
  name: string;
  path: string;
}

// ❌ Bad: Implicit any
export interface MethodInfo {
  name;
  path;
}

// ✅ Good: Readonly where possible
export interface MethodInfo {
  readonly name: string;
}

// ✅ Good: Defensive null checks
if (params.length > 0) {
  const type = params[0].getType();
}

// ❌ Bad: Assuming existence
const type = params[0].getType(); // Might crash if empty
```

### Naming Conventions

```typescript
// Interfaces: PascalCase
interface ApiRequestOptions {}

// Functions: camelCase
function generateComposableFile() {}

// Constants: UPPER_SNAKE_CASE
const BASE_PATH = '/api';

// Files: kebab-case
// use-api-request.ts (not useApiRequest.ts)
```

### Error Handling

```typescript
// ✅ Good: Try-catch with specific error
try {
  const method = extractMethodInfo(node);
  if (method) methods.push(method);
} catch (error) {
  console.warn(`Warning: Could not parse ${node.getName()}: ${error}`);
  // Continue processing
}

// ❌ Bad: Silent failure
try {
  const method = extractMethodInfo(node);
  methods.push(method);
} catch {}

// ✅ Good: Helpful error messages
throw new Error(`APIs directory not found: ${apisDir}

Make sure you've generated OpenAPI files first:
  nxh generate -i swagger.yaml -o ./output
`);

// ❌ Bad: Vague error
throw new Error('Directory not found');
```

### Comments

```typescript
// ✅ Good: JSDoc for public APIs
/**
 * Generate Nuxt composables from OpenAPI specification
 * @param inputDir Directory containing generated TypeScript files
 * @param outputDir Output directory for composables
 * @returns Promise that resolves when generation completes
 */
export async function generate(inputDir: string, outputDir: string): Promise<void> {}

// ✅ Good: Inline for complex logic
// Extract path from return statement: return { path: '/pet' }
const pathProperty = returnObj.getProperty('path');

// ❌ Bad: Stating the obvious
// Increment counter
counter++;
```

## Common Tasks

### Task: Add Support for a New HTTP Method

**Example**: Add PATCH method support

**1. Verify Parser Handles It**

Check `src/generators/use-fetch/parser.ts`:

```typescript
// HTTP method is extracted from returnObj.method property
// Should automatically work if OpenAPI Generator includes it
```

**2. Update Type** (if restricted)

```typescript
// In types.ts, the http method field is httpMethod: string
// PATCH is already supported — no type change needed
```

**3. Test**

```bash
# Create OpenAPI with PATCH endpoint
# Generate and verify
npm run build
node dist/index.js generate -i swagger-with-patch.yaml -o ./test
```

### Task: Change Generated File Names

**Example**: Use PascalCase instead of kebab-case

**1. Update Converter** (`src/generators/use-fetch/parser.ts`)

```typescript
import { pascalCase } from 'change-case';

export function extractMethodInfo(/* ... */): MethodInfo {
  // ... existing

  return {
    // ... existing
    fileName: `${pascalCase(methodName)}.ts`, // NEW: PascalCase
  };
}
```

**2. Test**

```bash
npm run build
node dist/index.js generate -i swagger.yaml -o ./test
ls test/composables/use-fetch/
# Should see: UseFetchAddPet.ts instead of use-fetch-add-pet.ts
```

### Task: Add CLI Flag

**Example**: Add `--skip-formatting` flag

**1. Update CLI** (`src/index.ts`)

```typescript
program
  .command('generate')
  .option('-i, --input <file>', 'OpenAPI file')
  .option('-o, --output <dir>', 'Output directory')
  .option('--skip-formatting', 'Skip Prettier formatting') // NEW
  .action(async (options) => {
    // Pass to generators
    await generateUseFetchComposables(input, output, {
      skipFormatting: options.skipFormatting,
    });
  });
```

**2. Update Generator** (`src/generators/use-fetch/generator.ts`)

```typescript
export async function generateUseFetchComposables(
  inputDir: string,
  outputDir: string,
  options?: { skipFormatting?: boolean }
): Promise<void> {
  // ... generate content

  const finalContent = options?.skipFormatting
    ? content
    : await prettier.format(content, { parser: 'typescript' });

  await fs.writeFile(filePath, finalContent);
}
```

**3. Test**

```bash
npm run build
node dist/index.js generate -i swagger.yaml -o ./test --skip-formatting
```

## Extension Points

### 1. Custom Runtime Wrappers

**Location**: `src/generators/*/runtime/`

**Purpose**: Modify behavior of generated composables

**Example**: Add automatic retry

```typescript
// src/generators/use-fetch/runtime/useApiRequest.ts
export function useApiRequest<T>(url: string, options?: ApiRequestOptions<T>) {
  const maxRetries = options?.maxRetries ?? 3;
  let attempt = 0;

  const fetchWithRetry = async () => {
    try {
      return await useFetch<T>(url, options);
    } catch (error) {
      if (attempt < maxRetries) {
        attempt++;
        return fetchWithRetry();
      }
      throw error;
    }
  };

  return fetchWithRetry();
}
```

### 2. Custom Template Functions

**Location**: `src/generators/*/templates.ts`

**Purpose**: Change generated code format

**Example**: Add banner comment

```typescript
export function generateFileHeader(): string {
  return `/**
 * AUTO-GENERATED - DO NOT EDIT
 * Generated by Nuxt Generator
 * Timestamp: ${new Date().toISOString()}
 */
// @ts-nocheck
`;
}
```

### 3. Custom Parser Logic

**Location**: `src/generators/*/parser.ts`

**Purpose**: Extract additional metadata

**Example**: Extract JSDoc descriptions

```typescript
export function extractMethodInfo(method: MethodDeclaration): MethodInfo {
  // ...existing

  const jsDocs = method.getJsDocs();
  const description = jsDocs[0]?.getDescription() ?? '';

  return {
    // ...existing
    description,
  };
}
```

## Debugging Guide

### Common Issues

#### Build Fails

**Symptom**: `npm run build` errors

**Solution**:

```bash
# Clean and rebuild
rm -rf dist/
npm run build

# Check TypeScript errors
npm run type-check
```

#### Parser Not Finding Methods

**Symptom**: "Found 0 methods"

**Debug**:

```typescript
// Add logging in parser.ts
export function parseApiFile(filePath: string): ApiClassInfo {
  console.log('Parsing file:', filePath);

  const classes = sourceFile.getClasses();
  console.log(
    'Found classes:',
    classes.map((c) => c.getName())
  );

  for (const cls of classes) {
    const methods = cls.getMethods();
    console.log(
      `Methods in ${cls.getName()}:`,
      methods.map((m) => m.getName())
    );
  }

  // Continue...
}
```

#### Generated Code Has Type Errors

**Symptom**: TypeScript errors in generated files

**Debug**:

1. Check import paths (relative vs absolute)
2. Verify type exports from OpenAPI Generator
3. Check `responseType` and `requestType` extraction

```typescript
// Add logging in parser
console.log('Response type:', responseType);
console.log('Request type:', requestType);
```

#### Callbacks Not Firing

**Symptom**: `onSuccess` never called

**Debug**:

```typescript
// In useApiRequest.ts
watch(
  () => [result.data.value, result.error.value, result.pending.value] as const,
  ([data, error, pending], [prevData, prevError, prevPending]) => {
    console.log('Watch triggered:', { data, error, pending });

    if (data && data !== prevData) {
      console.log('Calling onSuccess');
      mergedCallbacks.onSuccess?.(data);
    }
  },
  { immediate: true }
);
```

### DevTools

**ts-morph Explorer**:

```typescript
// Explore AST structure
import { Project } from 'ts-morph';

const project = new Project();
const sourceFile = project.addSourceFileAtPath('PetApi.ts');

// Print entire AST
console.log(sourceFile.getFullText());

// Print structure
sourceFile.getDescendants().forEach((node) => {
  console.log(node.getKindName(), node.getText().substring(0, 50));
});
```

**Prettier Test**:

```typescript
// Test formatting
import prettier from 'prettier';

const code = `export const test=()=>{return"hello"}`;
const formatted = await prettier.format(code, { parser: 'typescript' });
console.log(formatted);
```

---

**Next**: [Troubleshooting Common Issues](./TROUBLESHOOTING.md)
