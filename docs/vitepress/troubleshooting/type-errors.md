# Type Errors

This page covers TypeScript errors caused by wrong imports, wrong parameter shapes, stale generated output, or mismatched OpenAPI contracts.

## Type import path is wrong

Import generated API types from `~/openapi` instead.

```ts
import type { GetPetByIdData, Pet } from '~/openapi'
```

If the type is missing there, generation is incomplete or stale.

## Generated type cannot be found

When TypeScript cannot find a generated type or composable export, usually one of these is true:

- generation never ran
- the output directory is stale
- the app still points to an old path

The current default output root is:

```text
openapi/
```

If needed, delete `openapi/`, restart Nuxt, and let the module regenerate from the current spec.

## Wrong composable name

Generated names come from `operationId`, not from guessed resource names.

The generated export follows the operationId:

```ts
useAsyncDataGetPetById({
  path: { petId: 1 },
})
```

## Wrong parameter shape

Generated operations usually expect a structured object, not a primitive argument.

Example:

```ts
import type { GetPetByIdData } from '~/openapi'

const params: GetPetByIdData = {
  path: { petId: 1 },
}

const { data } = useAsyncDataGetPetById(params)
```

If you pass a string or number directly where the generated type expects `path`, `query`, or `body`, TypeScript should fail.

## Missing required field in body or query

The generated input types expose required fields directly.

If TypeScript says a property is missing, fix the request shape rather than suppressing the error.

```ts
import type { AddPetData } from '~/openapi'

const payload: AddPetData = {
  body: {
    name: 'Milo',
    photoUrls: [],
  },
}
```

## `data` is a ref, not a plain object

Generated composables return Vue refs through `useFetch` or `useAsyncData` style APIs.

```ts
const { data } = useAsyncDataGetPetById({
  path: { petId: 1 },
})

const pet: Pet | null | undefined = data.value
```

If you assign `data` directly to `Pet`, the type mismatch is expected.

## Nullability error on `data.value`

Strict TypeScript settings are correct here. The request may still be pending or may have failed.

Use one of these patterns:

```ts
const name = data.value?.name

if (data.value) {
  console.log(data.value.name)
}
```

## Reactive params type is failing

Generated composables support `ref` and `computed` params, but the wrapped object still has to match the generated type.

```ts
const params = computed<GetPetByIdData>(() => ({
  path: {
    petId: Number(route.params.id),
  },
}))

const { data } = useAsyncDataGetPetById(params)
```

If `route.params.id` is a string, convert it explicitly before assigning it to a numeric field.

## Enum or union type is too broad

If a generated property became `string` instead of a string union, the issue usually comes from the OpenAPI spec.

For example, this produces a plain string:

```yaml
status:
  type: string
```

To generate a narrower union, the schema needs an explicit enum.

```yaml
status:
  type: string
  enum:
    - available
    - pending
    - sold
```

## Circular or excessively deep type errors

If TypeScript reports excessively deep instantiation, the root cause is usually the schema design.

Common fixes:

- replace recursive object nesting with IDs
- introduce lighter summary types
- avoid bidirectional full object graphs in response schemas

This is an API contract problem, not a Nuxt module problem.

## Type errors appear after the spec changed

That usually means the generated output and the app code are out of sync.

Clear the generated output and regenerate it before changing application code to work around stale types.

## TypeScript server still shows old errors

If the generated files are correct on disk but the editor still shows stale diagnostics:

1. restart the Nuxt dev process
2. restart the TypeScript server in the editor
3. confirm the project extends Nuxt's generated tsconfig

Minimal project config:

```json
{
  "extends": "./.nuxt/tsconfig.json"
}
```

## Checklist

When TypeScript errors appear around generated code, verify in this order:

1. imports come from `~/openapi` or `~/openapi/composables/...`
2. the composable name matches the real `operationId`
3. params match the generated `path`, `query`, and `body` structure
4. `data` is handled as a ref with nullable states
5. the OpenAPI spec defines enums and nested schemas correctly
6. stale generated output has been removed before retrying

## Related pages

- [Build issues](/troubleshooting/build-issues)
- [Composables issues](/troubleshooting/composables-issues)
- [Generation errors](/troubleshooting/generation-errors)
