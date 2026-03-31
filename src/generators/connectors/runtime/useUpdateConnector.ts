// @ts-nocheck - This file runs in user's Nuxt project with different TypeScript config
/**
 * useUpdateConnector — Runtime connector for PUT/PATCH endpoints.
 *
 * Uses $fetch directly (no useAsyncData) so:
 * - execute() always fires a real network request, no SSR cache interference
 * - load(id) fetches the current item to pre-fill the form
 * - ui.open(item) pre-fills from an existing row without an extra fetch
 *
 * Copied to the user's project alongside the generated connectors.
 */
import { ref, computed } from 'vue';
import { mergeZodErrors } from './zod-error-merger.js';
import { getGlobalBaseUrl, mergeCallbacks } from '../composables/shared/runtime/apiHelpers.js';

/**
 * @param urlFn   URL string or function that receives an id and returns the URL string.
 *                e.g. '/pet' (when ID is sent via body) or (id) => `/pet/${id}`
 * @param options Configuration: schema, fields, method, baseURL, callbacks, etc.
 */
export function useUpdateConnector(urlFn, options = {}) {
  const resolveUrl = (id) => (typeof urlFn === 'function' ? urlFn(id) : urlFn);
  const {
    schema: baseSchema,
    schemaOverride,
    fields = [],
    method = 'PUT',
    baseURL: baseURLOpt,
    errorConfig = {},
    onRequest: onRequestOpt,
    onSuccess: onSuccessOpt,
    onError: onErrorOpt,
    onFinish: onFinishOpt,
    autoClose = true,
    skipGlobalCallbacks,
  } = options;

  const baseURL = baseURLOpt || getGlobalBaseUrl();
  if (!baseURL) {
    console.warn('[useUpdateConnector] No baseURL configured. Set runtimeConfig.public.apiBaseUrl in nuxt.config.ts or pass baseURL in options.');
  }

  // Resolve active schema: schemaOverride(base) / schemaOverride / base / none
  const schema = schemaOverride
    ? typeof schemaOverride === 'function'
      ? schemaOverride(baseSchema)
      : schemaOverride
    : baseSchema;

  if (schemaOverride && !schema) {
    console.warn('[useUpdateConnector] schemaOverride resolved to undefined — validation will be skipped. Check your schemaOverride function returns a valid Zod schema.');
  }

  // ── Form state ─────────────────────────────────────────────────────────────

  const model = ref({});
  const errors = ref({});
  const loading = ref(false);
  const error = ref(null);
  const submitted = ref(false);
  const targetId = ref(null);

  // Callbacks — developer-assignable (can also be passed as options)
  // Both the connector-level option and the per-operation registration are called.
  let _localOnSuccess = null;
  let _localOnError = null;

  // ── UI state ───────────────────────────────────────────────────────────────

  const isOpen = ref(false);

  const ui = {
    isOpen,
    /**
     * Open the update form.
     * @param item If provided, pre-fills the model immediately (no extra fetch needed).
     *             Typically pass the row object from the table.
     */
    open(item) {
      if (item) {
        setValues(item);
      }
      isOpen.value = true;
    },
    close() {
      isOpen.value = false;
    },
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const isValid = computed(() => {
    if (!schema) return true;
    return schema.safeParse(model.value).success;
  });

  const hasErrors = computed(() => Object.keys(errors.value).length > 0);

  // ── Actions ────────────────────────────────────────────────────────────────

  function setValues(data) {
    model.value = { ...model.value, ...data };
  }

  function setField(key, value) {
    model.value = { ...model.value, [key]: value };
  }

  function reset() {
    model.value = {};
    errors.value = {};
    error.value = null;
    submitted.value = false;
    targetId.value = null;
  }

  /**
   * Fetch the current item by ID and pre-fill the form model.
   * Use this when you need fresh data from the server before editing.
   * If the row data from the table is sufficient, use ui.open(item) instead.
   */
  async function load(id) {
    if (id === undefined || id === null) {
      console.warn('[useUpdateConnector] load() called with undefined/null id — request was not sent.');
      return;
    }
    loading.value = true;
    error.value = null;

    const loadUrl = resolveUrl(id);
    const mergedGet = mergeCallbacks(loadUrl, 'GET', {
      onError: onErrorOpt,
    }, skipGlobalCallbacks);
    const loadMods = await mergedGet.onRequest({ url: loadUrl, method: 'GET' });

    try {
      const result = await $fetch(loadUrl, {
        method: 'GET',
        ...(loadMods?.headers ? { headers: loadMods.headers } : {}),
        ...(loadMods?.query ? { query: loadMods.query } : {}),
        ...(baseURL ? { baseURL } : {}),
      });

      targetId.value = id;
      setValues(result);
    } catch (err) {
      error.value = err;
      await mergedGet.onError(err, { operation: 'update' });
      _localOnError?.(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Validate with Zod (if schema provided) then PUT/PATCH via $fetch.
   * @param id   The resource ID to update.
   * @param data Optional payload override. Falls back to model.value.
   * @returns The response data, or undefined if validation failed.
   */
  async function execute(id, data) {
    submitted.value = true;
    const payload = data ?? model.value;

    // 1. Zod validation
    if (schema) {
      const result = schema.safeParse(payload);
      if (!result.success) {
        errors.value = mergeZodErrors(result.error.flatten().fieldErrors, errorConfig);
        console.error('[useUpdateConnector] Validation failed — request was not sent.', errors.value);
        return undefined;
      }
      errors.value = {};
    }

    // 2. $fetch PUT/PATCH
    if (id === undefined || id === null) {
      console.warn('[useUpdateConnector] execute() called with undefined/null id — request was not sent.');
      return undefined;
    }
    loading.value = true;
    error.value = null;

    const url = resolveUrl(id);

    // Merge global + local callbacks (onRequest modifications, rule-based suppression)
    const merged = mergeCallbacks(url, method, {
      onRequest: onRequestOpt,
      onSuccess: onSuccessOpt,
      onError: onErrorOpt,
      onFinish: onFinishOpt,
    }, skipGlobalCallbacks);

    // onRequest hook — collects header/body/query modifications from global rules and local option
    const requestMods = await merged.onRequest({ url, method, body: payload });

    try {
      const result = await $fetch(url, {
        method,
        body: requestMods?.body ?? payload,
        ...(requestMods?.headers ? { headers: requestMods.headers } : {}),
        ...(requestMods?.query ? { query: requestMods.query } : {}),
        ...(baseURL ? { baseURL } : {}),
      });

      await merged.onSuccess(result, { operation: 'update' });
      _localOnSuccess?.(result);

      if (autoClose) ui.close();

      await merged.onFinish({ url, method, data: result, success: true });

      return result;
    } catch (err) {
      error.value = err;
      await merged.onError(err, { operation: 'update' });
      _localOnError?.(err);

      await merged.onFinish({ url, method, error: err, success: false });

      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    // Form state
    model,
    errors,
    loading,
    error,
    submitted,
    isValid,
    hasErrors,
    fields: computed(() => fields),
    targetId,

    // Actions
    load,
    execute,
    refresh: execute,
    reset,
    setValues,
    setField,

    // Callbacks
    onSuccess: (fn) => { _localOnSuccess = fn; },
    onError: (fn) => { _localOnError = fn; },

    // UI
    ui,
  };
}
