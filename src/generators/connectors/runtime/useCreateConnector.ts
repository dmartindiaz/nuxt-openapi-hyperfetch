// @ts-nocheck - This file runs in user's Nuxt project with different TypeScript config
/**
 * useCreateConnector — Runtime connector for POST endpoints.
 *
 * Uses $fetch directly (no useAsyncData) so:
 * - execute() always fires a real network request, no SSR cache interference
 * - Can be called multiple times (create multiple items)
 * - Validates with Zod before sending
 *
 * Copied to the user's project alongside the generated connectors.
 */
import { ref, computed } from 'vue';
import { mergeZodErrors } from './zod-error-merger.js';
import { getGlobalBaseUrl, mergeCallbacks } from '../composables/shared/runtime/apiHelpers.js';

/**
 * @param url     The endpoint URL string. e.g. '/pet'
 * @param options Configuration: schema, fields, method, baseURL, callbacks, etc.
 */
export function useCreateConnector(url, options = {}) {
  const {
    schema: baseSchema,
    schemaOverride,
    fields = [],
    method = 'POST',
    baseURL: baseURLOpt,
    errorConfig = {},
    onRequest: onRequestOpt,
    onSuccess: onSuccessOpt,
    onError: onErrorOpt,
    onFinish: onFinishOpt,
    autoClose = true,
    autoReset = false,
    skipGlobalCallbacks,
  } = options;

  const baseURL = baseURLOpt || getGlobalBaseUrl();
  if (!baseURL) {
    console.warn('[useCreateConnector] No baseURL configured. Set runtimeConfig.public.apiBaseUrl in nuxt.config.ts or pass baseURL in options.');
  }

  // Resolve active schema: schemaOverride(base) / schemaOverride / base / none
  const schema = schemaOverride
    ? typeof schemaOverride === 'function'
      ? schemaOverride(baseSchema)
      : schemaOverride
    : baseSchema;

  if (schemaOverride && !schema) {
    console.warn('[useCreateConnector] schemaOverride resolved to undefined — validation will be skipped. Check your schemaOverride function returns a valid Zod schema.');
  }

  // ── Form state ─────────────────────────────────────────────────────────────

  const model = ref({});
  const errors = ref({});
  const loading = ref(false);
  const error = ref(null);
  const submitted = ref(false);

  // Callbacks — developer-assignable (can also be passed as options)
  // Both the connector-level option and the per-operation registration are called.
  let _localOnSuccess = null;
  let _localOnError = null;

  // ── UI state ───────────────────────────────────────────────────────────────

  const isOpen = ref(false);

  const ui = {
    isOpen,
    open() {
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
  }

  /**
   * Validate with Zod (if schema provided) then POST via $fetch.
   * @param data Optional payload override. Falls back to model.value.
   * @returns The response data, or undefined if validation failed.
   */
  async function execute(data) {
    submitted.value = true;
    const payload = data ?? model.value;

    // 1. Zod validation
    if (schema) {
      const result = schema.safeParse(payload);
      if (!result.success) {
        errors.value = mergeZodErrors(result.error.flatten().fieldErrors, errorConfig);
        console.error('[useCreateConnector] Validation failed — request was not sent.', errors.value);
        return undefined;
      }
      errors.value = {};
    }

    // 2. $fetch POST
    loading.value = true;
    error.value = null;

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

      await merged.onSuccess(result, { operation: 'create' });
      _localOnSuccess?.(result);

      if (autoClose) ui.close();
      if (autoReset) reset();

      await merged.onFinish({ url, method, data: result, success: true });

      return result;
    } catch (err) {
      error.value = err;
      await merged.onError(err, { operation: 'create' });
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

    // Actions
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
