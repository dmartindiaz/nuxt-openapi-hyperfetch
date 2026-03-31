// @ts-nocheck - This file runs in user's Nuxt project with different TypeScript config
/**
 * useDeleteConnector — Runtime connector for DELETE endpoints.
 *
 * Uses $fetch directly (no useAsyncData) so:
 * - execute() always fires a real network request, no SSR cache interference
 * - Supports staging pattern (stage → confirm via ui) or direct execution
 *
 * Copied to the user's project alongside the generated connectors.
 */
import { ref, computed } from 'vue';
import { getGlobalBaseUrl, mergeCallbacks } from '../composables/shared/runtime/apiHelpers.js';

/**
 * @param idFn    Function that extracts the resource ID from a staged item.
 *                e.g. (item) => item.petId ?? item.id
 * @param urlFn   URL string or function that receives an id and returns the URL string.
 *                e.g. '/pet' (when ID is sent via body) or (id) => `/pet/${id}`
 * @param options Optional configuration
 */
export function useDeleteConnector(idFn, urlFn, options = {}) {
  const resolveUrl = (id) => (typeof urlFn === 'function' ? urlFn(id) : urlFn);
  const {
    baseURL: baseURLOpt,
    onRequest: onRequestOpt,
    onSuccess: onSuccessOpt,
    onError: onErrorOpt,
    onFinish: onFinishOpt,
    autoClose = true,
    skipGlobalCallbacks,
  } = options;

  const baseURL = baseURLOpt || getGlobalBaseUrl();
  if (!baseURL) {
    console.warn('[useDeleteConnector] No baseURL configured. Set runtimeConfig.public.apiBaseUrl in nuxt.config.ts or pass baseURL in options.');
  }

  // ── State ──────────────────────────────────────────────────────────────────

  const staged = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Callbacks — developer-assignable (can also be passed as options)
  // Both the connector-level option and the per-operation registration are called.
  let _localOnSuccess = null;
  let _localOnError = null;

  // ── UI state ───────────────────────────────────────────────────────────────

  const isOpen = ref(false);

  const ui = {
    isOpen,
    /**
     * Stage the item and open the confirmation UI (modal/drawer/etc).
     */
    open(item) {
      stage(item);
      isOpen.value = true;
    },
    /**
     * Cancel and close the confirmation UI.
     */
    close() {
      cancel();
      isOpen.value = false;
    },
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const hasStaged = computed(() => staged.value !== null);

  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Stage an item for deletion without opening any UI.
   * Useful when you want to control the UI yourself.
   */
  function stage(item) {
    staged.value = item;
  }

  /**
   * Clear the staged item and reset error state.
   */
  function cancel() {
    staged.value = null;
    error.value = null;
  }

  /**
   * Execute the DELETE request.
   * @param item Optional — if provided, uses this item instead of staged.
   *             Allows direct deletion without staging: await del.execute(row)
   */
  async function execute(item) {
    const target = item ?? staged.value;

    if (!target) {
      console.warn('[useDeleteConnector] execute() called with no item and nothing staged — request was not sent. Call stage(item) or pass the item directly to execute(item).');
      return;
    }

    const id = idFn(target);
    if (id === undefined || id === null) {
      console.warn('[useDeleteConnector] idFn returned undefined/null — could not resolve resource ID. Request was not sent.', { target });
      return;
    }
    const url = resolveUrl(id);

    loading.value = true;
    error.value = null;

    // Merge global + local callbacks (onRequest modifications, rule-based suppression)
    const merged = mergeCallbacks(url, 'DELETE', {
      onRequest: onRequestOpt,
      onSuccess: onSuccessOpt,
      onError: onErrorOpt,
      onFinish: onFinishOpt,
    }, skipGlobalCallbacks);

    // onRequest hook — collects header/body/query modifications
    const requestMods = await merged.onRequest({ url, method: 'DELETE' });

    try {
      await $fetch(url, {
        method: 'DELETE',
        ...(requestMods?.headers ? { headers: requestMods.headers } : {}),
        ...(requestMods?.query ? { query: requestMods.query } : {}),
        ...(baseURL ? { baseURL } : {}),
      });

      const deletedItem = target;

      await merged.onSuccess(deletedItem, { operation: 'delete' });
      _localOnSuccess?.(deletedItem);
      cancel();

      if (autoClose) ui.close();

      await merged.onFinish({ url, method: 'DELETE', success: true });
    } catch (err) {
      error.value = err;
      await merged.onError(err, { operation: 'delete' });
      _localOnError?.(err);

      await merged.onFinish({ url, method: 'DELETE', error: err, success: false });

      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    // State
    staged,
    hasStaged,
    loading,
    error,

    // Actions
    stage,
    cancel,
    execute,
    refresh: execute,

    // Callbacks
    onSuccess: (fn) => { _localOnSuccess = fn; },
    onError: (fn) => { _localOnError = fn; },

    // UI
    ui,
  };
}
