# Headless Connectors — Especificación de implementación

> Documento de referencia para el nuevo sistema de connectors en `src/generators/connectors/`.
> Este sistema **sustituye completamente** al anterior `src/generators/components/connector-generator/`.

---

## Principios

1. **`$fetch` para mutaciones** — `create`, `update`, `del` usan `$fetch` directo, sin `useAsyncData`
2. **`useAsyncData` solo para `getAll`** — lectura reactiva, paginación, SSR, watch de filtros
3. **`ui` anidado** en connectors que abren modales (`create`, `update`, `del`)
4. **Connectors agnósticos de UI** — `ui.isOpen` es un `Ref<boolean>`, el developer lo enlaza a lo que quiera (modal, drawer, sheet, etc.)
5. **Reutilizar sin tocar** — `schema-analyzer/`, `zod-error-merger.ts`, `pagination.ts`, `apiHelpers.ts`

---

## Uso del developer (resultado final)

```ts
// En el componente
const { getAll, get, create, update, del } = usePetsConnector()

// getAll — lista reactiva
getAll.items          // ComputedRef<Pet[]>
getAll.load()         // recarga la lista
getAll.select(item)   // selecciona una fila

// get — detalle por ID
const pet = await get.load(5)   // retorna Pet, awaitable
get.data                         // Ref<Pet|null>

// create
create.ui.open()                 // abre modal
create.model.value.name = 'Rex'  // rellena form
await create.execute()           // POST, valida Zod, cierra modal en éxito
create.errors                    // errores Zod por campo

// update
update.ui.open(row)              // abre modal + pre-rellena con la fila
await update.execute(row.petId)  // PUT
update.errors

// del
del.ui.open(row)                 // abre modal de confirmación + stage
await del.execute()              // DELETE con el staged item
del.staged                       // el item pendiente de borrar
```

---

## API completa por connector

### `getAll` (era `table`)

```ts
interface GetAllConnectorReturn<TRow> {
  // Estado
  items: ComputedRef<TRow[]>           // era: rows
  columns: ComputedRef<ColumnDef[]>
  loading: ComputedRef<boolean>
  error: ComputedRef<unknown>

  // Paginación
  pagination: ComputedRef<PaginationState | null>
  goToPage(n: number): void
  nextPage(): void
  prevPage(): void
  setPerPage(n: number): void

  // Selección
  selected: Ref<TRow[]>
  select(item: TRow): void           // era: onRowSelect (solo toggle)
  deselect(item: TRow): void         // nuevo
  toggleSelect(item: TRow): void     // nuevo
  clearSelection(): void

  // Acciones
  load(params?: unknown): Promise<void>  // era: refresh()

  // Callbacks
  onSuccess: Ref<((items: TRow[]) => void) | null>
  onError: Ref<((err: unknown) => void) | null>

  // ELIMINADOS vs versión anterior:
  // create(), update(row), remove(row)
  // _createTrigger, _updateTarget, _deleteTarget
}
```

**Implementación interna**: sigue usando `useAsyncData` internamente a través de `useApiAsyncData`.
El factory se pasa igual que antes: `() => useAsyncDataGetPets(params)`.

---

### `get` (era `detail`)

```ts
interface GetConnectorReturn<TItem> {
  // Estado
  data: Ref<TItem | null>              // era: item (ComputedRef → Ref)
  loading: Ref<boolean>
  error: Ref<unknown>
  fields: ComputedRef<FormFieldDef[]>

  // Acciones
  load(id: string | number): Promise<TItem>  // era: Promise<void>, no retornaba nada
  clear(): void

  // Callbacks
  onSuccess: Ref<((item: TItem) => void) | null>
  onError: Ref<((err: unknown) => void) | null>

  // ELIMINADOS vs versión anterior:
  // _composable, _currentId
}
```

**Implementación interna**: `$fetch(url(id))` directo. `load()` hace el fetch, asigna `data.value` y retorna el item.

---

### `create` (era `createForm`)

```ts
interface CreateConnectorReturn<TInput, TOutput = TInput> {
  // Estado del form
  model: Ref<Partial<TInput>>
  errors: Ref<Record<string, string[]>>
  loading: Ref<boolean>
  error: Ref<unknown>                  // era: submitError
  submitted: Ref<boolean>
  isValid: ComputedRef<boolean>
  hasErrors: ComputedRef<boolean>
  fields: ComputedRef<FormFieldDef[]>

  // Acciones
  execute(data?: Partial<TInput>): Promise<TOutput>  // era: submit()
  reset(): void
  setValues(data: Partial<TInput>): void
  setField(key: keyof TInput, value: unknown): void  // nuevo

  // Callbacks
  onSuccess: Ref<((data: TOutput) => void) | null>
  onError: Ref<((err: unknown) => void) | null>

  // UI (nuevo)
  ui: {
    isOpen: Ref<boolean>
    open(): void
    close(): void
  }
}
```

**Implementación interna**:
- `execute(data?)` valida con Zod → `$fetch(url, { method: 'POST', body: data ?? model.value })` → en éxito: `onSuccess`, `ui.close()`, `reset()`
- `ui.close()` solo cierra, no hace reset (el developer puede querer mantener el model)

---

### `update` (era `updateForm`)

```ts
interface UpdateConnectorReturn<TInput, TOutput = TInput> {
  // Estado del form
  model: Ref<Partial<TInput>>
  errors: Ref<Record<string, string[]>>
  loading: Ref<boolean>
  error: Ref<unknown>                  // era: submitError
  submitted: Ref<boolean>
  isValid: ComputedRef<boolean>
  hasErrors: ComputedRef<boolean>
  fields: ComputedRef<FormFieldDef[]>
  targetId: Ref<string | number | null>  // nuevo — ID del item en edición

  // Acciones
  load(id: string | number): Promise<void>   // nuevo — carga item para pre-rellenar model
  execute(id: string | number, data?: Partial<TInput>): Promise<TOutput>  // era: submit()
  reset(): void
  setValues(data: Partial<TInput>): void
  setField(key: keyof TInput, value: unknown): void  // nuevo

  // Callbacks
  onSuccess: Ref<((data: TOutput) => void) | null>
  onError: Ref<((err: unknown) => void) | null>

  // UI (nuevo)
  ui: {
    isOpen: Ref<boolean>
    open(item?: Partial<TInput> & { [key: string]: unknown }): void  // open + setValues
    close(): void
  }
}
```

**Implementación interna**:
- `load(id)` hace `$fetch GET url(id)` → `setValues(resultado)`
- `ui.open(item)` si se pasa item hace `setValues(item)` inmediatamente (sin fetch), guarda `targetId`
- `execute(id, data?)` valida con Zod → `$fetch(url(id), { method: 'PUT'/'PATCH', body: data ?? model.value })` → en éxito: `onSuccess`, `ui.close()`
- `loadWith` del sistema anterior **desaparece** — sustituido por `ui.open(item)` que pre-rellena directamente con el item de la tabla

---

### `del` (era `deleteAction`)

```ts
interface DeleteConnectorReturn<TItem> {
  // Estado
  staged: Ref<TItem | null>            // era: target
  hasStaged: ComputedRef<boolean>      // era: hasTarget
  loading: Ref<boolean>
  error: Ref<unknown>

  // Acciones
  stage(item: TItem): void             // era: setTarget (sin abrir modal)
  cancel(): void
  execute(): Promise<void>             // era: confirm() — usa staged
  execute(item: TItem): Promise<void>  // sobrecarga — borrado directo sin staging

  // Callbacks
  onSuccess: Ref<((item: TItem) => void) | null>
  onError: Ref<((err: unknown) => void) | null>

  // UI (nuevo — isOpen estaba en el nivel raíz antes)
  ui: {
    isOpen: Ref<boolean>
    open(item: TItem): void   // stage(item) + isOpen = true
    close(): void             // cancel() + isOpen = false
  }
}
```

**Implementación interna**:
- `execute()` toma `staged.value`, extrae el ID via la función `idFn` pasada al constructor, llama `$fetch(url(id), { method: 'DELETE' })`
- En éxito: `onSuccess(staged.value)`, `cancel()`, `ui.close()`
- `execute(item)` hace `stage(item)` + `execute()`

---

## Estructura de archivos a crear

```
src/generators/connectors/
├── generator.ts              ← orquestador (copia adaptada de connector-generator/generator.ts)
├── templates.ts              ← generación del código del archivo use{Resource}Connector.ts
├── types.ts                  ← ConnectorGeneratorOptions
└── runtime/
    ├── connector-types.ts    ← todas las interfaces TypeScript de arriba
    ├── useGetAllConnector.ts ← runtime getAll
    ├── useGetConnector.ts    ← runtime get ($fetch)
    ├── useCreateConnector.ts ← runtime create ($fetch + Zod)
    ├── useUpdateConnector.ts ← runtime update ($fetch + Zod)
    ├── useDeleteConnector.ts ← runtime delete ($fetch)
    └── zod-error-merger.ts   ← copia de shared/runtime/zod-error-merger.ts (sin cambios)
```

---

## Archivo generado por recurso (ejemplo: Pets)

```ts
// composables/connectors/use-pets-connector.ts (GENERADO)

import { z } from 'zod'
import { useGetAllConnector }    from '../runtime/useGetAllConnector'
import { useGetConnector }       from '../runtime/useGetConnector'
import { useCreateConnector }    from '../runtime/useCreateConnector'
import { useUpdateConnector }    from '../runtime/useUpdateConnector'
import { useDeleteConnector }    from '../runtime/useDeleteConnector'
import { useAsyncDataGetPets }   from '../use-async-data/composables/useAsyncDataGetPets'

// Schemas Zod generados a partir del spec
const PetCreateSchema = z.object({
  name: z.string().min(1),
  status: z.enum(['available', 'pending', 'sold']).optional(),
})
const PetUpdateSchema = PetCreateSchema

// Tipos inferidos
type PetCreateInput = z.infer<typeof PetCreateSchema>
type PetUpdateInput = z.infer<typeof PetUpdateSchema>

// Definición de columnas para tabla
const petColumns = [
  { key: 'id',     label: 'ID',     type: 'number' },
  { key: 'name',   label: 'Name',   type: 'string' },
  { key: 'status', label: 'Status', type: 'string' },
]

// Definición de campos para forms
const petFields = [
  { key: 'name',   label: 'Name',   type: 'text',   required: true },
  { key: 'status', label: 'Status', type: 'select', required: false,
    options: [{ label: 'Available', value: 'available' }, ...] },
]

export function usePetsConnector(params?: unknown, options: UsePetsConnectorOptions = {}) {
  const { createSchema, updateSchema, onRequest, onSuccess, onError, onFinish } = options

  const getAll = useGetAllConnector(
    () => useAsyncDataGetPets(params as any),
    { columns: petColumns }
  )

  const get = useGetConnector(
    (id: string | number) => `/pet/${id}`,
    { fields: petFields }
  )

  const create = useCreateConnector<PetCreateInput>(
    '/pet',
    {
      method: 'POST',
      schema: PetCreateSchema,
      schemaOverride: createSchema,
      fields: petFields,
      onRequest, onSuccess, onError, onFinish
    }
  )

  const update = useUpdateConnector<PetUpdateInput>(
    (id: string | number) => `/pet/${id}`,
    {
      method: 'PUT',
      schema: PetUpdateSchema,
      schemaOverride: updateSchema,
      fields: petFields,
      onRequest, onSuccess, onError, onFinish
    }
  )

  const del = useDeleteConnector<Pet>(
    (item: Pet) => item.petId ?? item.id,  // idFn: extrae el ID del item
    (id: string | number) => `/pet/${id}`,  // urlFn: construye la URL
    { onRequest, onSuccess, onError, onFinish }
  )

  return { getAll, get, create, update, del }
}

export interface UsePetsConnectorOptions {
  createSchema?: z.ZodType | ((base: typeof PetCreateSchema) => z.ZodType)
  updateSchema?: z.ZodType | ((base: typeof PetUpdateSchema) => z.ZodType)
  onRequest?: (ctx: RequestContext) => void | Promise<void>
  onSuccess?: (data: unknown) => void | Promise<void>
  onError?:   (err: unknown)  => void | Promise<void>
  onFinish?:  (ctx: FinishContext) => void | Promise<void>
}
```

---

## Integración en CLI y módulo Nuxt

### CLI (`src/index.ts`)
- La flag `--connectors` invoca el nuevo `generateConnectors` de `src/generators/connectors/generator.ts`
- Sin cambios en las opciones ni en el flujo de prompts

### Módulo Nuxt (`src/module/index.ts`)
- Cambiar import de `generateConnectors` al nuevo path
- `addImportsDir` apunta a `composables/connectors/` (sin cambios de path relativo)
- Opción `createUseAsyncDataConnectors` se renombra a `createConnectors` en `module/types.ts`

---

## Qué se reutiliza sin cambios

| Archivo | Ubicación | Uso |
|---|---|---|
| `schema-analyzer/` entero | `components/schema-analyzer/` | Análisis del spec → `ResourceMap` |
| `pagination.ts` | `shared/runtime/` | Paginación en `useGetAllConnector` |
| `apiHelpers.ts` | `shared/runtime/` | `getGlobalBaseUrl`, callbacks globales |
| `zod-error-merger.ts` | `shared/runtime/` | Merge errores Zod en `useCreateConnector` / `useUpdateConnector` |
| `useApiAsyncData.ts` | `use-async-data/runtime/` | Usado internamente por `useGetAllConnector` |

---

## TODO de implementación

- [x] **PASO 1** — `runtime/connector-types.ts` — todas las interfaces TypeScript
- [x] **PASO 2** — `runtime/useGetConnector.ts` — `$fetch` GET por ID
- [x] **PASO 3** — `runtime/useCreateConnector.ts` — `$fetch` POST + Zod + `ui`
- [x] **PASO 4** — `runtime/useUpdateConnector.ts` — `$fetch` PUT/PATCH + Zod + `ui`
- [x] **PASO 5** — `runtime/useDeleteConnector.ts` — `$fetch` DELETE + staging + `ui`
- [x] **PASO 6** — `runtime/useGetAllConnector.ts` — wrapper sobre `useAsyncData` + `items` + selección
- [ ] **PASO 7** — `connectors/types.ts` — `ConnectorGeneratorOptions`
- [ ] **PASO 8** — `connectors/templates.ts` — generación del código `use{Resource}Connector.ts`
- [ ] **PASO 9** — `connectors/generator.ts` — orquestador: analiza spec, itera recursos, escribe archivos, copia runtime
- [ ] **PASO 10** — Integración CLI (`src/index.ts`) + módulo Nuxt (`src/module/index.ts` + `src/module/types.ts`)
