# OpenAPI Conventions

> The closer your API follows REST conventions, the better the generated connectors.

The generator analyses your OpenAPI spec and maps each operation to one of five CRUD intents: `list`, `detail`, `create`, `update`, `delete`. This mapping is based entirely on **REST conventions** — HTTP methods, path shapes, and response schemas. The more consistently your API follows REST, the more complete and correct the generated connectors will be, with no manual overrides needed.

---

## Why REST conventions matter here

The generator does not read your mind. It uses three signals to decide what to generate:

1. **HTTP method** — `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
2. **Path shape** — Does the path end with a `{parameter}`? Is it a collection path (`/pets`) or an item path (`/pets/{petId}`)?
3. **Response schema** — Does the response return an array, a paginated envelope, or a single object?

A REST-compliant API provides all three signals unambiguously. A non-REST or inconsistently-designed API forces you to add `x-nxh-intent` overrides throughout.

### What a well-designed resource looks like

```yaml
paths:
  /pet:                       # collection path
    get:                      # → list    (array or paginated response)
    post:                     # → create  (requestBody + no path param)

  /pet/{petId}:               # item path (ends with path param)
    get:                      # → detail  (single object response)
    put:                      # → update  (requestBody + path param)
    delete:                   # → delete
```

This is the Petstore spec. The generator produces a complete `usePetsConnector` with all five sub-connectors from this structure without any manual hints.

---

## How intent detection works

The generator uses **HTTP method + path shape + response schema** to classify each endpoint. You can always override the automatic detection with an extension.

### Detection rules

| Method | Path shape | Response schema | Detected intent |
|---|---|---|---|
| `GET` | no path param (`/pets`) | array or `{ data: [] }` | `list` |
| `GET` | no path param (`/pets`) | object (paginated envelope) | `list` |
| `GET` | ends with path param (`/pets/{id}`) | object | `detail` |
| `GET` | ends with path param (`/pets/{id}`) | no JSON response | `unknown` (ignored) |
| `POST` | does **not** end with path param | any | `create` |
| `POST` | ends with path param (`/pets/{id}/action`) | any | `unknown` (ignored) |
| `PUT` | any | any | `update` |
| `PATCH` | any | any | `update` |
| `DELETE` | any | any | `delete` |

An endpoint classified as `unknown` is ignored during connector generation (no sub-connector is produced for it).

---

## Tag grouping

All endpoints in the same **first tag** are grouped into one connector.

```yaml
paths:
  /pet:
    post:
      tags: [pet]        # → usePetsConnector.create
  /pet/{petId}:
    get:
      tags: [pet]        # → usePetsConnector.get
    delete:
      tags: [pet]        # → usePetsConnector.del
```

::: warning
If an endpoint has **no tags**, the generator falls back to the first path segment (e.g. `/pet/{id}` → `pet`). It is strongly recommended to always define tags.
:::


The connector name is derived from the tag:

| Tag | Connector |
|---|---|
| `pet` | `usePetsConnector` |
| `user` | `useUsersConnector` |
| `order` | `useOrdersConnector` |
| `store` | `useStoreConnector` (already ends in `e`) |

---

## Required patterns

### The list endpoint

The `getAll` sub-connector is generated from a `GET` endpoint that returns an **array or paginated envelope** with **no path parameters**.

```yaml
# ✅ Detected as 'list' — returns array
/pets:
  get:
    operationId: findPets
    responses:
      '200':
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/Pet'
```

```yaml
# ✅ Also detected as 'list' — returns object without path param
/pets:
  get:
    operationId: listPets
    responses:
      '200':
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    $ref: '#/components/schemas/Pet'
                total:
                  type: integer
```

### The detail endpoint

The `get` sub-connector is generated from a `GET` endpoint **that ends with a path parameter** and returns a single object.

```yaml
# ✅ Detected as 'detail'
/pets/{petId}:
  get:
    operationId: getPetById
    parameters:
      - name: petId
        in: path
        required: true
        schema:
          type: integer
    responses:
      '200':
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
```

### The create endpoint

The `create` sub-connector is generated from a `POST` endpoint **that does not end with a path parameter**, with a `requestBody`.

```yaml
# ✅ Detected as 'create'
/pets:
  post:
    operationId: addPet
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Pet'
    responses:
      '200':
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
```

::: warning
`POST /pets/{id}` is classified as `unknown` because it ends with a path param. If your API uses `POST /pets/{id}` for updates, use `x-nxh-intent: update` to override (see below).
:::

### The update endpoint

The `update` sub-connector is generated from `PUT` or `PATCH`. The path **must end with a path parameter** so the generator knows which `id` to send.

```yaml
# ✅ PUT with path param — detected as 'update'
/pets/{petId}:
  put:
    operationId: updatePet
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Pet'
    responses:
      '200':
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pet'
```

```yaml
# ✅ PATCH also works
/pets/{petId}:
  patch:
    operationId: patchPet
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/PetPatch'
```

### The delete endpoint

The `del` sub-connector is generated from any `DELETE` operation. The path parameter becomes the ID extractor in the generated `idFn`.

```yaml
# ✅ Detected as 'delete'
/pets/{petId}:
  delete:
    operationId: deletePet
    parameters:
      - name: petId
        in: path
        required: true
        schema:
          type: integer
    responses:
      '200':
        description: Pet deleted
```

::: tip ID extraction
The generator produces `(item) => item.petId ?? item.id` as the `idFn`. If your path param is `id`, the extractor becomes `(item) => item.id ?? item.id`. Always name your path parameter to match the field name in your response schema.
:::

---

## `requestBody` for Zod schemas

The `create` and `update` Zod schemas are generated from the `requestBody` of the corresponding endpoint. Missing `requestBody` means no Zod validation — the connector still works, but without client-side validation.

```yaml
# ✅ Full requestBody — Zod schema generated
/pets:
  post:
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [name, photoUrls]
            properties:
              name:
                type: string
              photoUrls:
                type: array
                items:
                  type: string
              status:
                type: string
                enum: [available, pending, sold]
```

```yaml
# ⚠️ No requestBody — connector generated without Zod validation
/pets:
  post:
    operationId: addPet
    responses:
      '200':
        description: OK
```

### Using `$ref` for requestBody

You can reference a shared schema component. The generator resolves `$ref` correctly.

```yaml
/pets:
  post:
    requestBody:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/NewPet'  # ✅ resolved

components:
  schemas:
    NewPet:
      type: object
      required: [name, photoUrls]
      properties:
        name:
          type: string
        photoUrls:
          type: array
          items:
            type: string
```

---

## Column generation

Column definitions for the `getAll` connector's `columns` property are inferred from the **list endpoint's response schema** (or the detail endpoint if no list exists). Each property becomes a column with a `type` hint:

| Schema type / format | Column `type` |
|---|---|
| `type: string`, `type: number`, `type: integer` | `text`, `number` |
| `format: date`, `format: date-time` | `date` |
| `type: boolean` | `boolean` |
| `enum` values | `badge` |
| `type: array` | `text` (stringified) |

For accurate column types, define your list response schema with precise types:

```yaml
components:
  schemas:
    Pet:
      type: object
      properties:
        id:
          type: integer      # → type: 'number'
        name:
          type: string       # → type: 'text'
        status:
          type: string
          enum:              # → type: 'badge'
            - available
            - pending
            - sold
        createdAt:
          type: string
          format: date-time  # → type: 'date'
```

---

## `operationId` — required for composable naming

Every endpoint used for CRUD **must have an `operationId`**. The generator uses it to name the underlying `useAsyncData` composable for the list endpoint.

```yaml
# ✅ Has operationId
/pets:
  get:
    operationId: findPets      # → useAsyncDataFindPets
    tags: [pet]

# ⚠️ Missing operationId — falls back to 'get__pets_' (ugly, but works)
/pets:
  get:
    tags: [pet]
```

::: warning
Always define `operationId`. Auto-generated fallback names are not stable across spec changes.
:::

---

## When multiple endpoints match the same intent

If a resource tag has multiple `GET` list endpoints (e.g. `/pets` and `/pets/findByStatus`), the generator picks the **simplest** one: fewest path parameters first, then shortest path.

```yaml
/pet:
  get:                           # ← 0 path params, length 4 → selected as 'list'
    tags: [pet]
    operationId: getPets

/pet/findByStatus:
  get:                           # ← 0 path params, length 17 → falls back
    tags: [pet]
    operationId: findPetsByStatus
```

To force a specific endpoint as the list source, use `x-nxh-intent`:

```yaml
/pet/findByStatus:
  get:
    x-nxh-intent: list           # override — this becomes the list endpoint
    tags: [pet]
    operationId: findPetsByStatus
```

---

## `x-nxh-intent` override

Any endpoint can declare its intent explicitly with the `x-nxh-intent` extension. This bypasses all automatic detection.

```yaml
/pets/{id}/restore:
  post:
    x-nxh-intent: update         # treat this POST as an update
    tags: [pet]
    operationId: restorePet

/pets/bulk:
  delete:
    x-nxh-intent: unknown        # exclude from connector generation
    tags: [pet]
    operationId: bulkDeletePets
```

Valid values: `list` | `detail` | `create` | `update` | `delete` | `unknown`

---

## Common anti-patterns that break generation

These are real-world API designs that prevent the generator from producing correct connectors:

### Using `POST` for updates

```yaml
# ❌ POST /pets/{id} — classified as 'unknown', no update sub-connector
/pets/{id}:
  post:
    operationId: updatePet
```

**Fix**: Change to `PUT /pets/{id}` (or `PATCH`), or add `x-nxh-intent: update`.

### ID sent in the body, not the URL

```yaml
# ⚠️ PUT /pet — no path param, ID is in the requestBody
/pet:
  put:
    operationId: updatePet
    requestBody:
      content:
        application/json:
          schema:
            properties:
              id:
                type: integer
```

This is actually valid — the generator detects it as `update` and generates `execute(id, data)` with a static URL. But `del.execute(item)` will call `DELETE /pet` without an ID in the path, which may not be what your API expects. Consider moving the ID to the path.

### Path parameter name does not match the response field

```yaml
# ❌ Path param is 'id' but the Pet schema has 'petId'
/pet/{id}:
  delete:
    operationId: deletePet

components:
  schemas:
    Pet:
      properties:
        petId:   # ← field name doesn't match path param 'id'
          type: integer
```

Generated `idFn`: `(item) => item.id ?? item.id` — only looks for `item.id`, misses `petId`.

**Fix**: Name the path parameter to match the field — use `{petId}` instead of `{id}`.

### No `requestBody` on the create/update endpoint

```yaml
# ⚠️ POST /pet without requestBody — create connector works, but no Zod validation
/pet:
  post:
    operationId: addPet
    responses:
      '200':
        description: OK
```

The connector is generated, but `create.isValid` is always `true` and no errors are shown. Always define `requestBody` for write endpoints.

### All endpoints under the same tag but different resources

```yaml
# ⚠️ Two unrelated resources both tagged 'api'
/pets:
  get:
    tags: [api]
/orders:
  get:
    tags: [api]
```

The generator groups them into a single `useApiConnector` with conflicting list endpoints. Use specific tags: `tags: [pet]`, `tags: [order]`.

---

## Checklist

Use this checklist before running the generator:


- [ ] Every endpoint has a unique `operationId`
- [ ] Every endpoint has at least one `tags` entry
- [ ] The list endpoint (`GET /resource`) has a JSON response with an array or paginated object
- [ ] The detail endpoint (`GET /resource/{id}`) ends with a path parameter
- [ ] The create endpoint (`POST /resource`) has a `requestBody` with `application/json` content
- [ ] The update endpoint (`PUT /resource/{id}`) ends with a path parameter and has a `requestBody`
- [ ] The delete endpoint (`DELETE /resource/{id}`) ends with a path parameter
- [ ] The path parameter name in `DELETE /resource/{petId}` matches the field name in the response schema (`pet.petId`)
- [ ] All `$ref` references in request/response schemas are defined in `components/schemas`
- [ ] Non-CRUD endpoints (actions, bulk operations) are tagged with `x-nxh-intent: unknown` to exclude them
