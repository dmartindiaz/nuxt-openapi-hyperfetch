// @ts-nocheck
/**
 * Nuxt Runtime Helper - This file is copied to the generated output
 * It requires Nuxt 3 to be installed in the target project
 *
 * RAW VERSION: Returns full response including headers, status, and statusText
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
 * Response structure for Raw version
 * Includes data, headers, status, and statusText
 */
export interface RawResponse<T> {
  data: T;
  headers: Headers;
  status: number;
  statusText: string;
}

/**
 * Helper type to infer transformed data type for Raw responses
 * Transform only applies to the data property, not the entire response
 */
type MaybeTransformedRaw<T, Options> = Options extends { transform: (...args: any) => infer R }
  ? RawResponse<R>
  : Options extends { pick: ReadonlyArray<any> }
    ? RawResponse<any> // With nested paths, type inference is complex
    : RawResponse<T>;

/**
 * Options for useAsyncData Raw API requests.
 * Extends all native Nuxt useFetch options plus our custom callbacks, transform, and pick.
 * onSuccess receives data AND the full response (headers, status, statusText).
 */
export type ApiAsyncDataRawOptions<T> = Omit<BaseApiRequestOptions<T>, 'onSuccess'> &
  Omit<UseFetchOptions<T>, 'transform' | 'pick' | 'onSuccess'> & {
    /**
     * Called when the request succeeds — receives both data and the full response object.
     */
    onSuccess?: (
      data: T,
      response: { headers: Headers; status: number; statusText: string; url: string }
    ) => void | Promise<void>;
  };

/**
 * Generic wrapper for API calls using Nuxt's useAsyncData - RAW VERSION
 * Returns full response with headers and status information
 *
 * Supports:
 * - Lifecycle callbacks (onRequest, onSuccess with response, onError, onFinish)
 * - Request modification via onRequest return value
 * - Transform (applies only to data, not full response)
 * - Pick operations (applies only to data)
 * - Global headers from useApiHeaders or $getApiHeaders
 * - Watch pattern for reactive parameters
 */
export function useApiAsyncDataRaw<T>(
  key: string,
  url: string | (() => string),
  options?: ApiAsyncDataRawOptions<T>
) {
  const {
    method = 'GET',
    body,
    headers = {},
    params,
    baseURL,
    cacheKey,
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
    ...restOptions
  } = options || {};

  // Resolve base URL once at setup time (not inside fetchFn to avoid warning on every request)
  const resolvedBaseURL = baseURL || getGlobalBaseUrl();
  if (!resolvedBaseURL) {
    console.warn(
      '[nuxt-openapi-hyperfetch] No baseURL configured. Set runtimeConfig.public.apiBaseUrl in nuxt.config.ts or pass baseURL in options.'
    );
  }

  // Create reactive watch sources for callbacks
  const watchSources = [
    ...(typeof url === 'function' ? [url] : []),
    ...(body && typeof body === 'object' ? [() => body] : []),
    ...(params && typeof params === 'object' ? [() => params] : []),
  ];

  // Build a reactive cache key: composableName + resolved URL + serialized query params
  // This ensures distinct params produce distinct keys — preventing cache collisions
  const computedKey = () => {
    if (cacheKey) return cacheKey;
    const resolvedUrl = typeof url === 'function' ? url() : url;
    const resolvedParams = toValue(params);
    const paramsSuffix =
      resolvedParams && typeof resolvedParams === 'object' && Object.keys(resolvedParams).length > 0
        ? '-' + JSON.stringify(resolvedParams)
        : '';
    return `${key}-${resolvedUrl}${paramsSuffix}`;
  };

  // Fetch function for useAsyncData
  const fetchFn = async (): Promise<RawResponse<T>> => {
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

      // Make the request with $fetch.raw to get full response
      const response = await $fetch.raw<T>(modifiedContext.url, {
        method: modifiedContext.method,
        headers: modifiedContext.headers,
        body: modifiedContext.body,
        params: modifiedContext.params,
        ...(resolvedBaseURL ? { baseURL: resolvedBaseURL } : {}),
        ...restOptions,
      });

      // Extract data from response
      let data = response._data as T;

      // Apply pick if provided (only to data)
      if (pick) {
        data = applyPick(data, pick) as T;
      }

      // Apply transform if provided (only to data)
      if (transform) {
        data = transform(data);
      }

      // Construct the raw response object
      const rawResponse: RawResponse<T> = {
        data,
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      };

      // Call merged onSuccess callback with data and response context
      if (mergedCallbacks.onSuccess) {
        await mergedCallbacks.onSuccess(data, {
          headers: response.headers,
          status: response.status,
          statusText: response.statusText,
          url: finalUrl,
        });
      }

      return rawResponse;
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

  // Use Nuxt's useAsyncData with a computed key for proper cache isolation per params
  const result = useAsyncData<MaybeTransformedRaw<T, ApiAsyncDataRawOptions<T>>>(computedKey, fetchFn, {
    immediate,
    lazy,
    server,
    dedupe,
    watch: watchSources.length > 0 ? watchSources : undefined,
  });

  return result;
}
