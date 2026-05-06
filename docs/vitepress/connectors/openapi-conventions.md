# OpenAPI Conventions

Connector generation depends on detected CRUD intent. The closer the spec is to standard REST shapes, the less manual configuration is needed.

## Intent detection

Each endpoint is classified as one of these intents:

- `list`
- `detail`
- `create`
- `update`
- `delete`
- `unknown`

The detector uses:

1. `x-openapi-intent` if present on the operation
2. otherwise HTTP method, path shape, and success response schema

```yaml
x-openapi-intent: list | detail | create | update | delete | unknown
```

## Detection rules

| Method | Shape | Result |
|---|---|---|
| `DELETE` | any | `delete` |
| `POST` | path does not end with a path param | `create` |
| `POST` | path ends with a path param | `unknown` |
| `PUT` | any | `update` |
| `PATCH` | any | `update` |
| `GET` | JSON array response | `list` |
| `GET` | JSON object response and path has a path param | `detail` |
| `GET` | JSON object response and path has no path param | `list` |
| `GET` | no JSON success response | `unknown` |

Endpoints classified as `unknown` are ignored by connector grouping.

## Resource grouping

Endpoints are grouped by:

- the first tag, when tags exist
- otherwise the first non-parameter path segment

So these operations typically end up in the same connector:

```yaml
/pet:
  get:
    tags: [pet]
  post:
    tags: [pet]

/pet/{petId}:
  get:
    tags: [pet]
  put:
    tags: [pet]
  delete:
    tags: [pet]
```

That resource becomes `usePetsConnector()`.

## Best-endpoint selection

If a resource has multiple endpoints for the same intent, the generator prefers the simplest one:

- fewer path params first
- then shorter path length

This matters when a spec exposes both a generic resource path and a nested alternative.

## Response and schema inference

From the grouped endpoints, the analyzer derives:

- columns from `list` response schema first, then `detail`
- form fields from `create` and `update` request bodies
- Zod schemas from `create` and `update` request bodies
- the item type name from `$ref` names in detail or list schemas

If a create or update endpoint has no request body schema, the connector still works, but there is no generated Zod validator for that operation.

## Good patterns

These shapes map cleanly to connector generation:

```yaml
/pets:
  get:
    operationId: listPets
  post:
    operationId: createPet

/pets/{petId}:
  get:
    operationId: getPet
  put:
    operationId: updatePet
  delete:
    operationId: deletePet
```

## Non-standard patterns

These shapes usually need overrides or manual config:

- `POST /pets/{id}` used as update
- action-style paths such as `POST /pets/{id}/publish`
- missing tags on a large spec with repeated path prefixes
- missing `operationId` values on list endpoints

## `operationId` guidance

List endpoints are especially sensitive to `operationId`, because the generated connector imports the corresponding `useAsyncData{Operation}` composable by name.

If `operationId` is missing, the analyzer generates a fallback name from method and path. That still works, but the generated symbol names are much noisier.

## Path parameter naming

Delete connectors derive their `idFn` from the path param name first and then fall back to `item.id`.

For example, `DELETE /pet/{petId}` produces an extractor equivalent to:

```ts
(item) => item?.petId ?? item?.id ?? item
```

Specs are easier to work with when the path param name matches a real field in the returned item.
