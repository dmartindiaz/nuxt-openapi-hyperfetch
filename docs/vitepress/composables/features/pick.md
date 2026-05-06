# Pick Fields

Use `pick` to select specific fields from the response before `transform` runs.

## Overview

`pick` is implemented by the shared generated runtime and works with both `useFetch` and `useAsyncData` wrappers.

Execution order:

1. Request resolves
2. `pick` extracts fields
3. `transform` receives the picked result

## Top-level fields

```ts
const { data } = useFetchGetPetById(
  {
    path: { petId: 123 },
  },
  {
    pick: ['id', 'name', 'status'] as const,
  }
)
```

## Nested fields

```ts
const { data } = useFetchGetUser({ path: { id: 1 } }, {
  pick: ['profile.name', 'profile.avatar', 'status'] as const,
})
```

Nested dot-notation is supported, but type inference becomes wider than simple top-level picks.

## With `transform`

```ts
const { data } = useAsyncDataGetUsers({}, {
  pick: ['id', 'profile.name'] as const,
  transform: (users) => users.map((user) => ({
    id: user.id,
    displayName: user.profile.name.toUpperCase(),
  })),
})
```

## Works with raw responses

For raw wrappers, `pick` applies to `response.data`, not to `headers`, `status`, or `statusText`.

```ts
const { data } = useAsyncDataGetUserRaw(
  { path: { id: 1 } },
  {
    pick: ['id', 'name'] as const,
  }
)
```

## Related guides

- [Request interception](/composables/features/request-interception)
- [useFetch](/composables/use-fetch/)
- [useAsyncData](/composables/use-async-data/)
