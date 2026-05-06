# ADR 002: Callback System

**Status:** Accepted

**Date:** 2026-05-06

## Context

Generated composables need extensibility for request lifecycle behavior without forcing every app to fork generated code.

The runtime must support:

- per-request behavior
- app-wide behavior
- selective opt-out
- deterministic execution order

## Decision

Use a shared two-tier callback system:

- local callbacks passed in composable options
- global callback rules provided by a Nuxt plugin through `$getGlobalApiCallbacks`

Global callbacks can be a single rule or an array of rules.

## Runtime model

Supported lifecycle stages:

- `onRequest`
- `onSuccess`
- `onError`
- `onFinish`

Supported control features:

- `skipGlobalCallbacks: true`
- `skipGlobalCallbacks: ['onError']`
- `patterns` and `methods` filters on global rules
- `return false` from a matching global callback to suppress the corresponding local callback

## Rationale

- local callbacks keep component-specific logic close to the call site
- global rules centralize auth, telemetry, and shared error handling
- filters prevent global behavior from becoming all-or-nothing

## Consequences

### Positive

- the same callback model works across `useFetch` and `useAsyncData`
- apps get a clear plugin integration point for shared behavior
- one-off exceptions stay local through `skipGlobalCallbacks`

### Negative

- runtime behavior is more complex than plain Nuxt wrappers
- callback ordering must be documented clearly

## Related guides

- [Callbacks overview](/composables/features/callbacks/overview)
- [Global callbacks](/composables/features/global-callbacks/overview)
