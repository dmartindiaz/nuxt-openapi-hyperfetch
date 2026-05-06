# ADR 004: Base SDK Generation

**Status:** Accepted

**Date:** 2026-05-06

## Context

The project needs a reliable base layer for OpenAPI-derived types, client files, and operation contracts before adding Nuxt-specific wrappers.

## Decision

Delegate the base SDK generation step to `@hey-api/openapi-ts`, then build project-specific generators on top of the generated output.

## Rationale

### Why delegate the base SDK layer

- OpenAPI schema handling is large and easy to get wrong
- the project's unique value is the Nuxt wrapper layer, not a full OpenAPI parser implementation
- the generated SDK gives a stable contract that `useFetch`, `useAsyncData`, `nuxtServer`, and connectors can all consume

## Consequences

### Positive

- less custom schema-generation code to maintain
- one canonical source for generated operation types and SDK files
- wrapper generators can focus on Nuxt-specific behavior

### Negative

- the project depends on the structure and capabilities of the external SDK generator
- wrapper generators must stay compatible with upstream output changes

## Related guides

- [Architecture overview](/architecture/)
- [Client composable patterns](/architecture/patterns/client-composables)
