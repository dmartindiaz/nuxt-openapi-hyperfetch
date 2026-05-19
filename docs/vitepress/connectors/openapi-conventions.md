# OpenAPI Conventions

Connector generation now uses a strict CRUD inference pass. The default behavior is conservative on purpose: if the generator cannot prove that an endpoint belongs to a canonical REST resource, it does not generate that connector operation automatically.

## Canonical CRUD inference

Automatic connector inference follows these path conventions:

| Connector op | Canonical shape | Extra rule |
|---|---|---|
| `getAll` | `GET /resources` | success response must be an array of objects |
| `get` | `GET /resources/{id}` | success response must look like a single object |
| `create` | `POST /resources` | collection path only |
| `update` | `PUT /resources/{id}` or `PATCH /resources/{id}` | member path only |
| `delete` | `DELETE /resources/{id}` | member path only |

The same rules apply to nested resources:

| Connector op | Nested shape |
|---|---|
| `getAll` | `GET /users/{userId}/customers` |
| `get` | `GET /users/{userId}/customers/{customerId}` |
| `create` | `POST /users/{userId}/customers` |
| `update` | `PUT /users/{userId}/customers/{customerId}` |
| `delete` | `DELETE /users/{userId}/customers/{customerId}` |

## What is intentionally ignored

These shapes are not treated as canonical CRUD by default:

- action routes such as `POST /pets/{id}/publish`
- utility routes such as `GET /user/login` or `GET /user/logout`
- search/filter helper routes such as `GET /pet/findByStatus`
- collection-like GET routes that do not return an array of objects
- ambiguous resources where multiple candidate endpoints compete for the same CRUD slot

When one of those routes is useful for your UI, map it manually in `connectors.resources`.

## Resource identity

The connector resource is anchored to the canonical collection path, not to whichever tagged route happens to be shortest.

Examples:

- `/user` + `/user/{username}` -> `useUsersConnector()`
- `/users/{userId}/customers` + `/users/{userId}/customers/{customerId}` -> a customers connector for that nested collection

Tags are still useful metadata, but they no longer allow non-REST helper routes to become `getAll` automatically just because they share the same tag.

## Ambiguity policy

When there is doubt, the generator skips the operation instead of guessing.

Examples:

- two different `GET /resource`-style list candidates under the same resource
- a `GET` route that looks collection-shaped but returns a scalar or map
- a resource that has `get` and `delete` but no canonical list route

This means the generated connector may expose only part of CRUD. That is expected.

## Console warnings

When an operation cannot be inferred, the generator logs a warning in English so the missing piece is visible during generation.

Example warnings:

- `useUsersConnector has no getAll operation inferred. Add it manually via connectors.resources.user.operations.getAll if needed.`
- `usePetsConnector has no update operation inferred. Add it manually via connectors.resources.pet.operations.update if needed.`

## Response and schema inference

From the inferred endpoints, the generator derives:

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

And for nested resources:

```yaml
/users/{userId}/customers:
  get:
    operationId: listUserCustomers
  post:
    operationId: createUserCustomer

/users/{userId}/customers/{customerId}:
  get:
    operationId: getUserCustomer
  put:
    operationId: updateUserCustomer
  delete:
    operationId: deleteUserCustomer
```

## Non-standard patterns

These shapes usually need overrides or manual config:

- `POST /pets/{id}` used as update
- `GET /user/login` used as session helper
- `GET /store/inventory` returning a map instead of an array of entities
- `GET /pet/findByStatus` or `GET /pet/findByTags` used as filtered list helpers
- action-style paths such as `POST /pets/{id}/publish`
- multiple alternate routes competing for the same CRUD slot
- missing `operationId` values on manually-mapped operations

## `operationId` guidance

Manually mapped list endpoints are especially sensitive to `operationId`, because the generated connector imports the corresponding `useAsyncData{Operation}` composable by name.

If `operationId` is missing, the analyzer generates a fallback name from method and path. That still works, but the generated symbol names are much noisier.

## Path parameter naming

Delete connectors derive their `idFn` from the path param name first and then fall back to `item.id`.

For example, `DELETE /pet/{petId}` produces an extractor equivalent to:

```ts
(item) => item?.petId ?? item?.id ?? item
```

Specs are easier to work with when the path param name matches a real field in the returned item.
