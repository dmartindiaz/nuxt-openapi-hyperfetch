# What is Nuxt OpenAPI Hyperfetch?

Nuxt OpenAPI Hyperfetch is a Nuxt module that turns a local OpenAPI document into a type-safe client layer for your application.

Instead of hand-writing wrappers for every endpoint, you configure the module once and generate:

- the OpenAPI SDK and types
- `useFetch` composables
- `useAsyncData` composables
- optional `nuxtServer` routes
- optional headless connectors built on top of `useAsyncData`

## The problem it solves

When a Nuxt app consumes a REST API, the same work tends to repeat:

1. Rewriting request wrappers by hand
2. Duplicating request and response types
3. Repeating loading, error, and callback wiring
4. Rebuilding the same patterns for each endpoint

That scales badly as the schema grows and makes refactors noisy.

## The generation flow

```text
OpenAPI file
  -> generated SDK and types in openapi/
  -> generated Nuxt composables in openapi/composables/
  -> optional server routes in server/routes/api/
  -> optional connectors in openapi/composables/connectors/
```

## Why it fits Nuxt

- Generated client composables are based on Nuxt data primitives.
- The module runs as part of the Nuxt build lifecycle.
- Auto-import can register generated composables for direct use in your app.
- `nuxtServer` generation supports BFF-style flows when you want the server to own the upstream API interaction.

## What gets generated

For a typical setup, the output looks like this:

```text
openapi/
  client/
  core/
  client.gen.ts
  index.ts
  sdk.gen.ts
  types.gen.ts
  composables/
    use-fetch/
    use-async-data/
    connectors/
```

If `nuxtServer` is enabled, route handlers are generated separately into `server/routes/api/` by default.

## When to use it

This module is a good fit when:

- your Nuxt app already has an OpenAPI or Swagger document
- you want a generated SDK plus Nuxt-native wrappers
- you want consistent request patterns across the app
- you want the option to move some API access behind server routes later

It is a poor fit when:

- your project is not using Nuxt
- you do not have a machine-readable API contract
- you only need one or two handwritten calls and do not want generated code at all

## Next steps

- [Getting Started](/guide/getting-started)
- [Use as Nuxt Module](/guide/use-as-nuxt-module)
- [Core Concepts](/guide/core-concepts)
