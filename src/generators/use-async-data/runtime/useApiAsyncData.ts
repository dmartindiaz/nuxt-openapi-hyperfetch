// @ts-nocheck
/**
 * Nuxt Runtime Helper - This file is copied to the generated output
 * It requires Nuxt 3 to be installed in the target project
 */
import { watch, ref, computed } from 'vue';
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
import {
  getGlobalApiPagination,
  buildPaginationRequest,
  extractPaginationMetaFromBody,
  extractPaginationMetaFromHeaders,
  unwrapDataKey,
  type PaginationState,
} from '../../shared/runtime/pagination.js';

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
 * Options for useAsyncData API requests with lifecycle callbacks.
 * Extends all native Nuxt useFetch options plus our custom callbacks, transform, and pick.
 * Native options like baseURL, method, body, headers, query, lazy, server, immediate, dedupe, etc. are all available.
 * watch: boolean (true = auto-watch reactive params, false = disable auto-refresh)
 */
export type ApiAsyncDataOptions<T> = BaseApiRequestOptions<T> &
  Omit<UseFetchOptions<T>, 'transform' | 'pick' | 'watch'> & {
    /**
     * Enable automatic refresh when reactive params/url change (default: true).
     * Set to false to disable auto-refresh entirely.
     */
    watch?: boolean;
  };

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
    watch: watchOption = true,
    paginated,
    initialPage,
    initialPerPage,
    paginationConfig,
    ...restOptions
  } = options || {};

  // ---------------------------------------------------------------------------
  // Pagination setup
  // ---------------------------------------------------------------------------
  const activePaginationConfig = paginationConfig ?? (paginated ? getGlobalApiPagination() : null);
  const page = ref<number>(initialPage ?? activePaginationConfig?.request.defaults.page ?? 1);
  const perPage = ref<number>(initialPerPage ?? activePaginationConfig?.request.defaults.perPage ?? 20);

  const paginationState = ref<PaginationState>({
    currentPage: page.value,
    totalPages: 0,
    total: 0,
    perPage: perPage.value,
  });

  // Resolve base URL once at setup time (not inside fetchFn to avoid warning on every request)
  const resolvedBaseURL = baseURL || getGlobalBaseUrl();
  if (!resolvedBaseURL) {
    console.warn(
      '[nuxt-openapi-hyperfetch] No baseURL configured. Set runtimeConfig.public.apiBaseUrl in nuxt.config.ts or pass baseURL in options.'
    );
  }

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
          // Add pagination refs so page/perPage changes trigger re-fetch
          ...(paginated ? [page, perPage] : []),
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
  const fetchFn = async () => {
    // Get URL value for merging callbacks
    const finalUrl = typeof url === 'function' ? url() : url;

    // Merge local and global callbacks
    const mergedCallbacks = mergeCallbacks(
      finalUrl,
      method,
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
          if (modifications.query !== undefined) {
            modifiedContext.params = {
              ...modifiedContext.params,
              ...modifications.query,
            };
          }
        }
      }

      // Make the request with $fetch — toValue() unrefs any Ref/ComputedRef
      // For paginated requests with metaSource:'headers', use $fetch.raw for header access
      let data: T;
      if (paginated && activePaginationConfig) {
        // Inject pagination params into the correct location
        const paginationPayload = buildPaginationRequest(page.value, perPage.value, activePaginationConfig);
        const paginatedQuery = { ...toValue(modifiedContext.params), ...paginationPayload.query };
        const paginatedBody = paginationPayload.body
          ? { ...(toValue(modifiedContext.body) ?? {}), ...paginationPayload.body }
          : toValue(modifiedContext.body);
        const paginatedHeaders = paginationPayload.headers
          ? { ...modifiedContext.headers, ...paginationPayload.headers }
          : modifiedContext.headers;

        if (activePaginationConfig.meta.metaSource === 'headers') {
          // Need raw fetch to access response headers
          const response = await $fetch.raw<T>(modifiedContext.url, {
            method: modifiedContext.method,
            headers: paginatedHeaders,
            body: paginatedBody,
            params: paginatedQuery,
            ...(resolvedBaseURL ? { baseURL: resolvedBaseURL } : {}),
            ...restOptions,
          });
          // Extract pagination meta from headers
          const meta = extractPaginationMetaFromHeaders(response.headers, activePaginationConfig);
          if (meta.total !== undefined) paginationState.value.total = meta.total;
          if (meta.totalPages !== undefined) paginationState.value.totalPages = meta.totalPages;
          if (meta.currentPage !== undefined) paginationState.value.currentPage = meta.currentPage;
          if (meta.perPage !== undefined) paginationState.value.perPage = meta.perPage;
          data = unwrapDataKey<T>(response._data, activePaginationConfig);
        } else {
          // metaSource: 'body' — extract after receiving the data
          const rawData = await $fetch<any>(modifiedContext.url, {
            method: modifiedContext.method,
            headers: paginatedHeaders,
            body: paginatedBody,
            params: paginatedQuery,
            ...(resolvedBaseURL ? { baseURL: resolvedBaseURL } : {}),
            ...restOptions,
          });
          const meta = extractPaginationMetaFromBody(rawData, activePaginationConfig);
          if (meta.total !== undefined) paginationState.value.total = meta.total;
          if (meta.totalPages !== undefined) paginationState.value.totalPages = meta.totalPages;
          if (meta.currentPage !== undefined) paginationState.value.currentPage = meta.currentPage;
          if (meta.perPage !== undefined) paginationState.value.perPage = meta.perPage;
          data = unwrapDataKey<T>(rawData, activePaginationConfig);
        }
      } else {
        data = await $fetch<T>(modifiedContext.url, {
          method: modifiedContext.method,
          headers: modifiedContext.headers,
          body: toValue(modifiedContext.body),
          params: toValue(modifiedContext.params),
          ...(resolvedBaseURL ? { baseURL: resolvedBaseURL } : {}),
          ...restOptions,
        });
      }

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

  // Use Nuxt's useAsyncData with a computed key for proper cache isolation per params
  const result = useAsyncData<MaybeTransformed<T, ApiAsyncDataOptions<T>>>(computedKey, fetchFn, {
    immediate,
    lazy,
    server,
    dedupe,
    watch: watchOption === false ? [] : watchSources,
  });

  if (!paginated) return result;

  // Pagination computed helpers
  const hasNextPage = computed(() => paginationState.value.currentPage < paginationState.value.totalPages);
  const hasPrevPage = computed(() => paginationState.value.currentPage > 1);

  const goToPage = (n: number) => { page.value = n; };
  const nextPage = () => { if (hasNextPage.value) goToPage(page.value + 1); };
  const prevPage = () => { if (hasPrevPage.value) goToPage(page.value - 1); };
  const setPerPage = (n: number) => { perPage.value = n; page.value = 1; };

  return {
    ...result,
    pagination: computed(() => ({
      ...paginationState.value,
      hasNextPage: hasNextPage.value,
      hasPrevPage: hasPrevPage.value,
      goToPage,
      nextPage,
      prevPage,
      setPerPage,
    })),
  };
}
