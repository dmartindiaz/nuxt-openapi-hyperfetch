# BFF Pattern

The `nuxtServer` generator can optionally scaffold a BFF-oriented structure on top of generated Nitro routes.

## What `enableBff` adds

When `enableBff` is enabled, the generator creates additional server-side scaffolding alongside routes:

- `server/auth/context.ts`
- `server/auth/types.ts`
- `server/bff/transformers/*.ts`
- `server/bff/_transformers.example.ts`
- `server/bff/README.md`

The stubs are created only when missing, so user code is preserved.

## Route behavior in BFF mode

Generated routes try to:

1. load auth context from `~/server/auth/context`
2. call the backend API
3. apply a resource transformer from `~/server/bff/transformers/*`
4. fall back to raw backend data if no transformer exists

## Why this pattern exists

It gives you a place to:

- enforce permissions
- reshape backend payloads for the frontend
- aggregate backend details into app-specific responses
- keep private server concerns out of client composables

## Tradeoff

This is optional scaffolding, not a required layer. If you only need typed server proxy routes, `nuxtServer` can run without BFF mode.

## Related guides

- [Server route pattern](/architecture/patterns/server-composables)
- [ADR 003](/architecture/decisions/003-server-composables)
