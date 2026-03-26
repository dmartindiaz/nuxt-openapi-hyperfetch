// @ts-nocheck
/**
 * Nuxt Runtime Helper - This file is copied to the generated output
 * It requires Nuxt 3 to be installed in the target project
 */
import { watch } from 'vue';
import type { UseFetchOptions } from '#app';
import {
  getGlobalHeaders,
  getGlobalBaseUrl,
  applyPick,
  applyRequestModifications,
  mergeCallbacks,
  type RequestContext,
  type ModifiedRequestContext,
  type FinishContext,
  type ApiRequestOptions as BaseApiRequestOptions,
} from '../../shared/runtime/apiHelpers.js';

/**
 * Helper type to infer transformed data type
 * If transform is provided, infer its return type
 * If pick is provided, return partial object (type inference for nested paths is complex)
 * Otherwise, return original type
 */
type MaybeTransformed<T, Options> = Options extends { transform: (...args: any) => infer R }
  ? R
  : Options extends { pick: ReadonlyArray<any> }
    ? any // With nested paths, type inference is complex, so we use any
    : T;

/**
 * Options for useFetch API requests with lifecycle callbacks.
 * Extends all native Nuxt useFetch options plus our custom callbacks, transform, and pick.
 * Native options like baseURL, method, body, headers, query, lazy, server, immediate, etc. are all available.
 */
export type ApiRequestOptions<T = any> = BaseApiRequestOptions<T> & Omit<UseFetchOptions<T>, 'transform' | 'pick'>;

/**
 * Enhanced useFetch wrapper with lifecycle callbacks and request interception
 *
 * @example
 * ```typescript
 * // Basic usage
 * const { data, error } = useApiRequest<Pet>('/api/pets', {
 *   method: 'POST',
 *   body: { name: 'Max' },
 * });
 *
 * // With transform (type is inferred!)
 * const { data } = useApiRequest<Pet>('/api/pets/1', {
 *   transform: (pet) => ({ displayName: pet.name, available: pet.status === 'available' })
 * });
 * // data is Ref<{ displayName: string, available: boolean }>
 *
 * // With pick (simple fields)
 * const { data } = useApiRequest<Pet>('/api/pets/1', {
 *   pick: ['id', 'name'] as const
 * });
 *
 * // With pick (nested dot notation)
 * const { data } = useApiRequest('/api/user', {
 *   pick: ['person.name', 'person.email', 'status']
 * });
 * // Result: { person: { name: '...', email: '...' }, status: '...' }
 *
 * // With callbacks
 * const { data } = useApiRequest<Pet>('/api/pets', {
 *   onRequest: (ctx) => ({ headers: { 'Authorization': `Bearer ${token}` } }),
 *   onSuccess: (pet) => console.log('Got pet:', pet),
 *   onError: (err) => console.error('Failed:', err),
 * });
 * ```
 */
export function useApiRequest<T = any, Options extends ApiRequestOptions<T> = ApiRequestOptions<T>>(
  url: string | (() => string),
  options?: Options
) {
  const {
    onRequest,
    onSuccess,
    onError,
    onFinish,
    skipGlobalCallbacks,
    transform,
    pick,
    ...fetchOptions
  } = options || {};

  // Resolve URL value for callbacks and pattern matching
  const urlValue = typeof url === 'function' ? url() : url;

  // Merge local and global callbacks
  const mergedCallbacks = mergeCallbacks(
    urlValue,
    { onRequest, onSuccess, onError, onFinish },
    skipGlobalCallbacks
  );

  // Apply global headers configuration (from composable or plugin)
  const modifiedOptions = { ...fetchOptions };
  const globalHeaders = getGlobalHeaders();
  if (Object.keys(globalHeaders).length > 0) {
    modifiedOptions.headers = {
      ...globalHeaders,
      ...modifiedOptions.headers, // User headers override global headers
    };
  }

  // Apply global base URL from runtimeConfig.public.apiBaseUrl (if not already set per-composable)
  if (!modifiedOptions.baseURL) {
    modifiedOptions.baseURL = getGlobalBaseUrl();
  }
  if (!modifiedOptions.baseURL) {
    console.warn(
      '[nuxt-openapi-hyperfetch] No baseURL configured. Set runtimeConfig.public.apiBaseUrl in nuxt.config.ts or pass baseURL in options.'
    );
  }

  // Pass onRequest to useFetch's native interceptor so async callbacks are
  // properly awaited by ofetch before the request is sent.
  if (mergedCallbacks.onRequest) {
    const existingOnRequest = modifiedOptions.onRequest;
    modifiedOptions.onRequest = async ({ options: fetchOpts }) => {
      // Build context from the live options at request time
      const requestContext: RequestContext = {
        url: urlValue,
        method: String(fetchOpts.method || modifiedOptions.method || 'GET'),
        body: fetchOpts.body,
        headers: fetchOpts.headers as Record<string, string> | undefined,
        query: fetchOpts.query,
      };
      try {
        const modifications = await mergedCallbacks.onRequest!(requestContext);
        if (modifications && typeof modifications === 'object') {
          applyRequestModifications(fetchOpts as Record<string, any>, modifications);
        }
      } catch (error) {
        console.error('Error in merged onRequest callback:', error);
      }
      // Chain any pre-existing onRequest interceptor
      if (existingOnRequest) {
        await (existingOnRequest as Function)({ options: fetchOpts });
      }
    };
  }

  // Make the actual request using Nuxt's useFetch
  const result = useFetch<T>(url, modifiedOptions);

  // Create a ref for transformed data
  type TransformedType = MaybeTransformed<T, Options>;
  const transformedData = ref<TransformedType | null>(null);

  // Track if callbacks have been executed to avoid duplicates
  let successExecuted = false;
  let errorExecuted = false;

  // Watch for changes in data, error, and pending states
  watch(
    () => [result.data.value, result.error.value, result.pending.value] as const,
    async ([data, error, pending], prev) => {
      const [prevData, prevError, prevPending] = prev ?? [undefined, undefined, undefined];
      // Apply transformations when data arrives
      if (data && data !== prevData) {
        let processedData: any = data;

        // Step 1: Apply pick if specified
        if (pick) {
          processedData = applyPick(processedData, pick);
        }

        // Step 2: Apply transform if specified
        if (transform) {
          try {
            processedData = transform(processedData);
          } catch (err) {
            console.error('Error in transform function:', err);
          }
        }

        // Update transformed data ref
        transformedData.value = processedData as TransformedType;

        // onSuccess - when data arrives and no error (using merged callback)
        // NOTE: data !== null/undefined check instead of truthy to handle 0, false, ''
        if (data != null && !error && !successExecuted && mergedCallbacks.onSuccess) {
          successExecuted = true;
          try {
            await mergedCallbacks.onSuccess(processedData);
          } catch (err) {
            console.error('Error in merged onSuccess callback:', err);
          }
        }
      }

      // onError - when an error occurs (using merged callback)
      if (error && error !== prevError && !errorExecuted && mergedCallbacks.onError) {
        errorExecuted = true;
        try {
          await mergedCallbacks.onError(error);
        } catch (err) {
          console.error('Error in merged onError callback:', err);
        }
      }

      // onFinish - when request completes (was pending, now not) (using merged callback)
      if (prevPending && !pending && mergedCallbacks.onFinish) {
        const finishContext: FinishContext<TransformedType> = {
          data: transformedData.value ?? undefined,
          error: error ?? undefined,
          success: data != null && !error,
        };

        try {
          await mergedCallbacks.onFinish(finishContext);
        } catch (err) {
          console.error('Error in merged onFinish callback:', err);
        }
      }
    },
    { immediate: true }
  );

  // Return result with transformed data
  return {
    ...result,
    data: transformedData as Ref<TransformedType | null>,
  };
}
