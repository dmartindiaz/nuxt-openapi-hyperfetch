// @ts-nocheck - This file runs in user's Nuxt project with different TypeScript config
/**
 * Pagination Helpers - Used by both useFetch and useAsyncData wrappers
 * Handles global pagination config, request param injection, and response meta extraction.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Describes how to read pagination metadata from the backend response.
 *
 * - `metaSource: 'headers'` — metadata comes from HTTP response headers
 * - `metaSource: 'body'`    — metadata is nested inside the response JSON
 */
export interface PaginationMetaConfig {
  /**
   * Where to read pagination metadata from.
   * - 'headers': from HTTP response headers (requires raw fetch)
   * - 'body': from the response JSON body (default)
   */
  metaSource: 'headers' | 'body';

  /**
   * Field names (header names or dot-notation body paths) for each pagination value.
   *
   * Examples for headers:   'X-Total-Count', 'X-Total-Pages', 'X-Page', 'X-Per-Page'
   * Examples for body:      'meta.total', 'pagination.totalPages', 'page', 'perPage'
   */
  fields: {
    /** Total number of items across all pages */
    total: string;
    /** Total number of pages */
    totalPages: string;
    /** Current page number */
    currentPage: string;
    /** Number of items per page */
    perPage: string;
    /**
     * If the actual data array lives inside a nested key (e.g. response.data),
     * set this to that key name so the composable unwraps it automatically.
     * Leave undefined if the response root IS the array.
     */
    dataKey?: string;
  };
}

/**
 * Describes how to send pagination parameters to the backend.
 */
export interface PaginationRequestConfig {
  /**
   * Where to attach the pagination parameters.
   * - 'query':   as URL query string params (GET default, recommended)
   * - 'body':    merged into request body JSON (for POST-as-search APIs)
   * - 'headers': as request headers
   */
  sendAs: 'query' | 'body' | 'headers';

  /**
   * Mapping from our internal names to your backend's parameter names.
   * @example { page: 'page', perPage: 'limit' }   // ?page=1&limit=20
   * @example { page: 'p', perPage: 'per_page' }   // ?p=1&per_page=20
   * @example { page: 'offset', perPage: 'count' } // ?offset=1&count=20
   */
  params: {
    page: string;
    perPage: string;
  };

  /** Default values applied when none are passed by the composable caller */
  defaults: {
    page: number;
    perPage: number;
  };
}

/**
 * Full pagination configuration object.
 * Combine `meta` (how to read the response) and `request` (how to send params).
 *
 * @example
 * // Headers-based API (e.g. many REST frameworks)
 * {
 *   meta: {
 *     metaSource: 'headers',
 *     fields: { total: 'X-Total-Count', totalPages: 'X-Total-Pages', currentPage: 'X-Page', perPage: 'X-Per-Page' }
 *   },
 *   request: {
 *     sendAs: 'query',
 *     params: { page: 'page', perPage: 'limit' },
 *     defaults: { page: 1, perPage: 20 }
 *   }
 * }
 *
 * @example
 * // Body-based API (e.g. Laravel paginate())
 * {
 *   meta: {
 *     metaSource: 'body',
 *     fields: { total: 'meta.total', totalPages: 'meta.last_page', currentPage: 'meta.current_page', perPage: 'meta.per_page', dataKey: 'data' }
 *   },
 *   request: {
 *     sendAs: 'query',
 *     params: { page: 'page', perPage: 'per_page' },
 *     defaults: { page: 1, perPage: 15 }
 *   }
 * }
 */
export interface PaginationConfig {
  meta: PaginationMetaConfig;
  request: PaginationRequestConfig;
}

/**
 * Reactive pagination state exposed to the composable caller.
 */
export interface PaginationState {
  /** Current page number (reactive) */
  currentPage: number;
  /** Total pages as reported by the backend (reactive) */
  totalPages: number;
  /** Total item count as reported by the backend (reactive) */
  total: number;
  /** Current page size (reactive) */
  perPage: number;
}

// ---------------------------------------------------------------------------
// Internal defaults
// ---------------------------------------------------------------------------

const DEFAULT_PAGINATION_CONFIG: PaginationConfig = {
  meta: {
    metaSource: 'body',
    fields: {
      total: 'total',
      totalPages: 'totalPages',
      currentPage: 'currentPage',
      perPage: 'perPage',
    },
  },
  request: {
    sendAs: 'query',
    params: { page: 'page', perPage: 'perPage' },
    defaults: { page: 1, perPage: 20 },
  },
};

// ---------------------------------------------------------------------------
// Global config store
// ---------------------------------------------------------------------------

let _globalPaginationConfig: PaginationConfig | null = null;

/**
 * Register the global pagination configuration.
 * Call this from your Nuxt plugin (plugins/api-pagination.ts).
 *
 * @example
 * export default defineNuxtPlugin(() => {
 *   provide('setGlobalApiPagination', setGlobalApiPagination);
 *   setGlobalApiPagination({ meta: { ... }, request: { ... } });
 * })
 */
export function setGlobalApiPagination(config: PaginationConfig): void {
  _globalPaginationConfig = config;
}

/**
 * Retrieve the global pagination configuration, falling back to built-in defaults.
 * Called internally by the runtime wrappers.
 */
export function getGlobalApiPagination(): PaginationConfig {
  // Try Nuxt plugin provide first (runtime usage inside components)
  try {
    const nuxtApp = useNuxtApp();
    // @ts-ignore
    if (nuxtApp.$getGlobalApiPagination) {
      // @ts-ignore
      const config: PaginationConfig = nuxtApp.$getGlobalApiPagination();
      if (config && typeof config === 'object') return config;
    }
  } catch {
    // outside Nuxt context — fall through
  }

  // Then the module-level variable (set via setGlobalApiPagination)
  if (_globalPaginationConfig) return _globalPaginationConfig;

  return DEFAULT_PAGINATION_CONFIG;
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

/**
 * Build the pagination parameters to inject into the outgoing request.
 *
 * Returns an object with at most one of: `query`, `body`, or `headers` populated,
 * depending on `config.request.sendAs`.
 */
export function buildPaginationRequest(
  page: number,
  perPage: number,
  config: PaginationConfig
): { query?: Record<string, any>; body?: Record<string, any>; headers?: Record<string, string> } {
  const { sendAs, params } = config.request;
  const payload: Record<string, any> = {
    [params.page]: page,
    [params.perPage]: perPage,
  };

  if (sendAs === 'query') return { query: payload };
  if (sendAs === 'body') return { body: payload };
  if (sendAs === 'headers') {
    // Header values must be strings
    return {
      headers: {
        [params.page]: String(page),
        [params.perPage]: String(perPage),
      },
    };
  }
  return { query: payload };
}

// ---------------------------------------------------------------------------
// Response meta extraction helpers
// ---------------------------------------------------------------------------

/**
 * Navigate a dot-notation path on a plain object.
 * Returns `undefined` if any intermediate key is missing.
 *
 * @example resolveDotPath({ meta: { total: 42 } }, 'meta.total') // → 42
 */
function resolveDotPath(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = path.split('.');
  let current: any = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[key];
  }
  return current;
}

/**
 * Extract pagination metadata from a **body** response.
 *
 * @param responseData - The raw JSON returned by the backend
 * @param config       - Active pagination config
 * @returns Partial pagination state (only fields that were found)
 */
export function extractPaginationMetaFromBody(
  responseData: any,
  config: PaginationConfig
): Partial<PaginationState> {
  const { fields } = config.meta;
  const result: Partial<PaginationState> = {};

  const rawTotal = resolveDotPath(responseData, fields.total);
  if (rawTotal !== undefined) result.total = Number(rawTotal);

  const rawTotalPages = resolveDotPath(responseData, fields.totalPages);
  if (rawTotalPages !== undefined) result.totalPages = Number(rawTotalPages);

  const rawCurrentPage = resolveDotPath(responseData, fields.currentPage);
  if (rawCurrentPage !== undefined) result.currentPage = Number(rawCurrentPage);

  const rawPerPage = resolveDotPath(responseData, fields.perPage);
  if (rawPerPage !== undefined) result.perPage = Number(rawPerPage);

  return result;
}

/**
 * Extract pagination metadata from HTTP **response headers**.
 *
 * @param headers - The `Headers` object from the fetch response
 * @param config  - Active pagination config
 * @returns Partial pagination state (only fields that were found)
 */
export function extractPaginationMetaFromHeaders(
  headers: Headers,
  config: PaginationConfig
): Partial<PaginationState> {
  const { fields } = config.meta;
  const result: Partial<PaginationState> = {};

  const rawTotal = headers.get(fields.total);
  if (rawTotal !== null) result.total = Number(rawTotal);

  const rawTotalPages = headers.get(fields.totalPages);
  if (rawTotalPages !== null) result.totalPages = Number(rawTotalPages);

  const rawCurrentPage = headers.get(fields.currentPage);
  if (rawCurrentPage !== null) result.currentPage = Number(rawCurrentPage);

  const rawPerPage = headers.get(fields.perPage);
  if (rawPerPage !== null) result.perPage = Number(rawPerPage);

  return result;
}

/**
 * If `config.meta.fields.dataKey` is set, unwrap the actual data array from the body.
 * Otherwise return the body as-is.
 *
 * @example
 * // Laravel paginate() response: { data: [...], meta: { total: 100, ... } }
 * unwrapDataKey(response, config) // → response.data
 */
export function unwrapDataKey<T>(responseData: any, config: PaginationConfig): T {
  const key = config.meta.fields.dataKey;
  if (key && responseData && typeof responseData === 'object' && key in responseData) {
    return responseData[key] as T;
  }
  return responseData as T;
}
