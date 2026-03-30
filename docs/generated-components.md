# Generated Vue Components (NuxtUI) — Feature Spec & Architecture

> **Status**: Planned — Capa 3 del sistema de generación de componentes Vue  
> **Dependencia**: Requiere Capa 1 (Schema Analyzer) y Capa 2 (Connector Generator)  
> **Objetivo**: Generar componentes `.vue` completamente funcionales listos para usar en producción, usando NuxtUI como librería de componentes, consumiendo los connectors headless generados en Capa 2

---

## Tabla de Contenidos

- [Qué es esta feature](#qué-es-esta-feature)
- [Estructura de archivos generados](#estructura-de-archivos-generados)
- [El archivo index.ts — punto de personalización](#el-archivo-indexts--punto-de-personalización)
- [Arquitectura de componentes por recurso](#arquitectura-de-componentes-por-recurso)
- [Componentes individuales](#componentes-individuales)
- [Reglas de generación y sobreescritura](#reglas-de-generación-y-sobreescritura)
- [Configuración en nxh.config / nuxt.config](#configuración-en-nxhconfig--nuxtconfig)
- [Estructura de archivos del generador en src/](#estructura-de-archivos-del-generador-en-src)
- [Plan de implementación](#plan-de-implementación)
- [Ejemplos de componentes generados](#ejemplos-de-componentes-generados)
- [Añadir soporte para otros UI frameworks](#añadir-soporte-para-otros-ui-frameworks)

---

## Qué es esta feature

El **Component Generator** es la Capa 3 del sistema. Toma el `ResourceMap` producido por el Schema Analyzer y los connectors headless generados por el Connector Generator, y produce **componentes `.vue` completamente funcionales** listos para ser usados en un proyecto Nuxt 3.

Primera implementación: **NuxtUI** (`@nuxt/ui`).

El desarrollador puede:
- Usar los componentes directamente con `<PetsCrud />` o `<PetsTable />`
- Personalizar labels, traducciones y overrides de campo en `index.ts` (generado una vez)
- Modificar cualquier `.vue` libremente después de generarlos (son archivos del proyecto del usuario)
- Importar subcomponentes individualmente (`<PetsCreate />` solo el form)

---

## Estructura de archivos generados

Por defecto, los componentes se generan en `components/nxh/{resource}/`. El developer puede cambiar el directorio base en la config.

Para un recurso `Pet` con CRUD completo:

```
components/nxh/
  pets/
    index.ts                      ← generado UNA VEZ, nunca sobreescrito
    PetsCrud.vue                  ← componente principal CRUD completo
    table/
      index.vue                   ← tabla con columnas, paginación, botones de acción
    forms/
      PetsCreate.vue              ← formulario de creación
      PetsUpdate.vue              ← formulario de edición (pre-rellena con GET /{id})
    modals/
      PetsCreate.vue              ← modal que envuelve forms/PetsCreate.vue
      PetsUpdate.vue              ← modal que envuelve forms/PetsUpdate.vue
      PetsDelete.vue              ← modal de confirmación de borrado
```

Para un recurso solo con GET list (sin CRUD):

```
components/nxh/
  pets/
    index.ts
    table/
      index.vue
```

Para un recurso solo con POST (sin list):

```
components/nxh/
  pets/
    index.ts
    forms/
      PetsCreate.vue
    modals/
      PetsCreate.vue
```

El generador es inteligente: **solo genera los archivos que corresponden a los intents detectados**.

---

## El archivo index.ts — Punto de personalización

Este archivo es el contrato entre el generador y el desarrollador.

**Regla crítica: se genera UNA SOLA VEZ. Si ya existe, nunca se sobreescribe.**

```ts
// components/nxh/pets/index.ts
// Generated once by nxh — customize freely, this file will NOT be overwritten.
// Re-run `nxh components` to regenerate the .vue files without touching this file.

import type { NxhResourceConfig } from '#nxh/types'

export const config: NxhResourceConfig = {

  // ─── Columnas de la tabla ────────────────────────────────────────────────
  // Generadas automáticamente del response schema del GET list.
  // Modifica 'label' para traducir, añade 'hidden: true' para ocultar.
  columns: {
    id:        { label: 'ID',     hidden: false },
    name:      { label: 'Name' },
    status:    { label: 'Status', type: 'badge' },
    createdAt: { label: 'Created At', type: 'date' },
  },

  // ─── Campos del formulario ───────────────────────────────────────────────
  // El tipo se infiere automáticamente del schema OpenAPI.
  // Sobreescribe 'type', 'label' o añade 'options' para selects personalizados.
  // 'errors' permite personalizar los mensajes de validación Zod por campo.
  fields: {
    name: {
      label: 'Name',
      type: 'input',
      errors: {
        required: 'Name is required',              // sobreescribe el mensaje Zod
        min:      'Name must be at least 1 character',
      }
    },
    status: {
      label: 'Status',
      type: 'select',
      options: [                                   // rellena las options
        { label: 'Available', value: 'available' },
        { label: 'Sold',      value: 'sold' },
      ],
      errors: {
        invalid_enum_value: 'Select a valid status',
      }
    },
    photoUrls: { label: 'Photos', type: 'input' },
    // Los campos readOnly: true del schema están hidden: true por defecto
    // id:     { hidden: true },  ← generado así automáticamente
  },

  // ─── Opciones globales del recurso ───────────────────────────────────────
  showReadonlyFields: false,   // mostrar campos readOnly en formularios

  // ─── Hooks de ciclo de vida ──────────────────────────────────────────────
  // Retornar false en onBeforeCreate/onBeforeUpdate cancela la operación.
  onBeforeCreate: (data) => data,          // puede transformar el payload
  onAfterCreate:  (result) => {},
  onBeforeUpdate: (id, data) => data,
  onAfterUpdate:  (result) => {},
  onBeforeDelete: (item) => true,          // return false = cancelar
  onAfterDelete:  (item) => {},
}
```

Los `.vue` generados importan este `config` y lo aplican:
- `table/index.vue` usa `config.columns` para las columnas y labels
- `forms/PetsCreate.vue` usa `config.fields` para los inputs y labels
- Todos los `.vue` invocan los hooks correspondientes de `config`

---

## Arquitectura de componentes por recurso

### Jerarquía de dependencias

```
PetsCrud.vue
  ├── importa usePetsConnector (Capa 2)
  ├── importa config desde ./index.ts
  ├── renderiza table/index.vue
  │     └── usa connector.table
  ├── renderiza modals/PetsCreate.vue
  │     └── contiene forms/PetsCreate.vue
  │           └── usa connector.createForm
  ├── renderiza modals/PetsUpdate.vue
  │     └── contiene forms/PetsUpdate.vue
  │           └── usa connector.updateForm (pre-rellena con connector.detail)
  └── renderiza modals/PetsDelete.vue
        └── usa connector.deleteAction
```

### Comunicación entre componentes

Los subcomponentes **no se comunican entre sí directamente**. Todo pasa por `PetsCrud.vue` mediante el connector unificado:

- `table/index.vue` emite `@open-create`, `@open-update(row)`, `@open-delete(row)`
- `PetsCrud.vue` escucha esos eventos y abre el modal correspondiente
- Cuando un form hace submit con éxito, cierra el modal y llama `connector.table.refresh()`

Esto permite usar `table/index.vue` de forma independiente sin necesitar `PetsCrud.vue`.

---

## Componentes individuales

### `table/index.vue`

Responsabilidades:
- Mostrar `UTable` con las columnas de `config.columns`
- Columnas con `type: 'badge'` → `UBadge`; `type: 'date'` → fecha formateada
- Fila de acciones al final: botón Edit (abre modal update), botón Delete (abre modal delete)
- Paginación con `UPagination` si `connector.table.pagination` está activo
- Botón "New" en el header de la tabla (abre modal create)
- Loading state con skeleton rows
- Estado vacío con slot `empty` personalizable

Props:
```ts
defineProps<{
  connector: ListConnectorReturn<any>
  config: NxhResourceConfig
}>()
defineEmits(['open-create', 'open-update', 'open-delete'])
```

### `forms/PetsCreate.vue` y `forms/PetsUpdate.vue`

Responsabilidades:
- Renderizar cada campo de `config.fields` con el componente NuxtUI correspondiente
- `type: 'input'`     → `UInput`
- `type: 'textarea'`  → `UTextarea`
- `type: 'select'`    → `USelect`
- `type: 'checkbox'`  → `UCheckbox`
- `type: 'number'`    → `UInput type="number"`
- `type: 'datepicker'`→ `UInput type="date"` (o librería de fecha si disponible)
- Mostrar errores de validación por campo con `UFormField`
- Botón Submit con loading state
- `PetsUpdate.vue` usa `connector.updateForm` que pre-rellena automáticamente si existe `connector.detail`

Ejemplo de template generado con manejo de errores Zod vía `UFormField`:

```vue
<!-- forms/PetsCreate.vue (generado) -->
<template>
  <UForm @submit="connector.submit()">
    <template v-for="field in connector.fields" :key="field.name">
      <UFormField
        :label="field.label"
        :error="connector.errors[field.name]"
      >
        <!-- el error viene de Zod.safeParse → mergeado con config.fields[name].errors -->
        <UInput
          v-if="field.type === 'input'"
          v-model="connector.model[field.name]"
        />
        <USelect
          v-else-if="field.type === 'select'"
          v-model="connector.model[field.name]"
          :options="field.options"
        />
        <!-- ...otros tipos... -->
      </UFormField>
    </template>
    <UButton type="submit" :loading="connector.loading">Save</UButton>
  </UForm>
</template>
```

`connector.errors` es `Ref<Record<string, string>>` expuesto por `useFormConnector` tras `schema.safeParse()`. Si el campo no tiene error, el valor es `undefined` y `UFormField` no muestra nada.

Props:
```ts
defineProps<{
  connector: FormConnectorReturn<any>
  config: NxhResourceConfig
}>()
```

### `modals/PetsCreate.vue` y `modals/PetsUpdate.vue`

Wrapper simple de `UModal` + `UCard` que envuelve el form correspondiente.

```vue
<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>Create Pet</template>
      <PetsCreateForm :connector="connector.createForm" :config="config" />
    </UCard>
  </UModal>
</template>
```

El estado `isOpen` es manejado por `PetsCrud.vue`, no por el modal.

### `modals/PetsDelete.vue`

Modal de confirmación. No usa form.

```vue
<template>
  <UModal v-model="isOpen">
    <UCard>
      <template #header>Confirm Delete</template>
      <p>Are you sure you want to delete this item?</p>
      <template #footer>
        <UButton color="red" :loading="connector.deleteAction.loading.value"
          @click="connector.deleteAction.confirm()">
          Delete
        </UButton>
        <UButton variant="ghost" @click="connector.deleteAction.cancel()">
          Cancel
        </UButton>
      </template>
    </UCard>
  </UModal>
</template>
```

### `PetsCrud.vue`

Componente orquestador. Gestiona:
- El estado de qué modal está abierto (`createOpen`, `updateOpen`, `deleteOpen`)
- Escucha eventos de `table/index.vue` para abrir modales
- Llama `table.refresh()` cuando un form tiene éxito
- Invoca hooks `config.onBeforeCreate`, `config.onAfterCreate`, etc.

```vue
<script setup>
import { ref } from 'vue'
import { usePetsConnector } from '~/composables/connectors/usePetsConnector'
import { config } from './index'
import PetsTable from './table/index.vue'
import PetsCreateModal from './modals/PetsCreate.vue'
import PetsUpdateModal from './modals/PetsUpdate.vue'
import PetsDeleteModal from './modals/PetsDelete.vue'

const connector = usePetsConnector()

const createOpen = ref(false)
const updateOpen = ref(false)
const deleteOpen = ref(false)

connector.createForm.onSuccess.value = () => {
  createOpen.value = false
  connector.table.refresh()
  config.onAfterCreate?.(connector.createForm.model.value)
}

connector.updateForm.onSuccess.value = () => {
  updateOpen.value = false
  connector.table.refresh()
  config.onAfterUpdate?.(connector.updateForm.model.value)
}

connector.deleteAction.onSuccess.value = () => {
  deleteOpen.value = false
  connector.table.refresh()
  config.onAfterDelete?.(connector.deleteAction.target.value)
}
</script>

<template>
  <PetsTable
    :connector="connector.table"
    :config="config"
    @open-create="createOpen = true"
    @open-update="(row) => { connector.updateForm.setValues(row); updateOpen = true }"
    @open-delete="(row) => { connector.deleteAction.setTarget(row); deleteOpen = true }"
  />
  <PetsCreateModal v-model="createOpen" :connector="connector" :config="config" />
  <PetsUpdateModal v-model="updateOpen" :connector="connector" :config="config" />
  <PetsDeleteModal v-model="deleteOpen" :connector="connector" :config="config" />
</template>
```

---

## Reglas de generación y sobreescritura

| Archivo                     | Se genera        | Se sobreescribe en re-run |
|-----------------------------|------------------|---------------------------|
| `index.ts`                  | Solo si no existe | **NUNCA**                |
| `PetsCrud.vue`              | Siempre           | Sí                        |
| `table/index.vue`           | Siempre           | Sí                        |
| `forms/PetsCreate.vue`      | Siempre           | Sí                        |
| `forms/PetsUpdate.vue`      | Siempre           | Sí                        |
| `modals/PetsCreate.vue`     | Siempre           | Sí                        |
| `modals/PetsUpdate.vue`     | Siempre           | Sí                        |
| `modals/PetsDelete.vue`     | Siempre           | Sí                        |

Si el developer modifica un `.vue` generado y no quiere que se sobreescriba: lo mueve a un directorio fuera de `components/nxh/` y actualiza sus imports.

---

## Configuración en nxh.config / nuxt.config

```js
// nxh.config.js
export default {
  // ... config existente

  components: {
    // Override de intent para endpoints ambiguos
    'GET /pets/search': { intent: 'list' },

    // Configuración por recurso
    pets: {
      outputDir: 'components/admin/pets',  // directorio custom
      showReadonlyFields: true,            // mostrar campos readOnly
      ui: 'nuxtui',                        // framework UI (default: 'nuxtui')
    },

    // Excluir un recurso de la generación
    internalLogs: { skip: true },
  }
}
```

En `nuxt.config.ts` (cuando se usa como módulo Nuxt):

```ts
export default defineNuxtConfig({
  nxh: {
    components: {
      'GET /pets/search': { intent: 'list' },
      pets: {
        outputDir: 'components/admin/pets',
      }
    }
  }
})
```

---

## Estructura de archivos del generador en src/

```
src/
  generators/
    components/
      schema-analyzer/          ← Capa 1 (ver headless-composables-ui.md)
      connector-generator/      ← Capa 2 (ver headless-composables-ui.md)
      vue-generator/            ← ESTA FEATURE (Capa 3)
        index.ts                ← entry point
        types.ts                ← ComponentPlan, ComponentFile, UIAdapter
        generator.ts            ← orquesta la generación de todos los .vue
        config-generator.ts     ← genera el index.ts (si no existe)
        adapters/
          nuxtui/
            index.ts            ← entry point del adaptador NuxtUI
            table.ts            ← template de table/index.vue con UTable
            form-create.ts      ← template de forms/PetsCreate.vue
            form-update.ts      ← template de forms/PetsUpdate.vue
            modal-create.ts     ← template de modals/PetsCreate.vue
            modal-update.ts     ← template de modals/PetsUpdate.vue
            modal-delete.ts     ← template de modals/PetsDelete.vue
            crud.ts             ← template de PetsCrud.vue
            field-mapper.ts     ← FormFieldDef → componente NuxtUI string
          primevue/             ← para implementación futura
            index.ts
            ...
```

Cada función en `adapters/nuxtui/*.ts` recibe un `ComponentPlan` (datos del recurso) y devuelve un `string` con el contenido del archivo `.vue`.

---

## Plan de implementación

### Fase 1 — Tipos y contratos del vue-generator

**Archivo:** `src/generators/components/vue-generator/types.ts`

```ts
interface ComponentPlan {
  resourceName: string         // 'Pet'
  resourceNamePlural: string   // 'Pets'
  connectorImportPath: string  // '~/composables/connectors/usePetsConnector'
  configImportPath: string     // './index'
  columns: ColumnDef[]
  formFields: FormFieldDef[]
  intents: Intent[]            // ['list', 'create', 'update', 'delete']
  hasPagination: boolean
  hasDetail: boolean
}

interface UIAdapter {
  name: string
  generateTable(plan: ComponentPlan): string
  generateFormCreate(plan: ComponentPlan): string
  generateFormUpdate(plan: ComponentPlan): string
  generateModalCreate(plan: ComponentPlan): string
  generateModalUpdate(plan: ComponentPlan): string
  generateModalDelete(plan: ComponentPlan): string
  generateCrud(plan: ComponentPlan): string
  generateConfig(plan: ComponentPlan): string
}
```

### Fase 2 — Adaptador NuxtUI

**Archivos:** `src/generators/components/vue-generator/adapters/nuxtui/`

Implementar cada función de `UIAdapter` produciendo strings con el template Vue correcto. Cada función es pura: `(plan: ComponentPlan) => string`.

Orden de implementación:
1. `field-mapper.ts` — mapea `FormFieldDef.type` → componente NuxtUI correcto
2. `table.ts` — genera `table/index.vue` con `UTable`, `UPagination`, botones
3. `form-create.ts` — genera `forms/PetsCreate.vue` con `UForm`, `UFormField`
4. `form-update.ts` — igual que create pero con `loadWith`
5. `modal-create.ts`, `modal-update.ts`, `modal-delete.ts` — wrappers `UModal`
6. `crud.ts` — orquestador principal
7. `config-generator.ts` — genera `index.ts` (con columnas y campos inferidos como punto de partida)

### Fase 3 — Generator principal

**Archivo:** `src/generators/components/vue-generator/generator.ts`

```ts
export async function generateVueComponents(
  resourceMap: ResourceMap,
  outputBaseDir: string,
  adapter: UIAdapter,
  options: { overwriteConfig?: boolean } = {}
): Promise<void>
```

Por cada recurso en `resourceMap`:
1. Construye el `ComponentPlan`
2. Determina qué archivos generar según los intents
3. Para `index.ts`: escribe solo si no existe (a menos que `overwriteConfig: true`)
4. Formatea cada archivo con Prettier antes de escribir
5. Reporta progreso con `@clack/prompts`

### Fase 4 — Integración en CLI

Nuevo flag en el comando `generate` existente:
```
--components <ui>   Generate Vue components with specified UI framework (nuxtui)
```

O subcomando separado (preferible para no sobrecargar `generate`):
```
nxh components --input swagger.yaml --output ./components/nxh --ui nuxtui
```

---

## Ejemplos de componentes generados

### Uso básico — solo importar PetsCrud

```vue
<!-- pages/admin/pets.vue -->
<template>
  <div>
    <h1>Pets Management</h1>
    <PetsCrud />
  </div>
</template>
```

### Solo la tabla, sin modales

```vue
<!-- pages/dashboard.vue -->
<script setup>
import PetsTable from '~/components/nxh/pets/table/index.vue'
import { usePetsConnector } from '~/composables/connectors/usePetsConnector'
import { config } from '~/components/nxh/pets/index'

const { table } = usePetsConnector()
</script>

<template>
  <PetsTable :connector="table" :config="config" />
</template>
```

### Solo el formulario de creación en una página dedicada

```vue
<!-- pages/pets/new.vue -->
<script setup>
import PetsCreateForm from '~/components/nxh/pets/forms/PetsCreate.vue'
import { usePetsConnector } from '~/composables/connectors/usePetsConnector'
import { config } from '~/components/nxh/pets/index'

const { createForm } = usePetsConnector()

createForm.onSuccess.value = () => navigateTo('/pets')
</script>

<template>
  <PetsCreateForm :connector="createForm" :config="config" />
</template>
```

---

## Añadir soporte para otros UI frameworks

Para añadir soporte para PrimeVue, Vuetify, Shadcn-vue, etc., se crea una nueva carpeta en `adapters/`:

```
adapters/
  primevue/
    index.ts        ← exporta un objeto UIAdapter
    table.ts        ← usa DataTable, Column de PrimeVue
    form-create.ts  ← usa InputText, Dropdown, etc.
    ...
```

El `generator.ts` es idéntico para todos los adaptadores. Solo cambia qué `UIAdapter` se le pasa.

El CLI expondrá:
```
nxh components --ui primevue
nxh components --ui nuxtui     (default)
nxh components --ui shadcn
```

Esto permite que la comunidad contribuya nuevos adaptadores sin tocar el core del generador.
