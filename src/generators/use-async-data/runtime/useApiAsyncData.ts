// @ts-nocheck
/**
 * Nuxt Runtime Helper - This file is copied to the generated output
 * It requires Nuxt 3 to be installed in the target project
 */
import { watch } from 'vue';
import {
  getGlobalHeaders,
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
 * Extended options specific to useAsyncData
 */
export interface ApiAsyncDataOptions<T> extends BaseApiRequestOptions<T> {
  /**
   * Whether to fetch data immediately on mount (default: true)
   */
  immediate?: boolean;

  /**
   * Lazy mode: don't block navigation (default: false)
   */
  lazy?: boolean;

  /**
   * Server-side rendering mode (default: true)
   */
  server?: boolean;

  /**
   * Deduplicate requests with the same key (default: 'cancel')
   */
  dedupe?: 'cancel' | 'defer';

  /**
   * Disable automatic refresh when reactive params change.
   * Set to false to prevent re-fetching when params/url refs update.
   * @default true
   */
  watch?: boolean;
}

/**
 * Generic wrapper for API calls using Nuxt's useAsyncData
 * Supports:
 * - Lifecycle callbacks (onRequest, onSuccess, onError, onFinish)
 * - Request modification via onRequest return value
 * - Transform and pick operations
 * - Global headers from useApiHeaders or $getApiHeaders
 * - Watch pattern for reactive parameters
 */
export function useApiAsyncData<T>(
  key: string,
  url: string | (() => string),
  options?: ApiAsyncDataOptions<T>
) {
  const {
    method = 'GET',
    body,
    headers = {},
    params,
    transform,
    pick,
    onRequest,
    onSuccess,
    onError,
    onFinish,
    skipGlobalCallbacks,
    immediate = true,
    lazy = false,
    server = true,
    dedupe = 'cancel',
    watch: watchOption = true,
    ...restOptions
  } = options || {};

  // Create reactive watch sources — use refs/computeds directly so Vue can track them
  // watchOption: false disables auto-refresh entirely
  const watchSources =
    watchOption === false
      ? []
      : [
          ...(typeof url === 'function' ? [url] : []),
          ...(body ? (isRef(body) ? [body] : typeof body === 'object' ? [() => body] : []) : []),
          ...(params
            ? isRef(params)
              ? [params]
              : typeof params === 'object'
                ? [() => params]
                : []
            : []),
        ];

  // Fetch function for useAsyncData
  const fetchFn = async () => {
    // Get URL value for merging callbacks
    const finalUrl = typeof url === 'function' ? url() : url;

    // Merge local and global callbacks
    const mergedCallbacks = mergeCallbacks(
      finalUrl,
      { onRequest, onSuccess, onError, onFinish },
      skipGlobalCallbacks
    );

    try {
      // Get global headers
      const globalHeaders = getGlobalHeaders();

      // Prepare request context
      const requestContext: RequestContext = {
        url: finalUrl,
        method: method as any,
        headers: { ...globalHeaders, ...headers },
        body,
        params,
      };

      // Execute merged onRequest callback and potentially modify request
      const modifiedContext = { ...requestContext };
      if (mergedCallbacks.onRequest) {
        const result = await mergedCallbacks.onRequest(requestContext);
        // If onRequest returns modifications, apply them
        if (result && typeof result === 'object') {
          const modifications = result as ModifiedRequestContext;
          if (modifications.body !== undefined) {
            modifiedContext.body = modifications.body;
          }
          if (modifications.headers !== undefined) {
            modifiedContext.headers = {
              ...modifiedContext.headers,
              ...modifications.headers,
            };
          }
          if (modifications.params !== undefined) {
            modifiedContext.params = {
              ...modifiedContext.params,
              ...modifications.params,
            };
          }
        }
      }

      // Make the request with $fetch — toValue() unrefs any Ref/ComputedRef
      let data = await $fetch<T>(modifiedContext.url, {
        method: modifiedContext.method,
        headers: modifiedContext.headers,
        body: toValue(modifiedContext.body),
        params: toValue(modifiedContext.params),
        ...restOptions,
      });

      // Apply pick if provided
      if (pick) {
        data = applyPick(data, pick) as T;
      }

      // Apply transform if provided
      if (transform) {
        data = transform(data);
      }

      // Call merged onSuccess callback
      if (mergedCallbacks.onSuccess) {
        await mergedCallbacks.onSuccess(data, {
          url: finalUrl,
          method,
          headers: modifiedContext.headers,
        });
      }

      return data;
    } catch (error: any) {
      // Call merged onError callback
      if (mergedCallbacks.onError) {
        await mergedCallbacks.onError(error, { url: finalUrl, method, headers });
      }
      throw error;
    } finally {
      // Call merged onFinish callback
      if (mergedCallbacks.onFinish) {
        await mergedCallbacks.onFinish({
          url: finalUrl,
          method,
          headers: { ...getGlobalHeaders(), ...headers },
        });
      }
    }
  };

  // Use Nuxt's useAsyncData
  const result = useAsyncData<MaybeTransformed<T, ApiAsyncDataOptions<T>>>(key, fetchFn, {
    immediate,
    lazy,
    server,
    dedupe,
    watch: watchSources.length > 0 ? watchSources : undefined,
  });

  return result;
}
