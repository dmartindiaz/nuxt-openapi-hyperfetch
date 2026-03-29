// @ts-nocheck - This file runs in user's Nuxt project with different TypeScript config
/**
 * zod-error-merger — Merge Zod fieldErrors with per-field error message overrides.
 *
 * Priority (highest → lowest):
 *   3. config.fields[fieldName].errors[zodCode]   — per-field, per-code override
 *   2. z.setErrorMap()                            — global translation (set by the developer)
 *   1. Zod defaults                               — built-in English messages
 *
 * This function handles priority 3 only. Priority 2 is handled automatically by Zod
 * when the developer sets z.setErrorMap() in their plugins/zod-i18n.ts.
 *
 * Copied to the user's project alongside the generated connectors.
 */

/**
 * Map Zod issue codes to friendlier config key names.
 * The developer uses these keys in config.fields[name].errors:
 *
 *   errors: {
 *     required: 'Name is required',
 *     min:      'At least 1 character',
 *     max:      'Max 100 characters',
 *     email:    'Invalid email',
 *     enum:     'Select a valid option',
 *   }
 */
const ZOD_CODE_TO_CONFIG_KEY = {
  too_small: 'min',
  too_big: 'max',
  invalid_type: 'required', // most common: field is undefined/null
  invalid_enum_value: 'enum',
  invalid_string: 'format',
};

/**
 * Convert Zod's flatten().fieldErrors to Record<string, string>,
 * merging optional per-field message overrides from the component config.
 *
 * @param fieldErrors  Output of zodResult.error.flatten().fieldErrors
 *                     Shape: { fieldName: string[] }
 * @param errorConfig  Optional per-field error config from index.ts
 *                     Shape: { fieldName: { required?: string, min?: string, ... } }
 */
export function mergeZodErrors(fieldErrors, errorConfig = {}) {
  const result = {};

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (!messages || messages.length === 0) {
      continue;
    }

    // The first message is the most relevant one
    const defaultMessage = messages[0];

    // Check if there's a config override for this field
    const fieldConfig = errorConfig[field];
    if (!fieldConfig) {
      result[field] = defaultMessage;
      continue;
    }

    // Try to map the Zod message to a config key.
    // We check for simple substrings in the Zod message to identify the code.
    const configMessage = resolveConfigMessage(defaultMessage, fieldConfig);
    result[field] = configMessage ?? defaultMessage;
  }

  return result;
}

/**
 * Try to find a matching override in fieldConfig based on the Zod message content.
 * Returns the override string, or null if no match found.
 */
function resolveConfigMessage(zodMessage, fieldConfig) {
  if (!fieldConfig || typeof fieldConfig !== 'object') {
    return null;
  }

  // Direct key match: developer can use zod code names directly
  // e.g. errors.too_small, errors.invalid_type
  for (const [zodCode, configKey] of Object.entries(ZOD_CODE_TO_CONFIG_KEY)) {
    if (fieldConfig[zodCode]) {
      // Check if Zod message suggests this error type
      if (messageMatchesCode(zodMessage, zodCode)) {
        return fieldConfig[zodCode];
      }
    }
    // Also support friendly key names: errors.min, errors.required, etc.
    if (fieldConfig[configKey]) {
      if (messageMatchesCode(zodMessage, zodCode)) {
        return fieldConfig[configKey];
      }
    }
  }

  // Fallback: if developer set errors.required and Zod says "Required"
  if (fieldConfig.required && /required|undefined|null/i.test(zodMessage)) {
    return fieldConfig.required;
  }

  return null;
}

/**
 * Heuristic: does the Zod default message suggest a certain error code?
 */
function messageMatchesCode(message, zodCode) {
  const patterns = {
    too_small: /at least|minimum|must contain at least|min/i,
    too_big: /at most|maximum|must contain at most|max/i,
    invalid_type: /required|expected|received undefined|null/i,
    invalid_enum_value: /invalid enum|expected one of/i,
    invalid_string: /invalid|email|url|uuid|datetime/i,
  };

  return patterns[zodCode]?.test(message) ?? false;
}
