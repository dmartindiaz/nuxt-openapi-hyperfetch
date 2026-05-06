# Choosing a Generator

Generators are independent output layers. Choose the smallest set that matches how your Nuxt app actually talks to the API.

## Quick comparison

| Generator | Best for | Output location | Notes |
|-----------|----------|-----------------|-------|
| `useFetch` | Simple component-level requests | `openapi/composables/use-fetch/` | Good default for straightforward pages and forms. |
| `useAsyncData` | Cache-aware async flows and raw responses | `openapi/composables/use-async-data/` | Better when you want transforms, keys, or raw variants. |
| `nuxtServer` | Server-owned API access and BFF patterns | `server/routes/api/` by default | Keeps upstream calls on the server side. |
| `connectors` | Headless CRUD helpers built on top of `useAsyncData` | `openapi/composables/connectors/` | Requires `useAsyncData`. |

## `useFetch`

Choose `useFetch` when you want the simplest generated API for pages, forms, and standard CRUD views.

Use it when:

- the request should run naturally as part of component rendering
- you want a small mental model
- you do not need raw response metadata

Configuration example:

```ts
openapi: {
  input: './swagger.yaml',
  generators: ['useFetch'],
}
```

## `useAsyncData`

Choose `useAsyncData` when you need more control over execution and caching.

Use it when:

- you want raw response variants
- you need `transform`, lazy execution, or cache keys
- you want a better foundation for higher-level abstractions such as connectors

Configuration example:

```ts
openapi: {
  input: './swagger.yaml',
  generators: ['useAsyncData'],
}
```

## `nuxtServer`

Choose `nuxtServer` when the browser should not call the upstream API directly.

Use it when:

- credentials or headers should stay on the server
- you want a BFF-style boundary in your Nuxt app
- you want to centralize upstream request logic in server handlers

Configuration example:

```ts
openapi: {
  input: './swagger.yaml',
  generators: ['nuxtServer'],
  serverRoutePath: 'server/routes/api',
  enableBff: true,
}
```

## `connectors`

Choose connectors when you want headless helpers for repeated CRUD UI patterns.

Use them when:

- your app repeatedly builds list, detail, create, update, and delete flows
- you want a higher-level layer on top of generated `useAsyncData` composables
- you want resource-oriented abstractions instead of wiring every operation manually

Configuration example:

```ts
openapi: {
  input: './swagger.yaml',
  generators: ['useAsyncData', 'connectors'],
  connectors: {
    enabled: true,
    strategy: 'manual',
  },
}
```

## Recommended combinations

- `['useFetch', 'useAsyncData']`: sensible default for most Nuxt apps
- `['useAsyncData', 'connectors']`: good when you want a headless CRUD layer
- `['useAsyncData', 'nuxtServer']`: good when the server owns upstream access but you still use generated async composables elsewhere
- `['useFetch']`: fine for small apps that only need a lightweight client layer

## Decision rule

Start with the smallest useful set:

1. Add `useFetch` if you want simple generated composables.
2. Add `useAsyncData` if you need raw variants, transforms, or connector support.
3. Add `nuxtServer` if the upstream API should be hidden behind Nuxt server routes.
4. Add `connectors` only if repeated CRUD UI patterns justify the extra abstraction.

## Related

- [Generating Composables](/guide/generating-composables)
- [Use as Nuxt Module](/guide/use-as-nuxt-module)
