// @ts-nocheck - This file runs in user's Nuxt project with different TypeScript config
/**
 * useDeleteConnector — Runtime connector for DELETE endpoints.
 *
 * Manages:
 * - The target item to delete (set from the table via openDelete)
 * - Modal open/close state
 * - Confirmation logic
 * - Callbacks onSuccess / onError
 *
 * Copied to the user's project alongside the generated connectors.
 */
import { ref, computed } from 'vue';

/**
 * @param composableFn  The generated delete composable, e.g. useAsyncDataDeletePet
 * @param options       Optional configuration
 */
export function useDeleteConnector(composableFn, options = {}) {
  // ── State ──────────────────────────────────────────────────────────────────

  const target = ref(null);
  const isOpen = ref(false);
  const loading = ref(false);
  const error = ref(null);

  // Callbacks — set by the developer or the generated component
  const onSuccess = ref(null);
  const onError = ref(null);

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Set the item to delete and open the confirmation modal.
   * Called by useListConnector.openDelete(row).
   */
  function setTarget(item) {
    target.value = item;
    isOpen.value = true;
  }

  /**
   * Cancel the delete operation — close modal and clear target.
   */
  function cancel() {
    isOpen.value = false;
    target.value = null;
    error.value = null;
  }

  /**
   * Confirm the delete — call the underlying composable with the target item.
   */
  async function confirm() {
    if (!target.value) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      // Pass the full target item; the generated composable extracts the id it needs
      const composable = composableFn(target.value);

      if (composable.execute) {
        await composable.execute();
      }

      const err = composable.error?.value;
      if (err) {
        throw err;
      }

      const deletedItem = target.value;
      isOpen.value = false;
      target.value = null;

      onSuccess.value?.(deletedItem);
    } catch (err) {
      error.value = err;
      onError.value?.(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const hasTarget = computed(() => target.value !== null);

  return {
    // State
    target,
    isOpen,
    loading,
    error,
    hasTarget,

    // Callbacks (developer-assignable)
    onSuccess,
    onError,

    // Actions
    setTarget,
    cancel,
    confirm,
  };
}
