# Core Concepts

These are the concepts that matter for the current package behavior.

## 1. Build-time generation

The module runs during the Nuxt build lifecycle.

- In development, generation runs before `nuxt dev` when `enableDevBuild` is enabled.
- In production, generation runs before `nuxt build` when `enableProductionBuild` is enabled.
- If `enableAutoGeneration` is on, the module watches the configured input file and regenerates on change.

This means the generated code is part of your project output, not a remote runtime dependency.

## 2. The generated SDK is the foundation

The first step always generates the OpenAPI SDK and types into `openapi/`.

That SDK is then used as the source for higher-level generators such as:

- `useFetch`
- `useAsyncData`
- `nuxtServer`
- `connectors`

If the SDK generation is wrong or stale, every layer on top of it will be wrong too.

## 3. Composables are generated wrappers

Generated composables are thin, typed wrappers around the generated client and Nuxt data primitives.

In practice this gives you:

- operation-specific names based on `operationId`
- typed params shaped from the OpenAPI operation
- typed return values
- shared runtime helpers for callbacks and request customization

Example usage:

```ts
const { data, error } = await useAsyncDataGetPetById({
  path: {
    petId: 123,
  },
})
```

## 4. Generators are additive

Each generator adds a different layer:

- `useFetch`: simple component-friendly fetch wrappers
- `useAsyncData`: wrappers with cache-aware async data flows and raw variants
- `nuxtServer`: generated route handlers for server-owned API access
- `connectors`: headless UI connectors built on top of `useAsyncData`

You do not need to generate everything. Keep only the layers your application actually uses.

## 5. Connectors require `useAsyncData`

Connectors are not a standalone runtime. They depend on the generated `useAsyncData` composables.

If connectors are requested, the module automatically ensures `useAsyncData` is generated as well.

## 6. Output boundaries matter

By default:

- SDK and client composables are written under `openapi/`
- server routes are written under `server/routes/api/`

That separation is intentional. Client-facing generated code and server handlers are different outputs with different responsibilities.

## 7. Auto-import only applies to generated composables

When `enableAutoImport` is enabled, the module registers the generated composable directories with Nuxt.

That helps you call generated composables directly in components, but it does not replace understanding where the generated files live or how they are structured.

## Next steps

- [Generating Composables](/guide/generating-composables)
- [Choosing a Generator](/guide/choosing-a-generator)
- [Composables Reference](/composables/)
