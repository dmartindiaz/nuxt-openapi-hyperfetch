---
title: Connector Configuration
description: Connector activation, strategies, and resource overrides.
---

# Connector Configuration

This page describes the connector configuration supported by the current Nuxt module flow.

## Where to configure it

Configure connectors in `nuxt.config.ts` under the `openapi` key.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],
  openapi: {
    input: './swagger.yaml',
    output: './openapi',
    generators: ['useAsyncData', 'connectors'],
    connectors: {
      strategy: 'hybrid',
    },
  },
})
```

## Supported shape

```ts
type ConnectorsConfig = {
  enabled?: boolean
  strategy?: 'manual' | 'hybrid'
  resources?: Record<
    string,
    {
      operations?: Partial<
        Record<
          'getAll' | 'get' | 'create' | 'update' | 'delete',
          { operationId?: string; path?: string }
        >
      >
    }
  >
}
```

For each configured operation:

- `operationId` or `path` is required
- defining both is invalid
- defining neither is invalid

## When connectors are considered requested

Connector generation is considered requested when any of these is true:

- `createUseAsyncDataConnectors === true`
- `generators` includes `'connectors'`
- `connectors` has meaningful config such as `enabled`, `strategy`, or non-empty `resources`

When connectors are requested, the module internally ensures `useAsyncData` generation is present as well.

## Strategy behavior

## `hybrid`

`hybrid` is the default behavior.

It works like this:

- start from strictly inferred canonical CRUD resources discovered from the spec
- apply explicit overrides for matching resources
- add custom resources that exist only in config
- keep inferred operations that were not overridden

Important: `hybrid` no longer guesses from helper routes such as `GET /user/login` or `GET /pet/findByTags`. If the default inference cannot prove an operation is canonical CRUD, that operation is omitted and a warning is logged.

## `manual`

`manual` generates only the resources explicitly declared by the user.

That means:

- no inferred resources are added automatically
- partial CRUD definitions are allowed
- you choose exactly which resource names and operations are emitted

## Operation resolution rules

During config resolution:

1. `operationId` and `path` cannot be used together for the same operation.
2. One of them must be present.
3. `operationId` must exist in the indexed OpenAPI operations.
4. `path` must exist and must contain a compatible method for the requested connector operation.
5. When a path has multiple compatible matches, the resolver prefers the endpoint whose detected intent matches the requested operation.

Method compatibility is:

- `getAll` -> `GET`
- `get` -> `GET`
- `create` -> `POST`
- `update` -> `PUT` or `PATCH`
- `delete` -> `DELETE`

For ambiguous matches, resolver preferences are:

- `getAll`: prefer endpoints detected as `list`
- `get`: prefer endpoints detected as `detail`
- `update`: prefer `PUT` over `PATCH`

These preferences only apply after you opt into a manual mapping with `operationId` or `path`. They are not used by the automatic CRUD inference pass anymore.

## Missing-operation warnings

During generation, missing inferred operations produce warnings such as:

- `useUsersConnector has no getAll operation inferred. Add it manually via connectors.resources.user.operations.getAll if needed.`
- `useStoresConnector has no update operation inferred. Add it manually via connectors.resources.store.operations.update if needed.`

Those warnings are informational. Generation continues and emits the connector with the operations that were inferred successfully.

## Example: `hybrid`

```ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],
  openapi: {
    input: './swagger.yaml',
    output: './openapi',
    generators: ['useAsyncData', 'connectors'],
    connectors: {
      strategy: 'hybrid',
      resources: {
        pets: {
          operations: {
            getAll: { operationId: 'findPetsByStatus' },
            get: { operationId: 'getPetById' },
            create: { operationId: 'addPet' },
            update: { operationId: 'updatePet' },
            delete: { operationId: 'deletePet' },
          },
        },
        userSessions: {
          operations: {
            getAll: { operationId: 'loginUser' },
          },
        },
        featuredPets: {
          operations: {
            getAll: { operationId: 'findPetsByTags' },
            get: { path: '/pet/{petId}' },
          },
        },
      },
    },
  },
})
```

In `hybrid` mode:

- `pets` overrides the inferred mapping for that resource
- `userSessions` deliberately exposes a non-canonical helper route as a connector
- `featuredPets` is added as an extra configured resource
- non-overridden inferred operations remain available

## Example: `manual`

```ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],
  openapi: {
    input: './swagger.yaml',
    output: './openapi',
    connectors: {
      strategy: 'manual',
      resources: {
        pets: {
          operations: {
            getAll: { operationId: 'findPetsByStatus' },
            get: { path: '/pet/{petId}' },
          },
        },
        users: {
          operations: {
            get: { path: '/user/{username}' },
            create: { path: '/user' },
            update: { path: '/user/{username}' },
            delete: { path: '/user/{username}' },
          },
        },
      },
    },
  },
})
```

In `manual` mode:

- only `pets` is generated
- only the configured operations are defined for each resource
- this is the safest mode when your API does not follow canonical REST shapes consistently

## Backward compatibility

The legacy `createUseAsyncDataConnectors` flag still exists and still triggers connector generation.

Use it only as compatibility glue. New configuration should prefer `generators: ['connectors']` and the `connectors` object.

## Validation failures

Connector generation fails before file emission when config is invalid. Common failures are:

- both `operationId` and `path` defined
- neither `operationId` nor `path` defined
- unknown `operationId`
- unknown `path`
- path exists but does not expose a compatible HTTP method

Validation does not fail just because an inferred operation is missing. That case produces a warning and leaves the connector partial until you add an explicit override.
