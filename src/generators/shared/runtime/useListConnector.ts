// @ts-nocheck - This file runs in user's Nuxt project with different TypeScript config
/**
 * useListConnector — Runtime connector for list/table endpoints.
 *
 * Wraps a useAsyncData composable that returns an array and exposes:
 * - rows, columns, loading, error state
 * - pagination helpers (if paginated: true)
 * - row selection
 * - modal coordination helpers (openCreate, openUpdate, openDelete)
 *
 * Copied to the user's project alongside the generated connectors.
 */
import { ref, computed, shallowRef } from 'vue';

/**
 * @param composableFn  The generated useAsyncData composable, e.g. useAsyncDataGetPets
 * @param options       Configuration for the list connector
 */
export function useListConnector(composableFn, options = {}) {
  const { paginated = false, columns = [], columnLabels = {}, columnLabel = null } = options;

  // ── Execute the underlying composable ──────────────────────────────────────
  const composable = composableFn({ paginated });

  // ── Derived state ──────────────────────────────────────────────────────────

  const rows = computed(() => {
    const data = composable.data?.value;
    if (!data) return [];
    // Support both direct arrays and { data: [...] } shapes
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    return [];
  });

  const loading = computed(() => composable.pending?.value ?? false);
  const error = computed(() => composable.error?.value ?? null);

  // Pagination — passthrough from the underlying composable when paginated: true
  const pagination = computed(() => composable.pagination?.value ?? null);

  function goToPage(page) {
    composable.pagination?.value?.goToPage?.(page);
  }

  function nextPage() {
    composable.pagination?.value?.nextPage?.();
  }

  function prevPage() {
    composable.pagination?.value?.prevPage?.();
  }

  function setPerPage(n) {
    composable.pagination?.value?.setPerPage?.(n);
  }

  // ── Row selection ──────────────────────────────────────────────────────────

  const selected = ref([]);

  function onRowSelect(row) {
    const idx = selected.value.indexOf(row);
    if (idx === -1) {
      selected.value = [...selected.value, row];
    } else {
      selected.value = selected.value.filter((r) => r !== row);
    }
  }

  function clearSelection() {
    selected.value = [];
  }

  // ── Refresh ────────────────────────────────────────────────────────────────

  function refresh() {
    void composable.refresh?.();
  }

  // ── CRUD coordination (triggers watched by the parent component) ──────────
  // The parent watches these refs to decide when to open a modal/panel/route.
  // Naming convention:
  //   _createTrigger — Ref<number> counter; no data needed (form starts empty)
  //   _updateTarget  — ShallowRef<Row|null>; the row to pre-fill the edit form
  //   _deleteTarget  — ShallowRef<Row|null>; the row to confirm deletion for

  const _createTrigger = ref(0);
  const _updateTarget = shallowRef(null);
  const _deleteTarget = shallowRef(null);

  /**
   * Signal the parent that the user wants to create a new item.
   * The parent should watch `_createTrigger` and open a create form/modal.
   */
  function create() {
    _createTrigger.value++;
  }

  /**
   * Signal the parent that the user wants to edit `row`.
   * The parent should watch `_updateTarget` and open an edit form/modal.
   */
  function update(row) {
    _updateTarget.value = row;
  }

  /**
   * Signal the parent that the user wants to delete `row`.
   * The parent should watch `_deleteTarget` and open a confirmation modal.
   */
  function remove(row) {
    _deleteTarget.value = row;
  }

  // Apply label overrides: columnLabel function takes priority over columnLabels map
  const resolvedColumns = computed(() =>
    columns.map((col) => ({
      ...col,
      label: columnLabel
        ? columnLabel(col.key)
        : (columnLabels[col.key] ?? col.label),
    }))
  );

  return {
    // State
    rows,
    columns: resolvedColumns,
    loading,
    error,

    // Pagination
    pagination,
    goToPage,
    nextPage,
    prevPage,
    setPerPage,

    // Selection
    selected,
    onRowSelect,
    clearSelection,

    // Actions
    refresh,

    // CRUD coordination — public methods
    create,
    update,
    remove,

    // CRUD coordination — internal triggers (watch these in the parent)
    _createTrigger,
    _updateTarget,
    _deleteTarget,
  };
}
