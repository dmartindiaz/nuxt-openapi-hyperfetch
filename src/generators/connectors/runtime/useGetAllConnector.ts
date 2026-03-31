// @ts-nocheck - This file runs in user's Nuxt project with different TypeScript config
/**
 * useGetAllConnector — Runtime connector for list/collection GET endpoints.
 *
 * Wraps a useAsyncData composable (reactive, SSR-compatible, supports pagination).
 * The factory pattern means the composable is initialized in setup() context.
 *
 * Key differences from the old useListConnector:
 * - items instead of rows
 * - select/deselect/toggleSelect instead of onRowSelect
 * - load(params?) instead of refresh()
 * - No CRUD coordination methods (create/update/remove/_createTrigger etc.)
 *   — coordination is the component's responsibility via callbacks
 *
 * Copied to the user's project alongside the generated connectors.
 */
import { ref, computed } from 'vue';

/**
 * @param factory   A zero-argument function that calls and returns the underlying
 *                  useAsyncData composable, e.g. () => useAsyncDataGetPets(params)
 *                  Called once during connector setup (inside setup()).
 * @param options   Configuration for the connector
 */
export function useGetAllConnector(factory, options = {}) {
  const { columns = [], columnLabels = {}, columnLabel = null } = options;

  // ── Execute the underlying composable once (in setup context) ─────────────
  const composable = factory();

  // ── Derived state ──────────────────────────────────────────────────────────

  const items = computed(() => {
    const data = composable.data?.value;
    if (!data) return [];
    // Support both direct arrays and { data: [...] } shapes (paginated APIs)
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

  // ── Selection ──────────────────────────────────────────────────────────────

  const selected = ref([]);

  function select(item) {
    if (!selected.value.includes(item)) {
      selected.value = [...selected.value, item];
    }
  }

  function deselect(item) {
    selected.value = selected.value.filter((r) => r !== item);
  }

  function toggleSelect(item) {
    if (selected.value.includes(item)) {
      deselect(item);
    } else {
      select(item);
    }
  }

  function clearSelection() {
    selected.value = [];
  }

  // ── Callbacks — developer-assignable ──────────────────────────────────────
  const onSuccess = ref(null);
  const onError = ref(null);

  // ── Load / refresh ─────────────────────────────────────────────────────────

  /**
   * Reload the list. Equivalent to refresh() on the underlying composable.
   * @param _params Reserved for future use (reactive params are handled by
   *                the underlying useAsyncData watch sources).
   */
  async function load(_params) {
    await composable.refresh?.();
    if (!composable.error?.value) {
      onSuccess.value?.(items.value);
    } else {
      onError.value?.(composable.error.value);
    }
  }

  // ── Column label resolution ────────────────────────────────────────────────

  const resolvedColumns = computed(() =>
    columns.map((col) => ({
      ...col,
      label: columnLabel
        ? columnLabel(col.key)
        : (columnLabels[col.key] ?? col.label),
    }))
  );

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    // State
    items,
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
    select,
    deselect,
    toggleSelect,
    clearSelection,

    // Actions
    load,

    // Callbacks
    onSuccess,
    onError,
  };
}
