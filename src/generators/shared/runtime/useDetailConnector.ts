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

  // The item ID to load — reactive. null = not loaded yet.
  const currentId = ref(null);

  // ── Execute the underlying composable lazily (only when currentId changes) ─
  // We call the composable with lazy: true so it doesn't auto-fetch on mount.
  // load(id) sets currentId which triggers the watch inside the composable.
  const composable = composableFn(
    computed(() => (currentId.value !== null ? { id: currentId.value } : null)),
    { lazy: true, immediate: false }
  );

  // ── Derived state ──────────────────────────────────────────────────────────

  const item = computed(() => composable.data?.value ?? null);
  const loading = computed(() => composable.pending?.value ?? false);
  const error = computed(() => composable.error?.value ?? null);

  // ── Actions ────────────────────────────────────────────────────────────────

  async function load(id) {
    currentId.value = id;
    await composable.refresh?.();
  }

  function clear() {
    currentId.value = null;
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
    _currentId: currentId,
  };
}
