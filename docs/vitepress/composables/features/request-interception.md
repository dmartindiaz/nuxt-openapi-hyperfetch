# Request Interception

Use `onRequest` to inspect or modify outgoing requests before they are sent.

## You can modify

- `headers`
- `query`
- `body`

`url` and `method` are readable context, not writable output fields.

## Basic example

```ts
useFetchGetPets({}, {
  onRequest: ({ headers, query }) => ({
    headers: {
      ...headers,
      'X-Request-ID': crypto.randomUUID(),
    },
    query: {
      ...query,
      locale: 'en',
    },
  }),
})
```

## Path-param operations

Keep the generated SDK param shape and modify only request metadata:

```ts
useFetchGetPetById(
  {
    path: { petId: 123 },
  },
  {
    onRequest: ({ headers }) => ({
      headers: {
        ...headers,
        'X-Trace-ID': crypto.randomUUID(),
      },
    }),
  }
)
```

## Query modifications

```ts
useFetchGetPets(
  {
    query: { status: 'available', limit: 10 },
  },
  {
    onRequest: ({ query }) => ({
      query: {
        ...query,
        limit: 100,
      },
    }),
  }
)
```

## Body modifications

```ts
useFetchCreatePet(
  {
    body: { name: 'fluffy' },
  },
  {
    onRequest: ({ body }) => ({
      body: {
        ...body,
        name: body.name.charAt(0).toUpperCase() + body.name.slice(1),
      },
    }),
  }
)
```

## Guidance

- Prefer returning a new object instead of mutating the incoming context
- Throw inside `onRequest` only when you intentionally want to stop the request
- Keep heavy orchestration outside the callback when possible

## Related guides

- [onRequest](/composables/features/callbacks/on-request)
- [Global callbacks](/composables/features/global-callbacks/overview)
