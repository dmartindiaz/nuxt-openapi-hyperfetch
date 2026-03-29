// @ts-nocheck - This file runs in user's Nuxt project with different TypeScript config
/**
 * useFormConnector — Runtime connector for create/update form endpoints.
 *
 * Responsibilities:
 * - Hold the reactive form model
 * - Validate with a Zod schema (generated at code-gen time) on submit
 * - Merge Zod error messages with per-field overrides from config
 * - Submit the validated data via the provided useAsyncData composable
 * - Optionally pre-fill from a useDetailConnector (loadWith option)
 *
 * Copied to the user's project alongside the generated connectors.
 */
import { ref, computed, watch } from 'vue';
import { mergeZodErrors } from './zod-error-merger.js';

/**
 * @param composableFn   The generated mutation composable, e.g. useAsyncDataCreatePet
 * @param options        { schema, fields, loadWith?, errorConfig? }
 */
export function useFormConnector(composableFn, options = {}) {
  const { schema, fields = [], loadWith = null, errorConfig = {} } = options;

  // ── Form state ─────────────────────────────────────────────────────────────

  const model = ref({});
  const errors = ref({});
  const loading = ref(false);
  const submitError = ref(null);
  const submitted = ref(false);

  // Callbacks — set by the developer or the generated component
  const onSuccess = ref(null);
  const onError = ref(null);

  // ── Pre-fill from detail connector ────────────────────────────────────────

  if (loadWith) {
    // When the detail item changes (e.g. user clicks "Edit"), pre-fill the model
    watch(
      () => loadWith.item?.value,
      (newItem) => {
        if (newItem) {
          setValues(newItem);
        }
      },
      { immediate: true }
    );
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  function setValues(data) {
    model.value = { ...model.value, ...data };
  }

  function reset() {
    model.value = {};
    errors.value = {};
    submitError.value = null;
    submitted.value = false;
  }

  async function submit() {
    submitted.value = true;

    // 1. Zod validation (if schema provided)
    if (schema) {
      const result = schema.safeParse(model.value);

      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        errors.value = mergeZodErrors(fieldErrors, errorConfig);
        return;
      }

      // Clear previous errors on successful validation
      errors.value = {};
    }

    // 2. Call the underlying composable
    loading.value = true;
    submitError.value = null;

    try {
      // The mutation composable accepts the model as its payload
      const composable = composableFn(model.value);

      // Wait for the async data to resolve
      if (composable.execute) {
        await composable.execute();
      }

      const data = composable.data?.value;
      const err = composable.error?.value;

      if (err) {
        throw err;
      }

      onSuccess.value?.(data);
    } catch (err) {
      submitError.value = err;
      onError.value?.(err);
    } finally {
      loading.value = false;
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const isValid = computed(() => {
    if (!schema) return true;
    return schema.safeParse(model.value).success;
  });

  const hasErrors = computed(() => Object.keys(errors.value).length > 0);

  return {
    // State
    model,
    errors,
    loading,
    submitError,
    submitted,
    isValid,
    hasErrors,
    fields: computed(() => fields),

    // Callbacks (developer-assignable)
    onSuccess,
    onError,

    // Actions
    submit,
    reset,
    setValues,
  };
}
