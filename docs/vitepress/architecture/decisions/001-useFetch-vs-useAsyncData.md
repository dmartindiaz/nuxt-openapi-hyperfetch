# ADR 001: useFetch vs useAsyncData

**Status:** Accepted

**Date:** 2026-05-06

## Context

The module supports two Nuxt-facing composable families on top of the same OpenAPI SDK output.

Users need both:

- a straightforward wrapper for common page and mutation flows
- a more explicit wrapper for cache identity and raw response metadata

## Decision

Keep both generated families as first-class outputs:

- `useFetch`
- `useAsyncData`

The module defaults to generating both.

## Rationale

### Why keep both

- `useFetch` matches the simplest Nuxt ergonomics
- `useAsyncData` supports generated cache identity and raw variants
- both can share the same runtime features without duplicating OpenAPI parsing logic

### Why not collapse into one family

- it would remove useful Nuxt-specific semantics
- it would force one style on every consumer
- the codebase already has a stable shared runtime under both families

## Consequences

### Positive

- users can choose the Nuxt abstraction that fits the screen or flow
- docs can recommend simple defaults without losing advanced use cases
- shared runtime keeps callback and pagination behavior consistent

### Negative

- more generated files
- more documentation surface
- users need guidance on when to pick one family over the other

## Related guides

- [Choosing a generator](/guide/choosing-a-generator)
- [useFetch](/composables/use-fetch/)
- [useAsyncData](/composables/use-async-data/)
