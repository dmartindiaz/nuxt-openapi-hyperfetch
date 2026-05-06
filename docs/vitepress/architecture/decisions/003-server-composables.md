# ADR 003: nuxtServer Output

**Status:** Accepted

**Date:** 2026-05-06

## Context

The project supports an optional server-side generator for Nuxt apps that want Nitro routes derived from the OpenAPI surface.

## Decision

Generate Nitro route files directly when `nuxtServer` is enabled.

The output targets the configured `serverRoutePath` and can optionally scaffold BFF auth and transformer files.

## Rationale

### Why direct route files

- they drop directly into the Nuxt server tree
- they are immediately runnable without an extra wrapper layer
- they align naturally with Nitro's file-based routing

### Why keep BFF scaffolding optional

- some apps only need thin proxy routes
- some apps need auth context and response transformation
- optional scaffolding keeps the simple path simple

## Consequences

### Positive

- clear integration with Nuxt server routing
- optional path toward a richer BFF layer
- runtime config and Nitro error handling stay explicit in generated code

### Negative

- server output is a separate surface to document and maintain
- generated route files are more opinionated than purely headless helpers

## Related guides

- [Server route pattern](/architecture/patterns/server-composables)
- [BFF pattern](/architecture/patterns/bff-pattern)
