# Generation Errors

This page covers failures while parsing the OpenAPI document or building generated output.

## The spec is not OpenAPI 3.x

The current module workflow expects an OpenAPI 3 document.

If your source document is still Swagger 2.0, convert it before asking the module to generate output.

Typical minimum shape:

```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
paths: {}
```

## `openapi.input` points to the wrong file

If the configured input path is wrong, generation fails before parsing anything useful.

```ts
export default defineNuxtConfig({
  modules: ['nuxt-openapi-hyperfetch'],
  openapi: {
    input: './swagger.yaml',
  },
})
```

Check that the file exists relative to the Nuxt project root and that the current build command can read it.

## Missing required top-level fields

The parser expects a valid OpenAPI document with the required top-level keys.

Most common missing fields:

- `openapi`
- `info`
- `paths`

If one of those is missing, fix the document before looking at generator code.

## Invalid `$ref`

If a schema or response references a component that does not exist, generation cannot build the type graph.

Example of a valid component reference:

```yaml
components:
  schemas:
    Pet:
      type: object
      properties:
        name:
          type: string

paths:
  /pets/{id}:
    get:
      operationId: getPetById
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Pet'
```

## Path parameter does not match the path template

Every path segment declared in the URL must have a matching OpenAPI parameter.

```yaml
paths:
  /pets/{petId}:
    get:
      operationId: getPetById
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
```

If the path uses `{petId}` but the parameter is named something else, generation may fail or produce the wrong input type.

## Missing or duplicate `operationId`

Generated composable names depend on `operationId`.

Use explicit and unique IDs for every operation.

```yaml
paths:
  /pets/{petId}:
    get:
      operationId: getPetById
  /pets/featured:
    get:
      operationId: getFeaturedPets
```

If `operationId` values are duplicated, generated export names will collide.

## Invalid schema types

Use valid OpenAPI schema types such as:

- `string`
- `number`
- `integer`
- `boolean`
- `array`
- `object`

If the spec uses ad hoc values or mixed conventions, generation errors are expected.

## Response shape is too vague

Generation is more predictable when responses declare a real content schema.

```yaml
responses:
  '200':
    description: OK
    content:
      application/json:
        schema:
          type: array
          items:
            $ref: '#/components/schemas/Pet'
```

If the response has no schema, generated output may be incomplete or overly broad.

## Circular references or excessively deep types

Recursive schemas are allowed in some forms, but deeply recursive full-object graphs often produce generation or TypeScript failures.

Common fixes:

- replace nested back-references with IDs
- introduce summary types
- avoid full bidirectional object graphs

## File changes are not reflected after fixing the spec

If the OpenAPI document is fixed but generated output still reflects the old state:

1. delete `openapi/`
2. restart `nuxt dev` or rerun `nuxt build`
3. confirm the current command is allowed to generate output

If `enableAutoGeneration` is `false`, development changes will not regenerate automatically.

## Generated output is only partially updated

Partial updates usually mean one of these:

- generation stopped at the first parser error
- the wrong input file is still configured
- stale files from an older output layout remain on disk

When in doubt, clear the whole generated output directory and regenerate from a known-good spec.

## Checklist

When generation fails, verify in this order:

1. `openapi.input` points to the expected file
2. the document is OpenAPI 3.x
3. required top-level fields exist
4. every `$ref` resolves to a real component
5. every path parameter matches the path template
6. each operation has a unique `operationId`
7. stale generated output has been removed before retrying

## Related pages

- [Build issues](/troubleshooting/build-issues)
- [Type errors](/troubleshooting/type-errors)
- [Performance](/troubleshooting/performance)
