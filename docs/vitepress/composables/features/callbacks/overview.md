# Callbacks Overview

Every generated composable supports four local lifecycle callbacks.

## Execution flow

```text
onRequest -> request -> onSuccess or onError -> onFinish
```

The wrappers call them in this order:

1. `onRequest` before the request is sent
2. `onSuccess` when the request resolves successfully
3. `onError` when the request fails
4. `onFinish` after success or error

## Quick example

```ts
useFetchGetPetById(
  {
    path: { petId: 123 },
  },
  {
    onRequest: ({ url }) => {
      console.log('Fetching from:', url)
    },
    onSuccess: (pet) => {
      console.log('Loaded:', pet.name)
    },
    onError: (error) => {
      console.error('Failed:', error.message)
    },
    onFinish: ({ success }) => {
      console.log('Request complete:', success)
    },
  }
)
```

## What each callback is for

### `onRequest`

Runs before the request and can return request modifications.

Use it for:

- Adding headers
- Adjusting body or query values
- Request logging
- Starting loading or tracing state

[Learn more about onRequest](/composables/features/callbacks/on-request)

### `onSuccess`

Runs after a successful request.

Use it for:

- Success toasts
- Navigation
- Updating stores
- Analytics

[Learn more about onSuccess](/composables/features/callbacks/on-success)

### `onError`

Runs when the request throws or returns an error response.

Use it for:

- Error toasts
- Redirecting on `401`
- Logging
- Retry orchestration

[Learn more about onError](/composables/features/callbacks/on-error)

### `onFinish`

Runs after success or error and receives `{ data, error, success }`.

Use it for:

- Cleanup
- Hiding loading UI
- Completion metrics
- Shared success or error finalization

[Learn more about onFinish](/composables/features/callbacks/on-finish)

## Additive behavior

Local callbacks do not replace Nuxt's normal composable state. For example, `onError` can run and the composable `error` ref is still updated.

Global callbacks are a separate layer and run before local ones unless disabled or suppressed.

## Guarantees

- `onRequest` can return `headers`, `body`, or `query` modifications
- `onSuccess` receives transformed data after `pick` and `transform`
- `onError` receives the thrown error object from the underlying request
- `onFinish` receives `{ data, error, success }`

## Next steps

- [onRequest](/composables/features/callbacks/on-request)
- [onSuccess](/composables/features/callbacks/on-success)
- [onError](/composables/features/callbacks/on-error)
- [onFinish](/composables/features/callbacks/on-finish)
- [Global callbacks](/composables/features/global-callbacks/overview)
