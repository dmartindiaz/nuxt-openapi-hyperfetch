// @ts-nocheck
/**
 * Global API Pagination Plugin
 *
 * ⚠️ IMPORTANT: This file is NEVER regenerated - your changes are safe!
 *
 * Configure the global pagination convention for all paginated API requests.
 * Each composable can override this config locally via `paginationConfig` option.
 *
 * ── HOW IT WORKS ──────────────────────────────────────────────────────────────
 *
 * When you call a composable with `paginated: true`, the wrapper will:
 *   1. Inject page/perPage params into the request (query, body, or headers)
 *   2. After the response, read total/totalPages/currentPage/perPage from the
 *      response headers or JSON body, according to `metaSource`
 *   3. Expose `pagination`, `goToPage()`, `nextPage()`, `prevPage()`, `setPerPage()`
 *
 * ── USAGE ─────────────────────────────────────────────────────────────────────
 *
 * // In your page/component:
 * const { data, pagination, goToPage, nextPage, prevPage, setPerPage } =
 *   useGetPets(params, { paginated: true })
 *
 * // pagination is a computed ref:
 * pagination.value.currentPage  // current page
 * pagination.value.totalPages   // total pages
 * pagination.value.total        // total items
 * pagination.value.perPage      // items per page
 * pagination.value.hasNextPage  // boolean
 * pagination.value.hasPrevPage  // boolean
 *
 * // Navigation helpers — automatically trigger re-fetch:
 * goToPage(3)
 * nextPage()
 * prevPage()
 * setPerPage(50)
 *
 * ── PRIORITY ──────────────────────────────────────────────────────────────────
 *
 * Per-call paginationConfig > this plugin's global config > built-in defaults
 *
 * Example of per-call override:
 *   useGetPets(params, {
 *     paginated: true,
 *     paginationConfig: {
 *       meta: { metaSource: 'headers', fields: { ... } },
 *       request: { sendAs: 'query', params: { page: 'p', perPage: 'size' }, defaults: { page: 1, perPage: 10 } }
 *     }
 *   })
 */

export default defineNuxtPlugin(() => {
  // Uncomment and configure ONE of the examples below that matches your backend.

  // ============================================================================
  // EXAMPLE 1 — Query params + response body (most common REST pattern)
  //
  // Request:  GET /pets?page=1&limit=20
  // Response: { data: [...], total: 100, totalPages: 5, currentPage: 1, perPage: 20 }
  // ============================================================================
  // const paginationConfig = {
  //   meta: {
  //     metaSource: 'body',
  //     fields: {
  //       total: 'total',
  //       totalPages: 'totalPages',
  //       currentPage: 'currentPage',
  //       perPage: 'perPage',
  //       dataKey: 'data', // response.data contains the actual array
  //     },
  //   },
  //   request: {
  //     sendAs: 'query',
  //     params: { page: 'page', perPage: 'limit' },
  //     defaults: { page: 1, perPage: 20 },
  //   },
  // };

  // ============================================================================
  // EXAMPLE 2 — Laravel paginate() convention
  //
  // Request:  GET /pets?page=1&per_page=15
  // Response: { data: [...], meta: { total: 100, last_page: 7, current_page: 1, per_page: 15 } }
  // ============================================================================
  // const paginationConfig = {
  //   meta: {
  //     metaSource: 'body',
  //     fields: {
  //       total: 'meta.total',
  //       totalPages: 'meta.last_page',
  //       currentPage: 'meta.current_page',
  //       perPage: 'meta.per_page',
  //       dataKey: 'data',
  //     },
  //   },
  //   request: {
  //     sendAs: 'query',
  //     params: { page: 'page', perPage: 'per_page' },
  //     defaults: { page: 1, perPage: 15 },
  //   },
  // };

  // ============================================================================
  // EXAMPLE 3 — HTTP response headers convention
  //
  // Request:  GET /pets?page=1&limit=20
  // Response headers: X-Total-Count: 100, X-Total-Pages: 5, X-Page: 1, X-Per-Page: 20
  // ============================================================================
  // const paginationConfig = {
  //   meta: {
  //     metaSource: 'headers',
  //     fields: {
  //       total: 'X-Total-Count',
  //       totalPages: 'X-Total-Pages',
  //       currentPage: 'X-Page',
  //       perPage: 'X-Per-Page',
  //       // No dataKey needed — response body is the array directly
  //     },
  //   },
  //   request: {
  //     sendAs: 'query',
  //     params: { page: 'page', perPage: 'limit' },
  //     defaults: { page: 1, perPage: 20 },
  //   },
  // };

  // ============================================================================
  // EXAMPLE 4 — POST-as-search (body pagination)
  //
  // Request:  POST /pets/search  body: { filters: {...}, page: 1, pageSize: 20 }
  // Response: { items: [...], total: 100, pages: 5 }
  // ============================================================================
  // const paginationConfig = {
  //   meta: {
  //     metaSource: 'body',
  //     fields: {
  //       total: 'total',
  //       totalPages: 'pages',
  //       currentPage: 'page',
  //       perPage: 'pageSize',
  //       dataKey: 'items',
  //     },
  //   },
  //   request: {
  //     sendAs: 'body',
  //     params: { page: 'page', perPage: 'pageSize' },
  //     defaults: { page: 1, perPage: 20 },
  //   },
  // };

  return {
    provide: {
      // Expose the config so the runtime wrappers can read it.
      // Uncomment this line once you've configured paginationConfig above:
      // getGlobalApiPagination: () => paginationConfig,
    },
  };
});
