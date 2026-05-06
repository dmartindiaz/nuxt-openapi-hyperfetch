# Design Patterns

These pages describe the main patterns used by the current generators and runtime.

## Core patterns

### Module-driven generation

Generation is orchestrated by the Nuxt module, not by a standalone CLI workflow.

### SDK-first wrappers

The project first generates a base SDK with `@hey-api/openapi-ts` and then layers higher-level helpers on top.

### Shared runtime

`useFetch` and `useAsyncData` share common runtime behavior for callbacks, headers, pagination, and data shaping.

### Optional server output

The `nuxtServer` generator can create Nitro route files and, when enabled, optional BFF scaffolding.

### Optional connector layer

Connectors are generated on top of `useAsyncData` as a headless, resource-oriented abstraction.

## Pattern pages

- [Client composables](/architecture/patterns/client-composables)
- [Server routes](/architecture/patterns/server-composables)
- [BFF pattern](/architecture/patterns/bff-pattern)
- [Error handling](/architecture/patterns/error-handling)

## Related guides

- [Architecture overview](/architecture/)
- [Architecture decisions](/architecture/decisions/)
