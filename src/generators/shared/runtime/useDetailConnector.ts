// @ts-nocheck - This file runs in user's Nuxt project with different TypeScript config
/**
 * useDetailConnector — Runtime connector for single-item GET endpoints.
 *
 * Wraps a useAsyncData composable that returns a single object and exposes:
 * - item, loading, error state
 * - load(id) to fetch a specific item on demand
 * - fields derived from the response (used by detail view components)
 *
 * Copied to the user's project alongside the generated connectors.
 */
import { ref, computed } from 'vue';

/**
 * @param composableFn  The generated useAsyncData composable, e.g. useAsyncDataGetPetById
 * @param options       Optional configuration
 */
export function useDetailConnector(composableFn, options = {}) {
  const { fields = [] } = options;

  // ── Execute the underlying composable lazily (only when load(id) is called) ─
  // composableFn is a generated wrapper: (id) => { _idRef.value = id; return _composable }
  // Calling it with null initializes the composable in setup context (safe — p.value is { param: null })
  // Calling it in load(id) updates the ref before refresh()
  const composable = composableFn(null);

  // ── Derived state ──────────────────────────────────────────────────────────

  const item = computed(() => composable.data?.value ?? null);
  const loading = computed(() => composable.pending?.value ?? false);
  const error = computed(() => composable.error?.value ?? null);

  // ── Actions ────────────────────────────────────────────────────────────────

  async function load(id) {
    composableFn(id);  // updates the generated _detailIdRef
    await composable.refresh?.();
  }

  function clear() {
    composableFn(null);
  }

  return {
    // State
    item,
    loading,
    error,
    fields: computed(() => fields),

    // Actions
    load,
    clear,

    // Expose composable for advanced use (e.g. useFormConnector loadWith)
    _composable: composable,
  };
}
