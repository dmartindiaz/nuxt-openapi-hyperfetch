# Performance

This page covers generation, build, and runtime performance in the current Nuxt-only workflow.

## Generation is slow

Generation cost is driven mostly by the size and complexity of the OpenAPI document.

The biggest wins usually come from the contract itself:

- remove unused schemas and responses
- replace repeated inline objects with shared `$ref` components
- simplify deeply nested response graphs
- keep `operationId` and parameter design consistent

If the spec is extremely large, splitting it into smaller bounded sections can help more than any module-level tweak.

## Generation uses too much memory

For unusually large API contracts, Node can run out of heap during generation.

Increase the available heap before blaming the module:

```bash
set NODE_OPTIONS=--max-old-space-size=8192
npm run dev
```

If memory pressure remains high, reduce schema duplication and large inline payload definitions in the OpenAPI source.

## Dev startup is slow

In this module, generation can run before `nuxt dev` starts. Startup time grows when:

- the spec is large
- multiple generators are enabled
- the generated output was cleared and must be rebuilt fully
- the app also runs full type-checking and other heavy tooling in dev

Useful levers:

```ts
export default defineNuxtConfig({
  openapi: {
    input: './swagger.yaml',
    generators: ['useAsyncData'],
    enableDevBuild: true,
  },
  typescript: {
    typeCheck: false,
  },
})
```

If you do not need every generator during local work, keep the active set small.

## Rebuilds are slower than expected in development

Check whether you actually need automatic regeneration from file changes.

```ts
export default defineNuxtConfig({
  openapi: {
    input: './swagger.yaml',
    enableAutoGeneration: false,
  },
})
```

If the spec changes rarely, disabling auto-regeneration can make the feedback loop more stable.

## TypeScript is slow after generation

Large generated type graphs can slow the editor and build pipeline.

Useful baseline config:

```json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "incremental": true,
    "skipLibCheck": true,
    "isolatedModules": true
  }
}
```

If type performance is still poor, inspect the OpenAPI schemas for recursive types, giant unions, or repeated inline payloads.

## Bundle size grows too much

Bundle size problems usually come from how the app imports generated code, not from generation itself.

Prefer importing only the generated symbols you use.

```ts
import { useAsyncDataGetPetById } from '~/openapi/composables/use-async-data'
import type { Pet } from '~/openapi'
```

Avoid creating large catch-all imports for generated modules in application code.

## Too many requests happen on page load

This is usually an application orchestration issue.

Common fixes:

- fetch list data once and derive detail state locally when possible
- avoid mounting many independent request composables at the same time
- move aggregation logic to generated Nitro routes or BFF transformers when the page needs combined data
- use lazy execution for requests that are not needed immediately

## SSR is slow

When SSR is slow, the main question is whether the page is waiting on too many upstream calls.

Useful strategies:

- route requests through `nuxtServer` so server-side access is centralized
- cache expensive Nitro routes with Nitro caching primitives
- aggregate multiple upstream calls in BFF mode instead of scattering them across many page-level requests
- avoid browser-only auth logic in SSR paths

## Stale generated output hurts iteration speed

If the repo contains outdated generated files, you can waste time debugging the wrong thing.

After a major spec or config change, clear:

1. `openapi/`
2. `.nuxt/`
3. `.output/`

Then restart the Nuxt process.

## Checklist

When performance becomes a problem, verify in this order:

1. the OpenAPI spec is not doing unnecessary work through duplication or deep nesting
2. only the generators needed for the current task are enabled
3. auto-regeneration is enabled only when it adds value
4. the app imports generated symbols narrowly
5. SSR pages are not performing avoidable parallel upstream requests
6. stale generated and Nuxt cache output has been cleared after major changes

## Related pages

- [Build issues](/troubleshooting/build-issues)
- [Generation errors](/troubleshooting/generation-errors)
- [Server issues](/troubleshooting/server-issues)
