// @ts-nocheck - This file runs in user's Nuxt project with different TypeScript config
/**
 * useGetConnector — Runtime connector for single-item GET endpoints.
 *
 * Uses $fetch directly (no useAsyncData) so:
 * - load(id) is truly imperative and awaitable
 * - Returns the fetched item from load()
 * - No SSR key registration, no cache interference
 *
 * Copied to the user's project alongside the generated connectors.
 */
import { ref, computed } from 'vue';
import { getGlobalBaseUrl, mergeCallbacks } from '../composables/shared/runtime/apiHelpers.js';

/**
 * @param urlFn   URL string or function that receives an id and returns the URL string.
 *                e.g. '/pet/me' or (id) => `/pet/${id}`
 * @param options Optional configuration
 */
export function useGetConnector(urlFn, options = {}) {
  const resolveUrl = (id) => (typeof urlFn === 'function' ? urlFn(id) : urlFn);
  const {
    fields = [],
    baseURL: baseURLOpt,
    onRequest: onRequestOpt,
    onSuccess: onSuccessOpt,
    onError: onErrorOpt,
    skipGlobalCallbacks,
  } = options;
  const baseURL = baseURLOpt || getGlobalBaseUrl();
  if (!baseURL) {
    console.warn('[useGetConnector] No baseURL configured. Set runtimeConfig.public.apiBaseUrl in nuxt.config.ts or pass baseURL in options.');
  }

  // Callbacks — developer-assignable (can also be passed as options)
  // Both the connector-level option and the per-operation registration are called.
  let _localOnSuccess = null;
  let _localOnError = null;

  // ── State ──────────────────────────────────────────────────────────────────

  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);


  // ── Actions ────────────────────────────────────────────────────────────────

  /**
   * Fetch a single item by ID.
   * Returns the fetched item so it can be awaited imperatively:
   *   const pet = await get.load(5)
   */
  async function load(id) {
    if (id === undefined || id === null) {
      console.warn('[useGetConnector] load() called with undefined/null id — request was not sent.');
      return;
    }
    loading.value = true;
    error.value = null;

    // Merge global + local callbacks (onRequest modifications, rule-based suppression)
    const url = resolveUrl(id);
    const merged = mergeCallbacks(url, 'GET', {
      onRequest: onRequestOpt,
      onSuccess: onSuccessOpt,
      onError: onErrorOpt,
    }, skipGlobalCallbacks);

    // onRequest hook — collects header/query modifications
    const requestMods = await merged.onRequest({ url, method: 'GET' });

    try {
      const result = await $fetch(url, {
        method: 'GET',
        ...(requestMods?.headers ? { headers: requestMods.headers } : {}),
        ...(requestMods?.query ? { query: requestMods.query } : {}),
        ...(baseURL ? { baseURL } : {}),
      });

      data.value = result;
      await merged.onSuccess(result, { operation: 'get' });
      _localOnSuccess?.(result);
      return result;
    } catch (err) {
      error.value = err;
      await merged.onError(err, { operation: 'get' });
      _localOnError?.(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Clear the current item from state.
   */
  function clear() {
    data.value = null;
    error.value = null;
  }

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    // State
    data,
    loading,
    error,
    fields: computed(() => fields),

    // Actions
    load,
    clear,

    // Callbacks
    onSuccess: (fn) => { _localOnSuccess = fn; },
    onError: (fn) => { _localOnError = fn; },
  };
}
