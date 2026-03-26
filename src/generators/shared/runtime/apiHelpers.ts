// @ts-nocheck - This file runs in user's Nuxt project with different TypeScript config
/**
 * Shared API Helpers - Used by both useFetch and useAsyncData wrappers
 * This file contains common logic for callbacks, transforms, and global configuration
 */

/**
 * Context provided to onRequest interceptor
 */
export interface RequestContext {
  /** Request URL */
  url: string;
  /** HTTP method */
  method: string;
  /** Request body (if any) */
  body?: any;
  /** Request headers */
  headers?: Record<string, string>;
  /** Query parameters */
  query?: Record<string, any>;
}

/**
 * Modified context that can be returned from onRequest
 */
export interface ModifiedRequestContext {
  /** Modified request body */
  body?: any;
  /** Modified request headers */
  headers?: Record<string, string>;
  /** Modified query parameters */
  query?: Record<string, any>;
}

/**
 * Result context provided to onFinish callback
 */
export interface FinishContext<T> {
  /** Response data (if successful) */
  data?: T;
  /** Error (if failed) */
  error?: any;
  /** Whether the request was successful */
  success: boolean;
}

/**
 * A single rule in the global callbacks configuration.
 * Each rule independently targets specific URL patterns and/or HTTP methods.
 * Rules are executed in order; any rule may return false to suppress the local callback.
 */
export interface GlobalCallbacksRule {
  /**
   * URL glob patterns — only apply this rule to matching URLs.
   * Supports wildcards: '/api/**', '/api/public/*', etc.
   * If omitted, the rule applies to all URLs.
   */
  patterns?: string[];

  /**
   * HTTP methods — only apply this rule to matching methods (case-insensitive).
   * Example: ['DELETE', 'POST']
   * If omitted, the rule applies to all methods.
   */
  methods?: string[];

  /**
   * Called before the request is sent.
   * Return modified context (headers/body/query) to alter the request.
   * Return false to prevent local onRequest execution (Opción 2).
   */
  onRequest?: (
    context: RequestContext
  ) =>
    | void
    | Promise<void>
    | ModifiedRequestContext
    | Promise<ModifiedRequestContext>
    | boolean
    | Promise<boolean>;

  /**
   * Called when the request succeeds.
   * Return false to prevent local onSuccess execution (Opción 2).
   */
  onSuccess?: (data: any, context?: any) => void | Promise<void> | boolean | Promise<boolean>;

  /**
   * Called when the request fails.
   * Return false to prevent local onError execution (Opción 2).
   */
  onError?: (error: any, context?: any) => void | Promise<void> | boolean | Promise<boolean>;

  /**
   * Called when the request finishes (success or error).
   * Return false to prevent local onFinish execution (Opción 2).
   */
  onFinish?: (context: FinishContext<any>) => void | Promise<void> | boolean | Promise<boolean>;
}

/**
 * Global callbacks configuration.
 * Accepts a single rule (backward-compatible) or an array of rules.
 * Each rule can independently target URLs and HTTP methods.
 * Provided via Nuxt plugin: $getGlobalApiCallbacks
 *
 * @example Single rule (backward-compatible)
 * getGlobalApiCallbacks: () => ({ onError: (e) => console.error(e) })
 *
 * @example Multiple rules with method/pattern targeting
 * getGlobalApiCallbacks: () => [
 *   { onRequest: (ctx) => console.log(ctx.url) },
 *   { methods: ['DELETE'], onSuccess: () => toast.success('Deleted!') },
 *   { patterns: ['/api/private/**'], onRequest: () => ({ headers: { Authorization: '...' } }) },
 * ]
 */
export type GlobalCallbacksConfig = GlobalCallbacksRule | GlobalCallbacksRule[];

/**
 * Type for skipGlobalCallbacks option (Opción 1)
 * - true: skip all global callbacks
 * - array: skip specific callbacks by name
 */
export type SkipGlobalCallbacks =
  | boolean
  | Array<'onRequest' | 'onSuccess' | 'onError' | 'onFinish'>;

/**
 * Base options for API requests with lifecycle callbacks
 * This is extended by specific wrapper options (useFetch, useAsyncData)
 */
export interface ApiRequestOptions<T = any> {
  /**
   * Called before the request is sent - can be used as an interceptor
   * Return modified body/headers to transform the request
   */
  onRequest?: (
    context: RequestContext
  ) => void | Promise<void> | ModifiedRequestContext | Promise<ModifiedRequestContext>;

  /** Called when the request succeeds with data (after transform/pick if provided) */
  onSuccess?: (data: any) => void | Promise<void>;

  /** Called when the request fails with an error */
  onError?: (error: any) => void | Promise<void>;

  /** Called when the request finishes (success or error) with result context */
  onFinish?: (context: FinishContext<any>) => void | Promise<void>;

  /**
   * Skip global callbacks for this specific request (Opción 1)
   * - true: skip all global callbacks
   * - ['onSuccess', 'onError']: skip specific callbacks
   * - false/undefined: use global callbacks (default)
   * @example
   * skipGlobalCallbacks: true // Skip all global callbacks
   * skipGlobalCallbacks: ['onSuccess'] // Skip only global onSuccess
   */
  skipGlobalCallbacks?: SkipGlobalCallbacks;

  /**
   * Transform the response data
   * @example
   * transform: (pet) => ({ displayName: pet.name, isAvailable: pet.status === 'available' })
   */
  transform?: (data: T) => any;

  /**
   * Pick specific keys from the response (applied before transform)
   * Supports dot notation for nested paths
   * @example
   * pick: ['id', 'name'] as const
   * pick: ['person.name', 'person.email', 'status']
   */
  pick?: ReadonlyArray<string>;

  /**
   * Custom cache key for useAsyncData. If provided, used as-is instead of the auto-generated key.
   * Useful for manual cache control or sharing cache between components.
   */
  cacheKey?: string;

  // --- Common fetch options (available in all composables) ---

  /** Base URL prepended to every request URL. Overrides runtimeConfig.public.apiBaseUrl. */
  baseURL?: string;

  /** HTTP method (GET, POST, PUT, PATCH, DELETE, etc.) */
  method?: string;

  /** Request body */
  body?: any;

  /** Request headers */
  headers?: Record<string, string> | HeadersInit;

  /** URL query parameters */
  query?: Record<string, any>;

  /** Alias for query */
  params?: Record<string, any>;
}

/**
 * Helper function to apply request modifications from onRequest interceptor
 */
export function applyRequestModifications(
  options: Record<string, any>,
  modifications: ModifiedRequestContext
): void {
  if (modifications.body !== undefined) {
    options.body = modifications.body;
  }
  if (modifications.headers !== undefined) {
    options.headers = {
      ...options.headers,
      ...modifications.headers,
    };
  }
  if (modifications.query !== undefined) {
    options.query = {
      ...options.query,
      ...modifications.query,
    };
  }
}

/**
 * Helper function to pick specific keys from an object
 * Supports dot notation for nested paths (e.g., 'person.name')
 */
export function applyPick<T>(data: T, paths: ReadonlyArray<string>): any {
  const result: any = {};

  for (const path of paths) {
    const keys = path.split('.');

    // Navigate to the nested value
    let value: any = data;
    let exists = true;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        exists = false;
        break;
      }
    }

    // Set the value in the result, maintaining nested structure
    if (exists) {
      let current = result;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current)) {
          current[key] = {};
        }
        current = current[key];
      }
      current[keys[keys.length - 1]] = value;
    }
  }

  return result;
}

/**
 * Helper function to get global headers from user configuration
 * Supports two methods:
 * 1. Auto-imported composable: composables/useApiHeaders.ts
 * 2. Nuxt plugin provide: plugins/api-config.ts with $getApiHeaders
 */
export function getGlobalHeaders(): Record<string, string> {
  let headers: Record<string, string> = {};

  // Method 1: Try to use auto-imported composable (useApiHeaders)
  try {
    // @ts-ignore - useApiHeaders may or may not exist (user-defined)
    if (typeof useApiHeaders !== 'undefined') {
      // @ts-ignore
      const getHeaders = useApiHeaders();
      if (getHeaders) {
        const h = typeof getHeaders === 'function' ? getHeaders() : getHeaders;
        if (h && typeof h === 'object') {
          headers = { ...headers, ...h };
        }
      }
    }
  } catch (e) {
    // useApiHeaders doesn't exist or failed, that's OK
  }

  // Method 2: Try to use Nuxt App plugin ($getApiHeaders)
  try {
    const nuxtApp = useNuxtApp();
    // @ts-ignore - $getApiHeaders may or may not exist (user-defined)
    if (nuxtApp.$getApiHeaders) {
      // @ts-ignore
      const h = nuxtApp.$getApiHeaders();
      if (h && typeof h === 'object') {
        headers = { ...headers, ...h };
      }
    }
  } catch (e) {
    // useNuxtApp not available or plugin not configured, that's OK
  }

  return headers;
}

/**
 * Helper function to get global callback rules from user configuration.
 * Always returns a normalized array — wraps legacy single-object config automatically for
 * full backward compatibility.
 * Uses Nuxt plugin provide: plugins/api-callbacks.ts with $getGlobalApiCallbacks
 */
export function getGlobalCallbacks(): GlobalCallbacksRule[] {
  try {
    const nuxtApp = useNuxtApp();
    // @ts-ignore - $getGlobalApiCallbacks may or may not exist (user-defined)
    if (nuxtApp.$getGlobalApiCallbacks) {
      // @ts-ignore
      const config: GlobalCallbacksConfig = nuxtApp.$getGlobalApiCallbacks();
      if (config && typeof config === 'object') {
        // Normalize: wrap single-rule object in array for backward compatibility
        return Array.isArray(config) ? config : [config];
      }
    }
  } catch (e) {
    // useNuxtApp not available or plugin not configured, that's OK
  }

  return [];
}

/**
 * Helper function to get the global base URL from runtimeConfig.public.apiBaseUrl
 * Returns the configured URL or undefined if not set or not in a Nuxt context.
 */
export function getGlobalBaseUrl(): string | undefined {
  try {
    const runtimeConfig = useRuntimeConfig();
    const url = runtimeConfig?.public?.apiBaseUrl as string | undefined;
    return url || undefined;
  } catch {
    // useRuntimeConfig not available outside Nuxt context, that's OK
    return undefined;
  }
}

/**
 * Check if a global rule should be applied to a specific request.
 * Implements Opción 1 (skipGlobalCallbacks), URL pattern matching, and HTTP method matching.
 */
export function shouldApplyGlobalCallback(
  url: string,
  method: string,
  callbackName: 'onRequest' | 'onSuccess' | 'onError' | 'onFinish',
  rule: GlobalCallbacksRule,
  skipConfig?: SkipGlobalCallbacks
): boolean {
  // Opción 1: Check if callback is skipped via skipGlobalCallbacks
  if (skipConfig === true) return false;
  if (Array.isArray(skipConfig) && skipConfig.includes(callbackName)) return false;

  // URL pattern matching — if patterns defined, URL must match at least one
  if (rule.patterns && rule.patterns.length > 0) {
    const matchesUrl = rule.patterns.some((pattern) => {
      // Convert glob pattern to regex: ** = any path, * = single segment
      const regexPattern = pattern
        .replace(/\*\*/g, '@@DOUBLE_STAR@@')
        .replace(/\*/g, '[^/]*')
        .replace(/@@DOUBLE_STAR@@/g, '.*');
      return new RegExp('^' + regexPattern + '$').test(url);
    });
    if (!matchesUrl) return false;
  }

  // Method matching — if methods defined, request method must match at least one
  if (rule.methods && rule.methods.length > 0) {
    if (!rule.methods.map((m) => m.toUpperCase()).includes(method.toUpperCase())) return false;
  }

  return true;
}

/**
 * Merge local and global callback rules with proper execution order.
 * Global rules are iterated in definition order. Any rule returning false suppresses the local callback.
 * Implements all 3 options:
 * - Opción 1: skipGlobalCallbacks to disable all global rules per request
 * - Opción 2: a rule callback can return false to prevent local callback execution
 * - Opción 3: per-rule URL pattern matching and HTTP method filtering
 */
export function mergeCallbacks(
  url: string,
  method: string,
  localCallbacks: {
    onRequest?: Function;
    onSuccess?: Function;
    onError?: Function;
    onFinish?: Function;
  },
  skipConfig?: SkipGlobalCallbacks
) {
  const rules = getGlobalCallbacks();

  /**
   * Iterate all applicable global rules for onSuccess, onError, or onFinish.
   * Returns true if the local callback should still execute.
   */
  async function runGlobalRules(
    callbackName: 'onSuccess' | 'onError' | 'onFinish',
    ...args: any[]
  ): Promise<boolean> {
    let continueLocal = true;
    for (const rule of rules) {
      const cb = rule[callbackName];
      if (!cb || !shouldApplyGlobalCallback(url, method, callbackName, rule, skipConfig)) continue;
      try {
        const result = await (cb as Function)(...args);
        // Opción 2: returning false from any rule suppresses the local callback
        if (result === false) continueLocal = false;
      } catch (error) {
        console.error(`Error in global ${callbackName} callback:`, error);
      }
    }
    return continueLocal;
  }

  return {
    /**
     * Merged onRequest: runs all applicable global rules collecting and deep-merging
     * modifications (headers and query are merged; body is last-write-wins).
     * Local onRequest runs after all rules unless any returns false, and its
     * modifications take highest priority.
     */
    onRequest: async (ctx: RequestContext) => {
      let mergedMods: ModifiedRequestContext | undefined;
      let continueLocal = true;

      for (const rule of rules) {
        if (!rule.onRequest || !shouldApplyGlobalCallback(url, method, 'onRequest', rule, skipConfig)) continue;
        try {
          const result = await rule.onRequest(ctx);
          if (result === false) {
            continueLocal = false;
          } else if (result && typeof result === 'object') {
            const mod = result as ModifiedRequestContext;
            // Deep-merge headers and query; body is last-write-wins
            mergedMods = {
              ...(mergedMods ?? {}),
              ...mod,
              headers: { ...(mergedMods?.headers ?? {}), ...(mod.headers ?? {}) },
              query: { ...(mergedMods?.query ?? {}), ...(mod.query ?? {}) },
            };
          }
        } catch (error) {
          console.error('Error in global onRequest callback:', error);
        }
      }

      // Execute local onRequest — its modifications take highest priority
      if (continueLocal && localCallbacks.onRequest) {
        const localResult = await localCallbacks.onRequest(ctx);
        if (localResult && typeof localResult === 'object') {
          const localMod = localResult as ModifiedRequestContext;
          return mergedMods
            ? {
                ...mergedMods,
                ...localMod,
                headers: { ...(mergedMods.headers ?? {}), ...(localMod.headers ?? {}) },
                query: { ...(mergedMods.query ?? {}), ...(localMod.query ?? {}) },
              }
            : localMod;
        }
      }

      return mergedMods;
    },

    /** Merged onSuccess: global rules first in order, then local (unless suppressed). */
    onSuccess: async (data: any, context?: any) => {
      const continueLocal = await runGlobalRules('onSuccess', data, context);
      if (continueLocal && localCallbacks.onSuccess) {
        await localCallbacks.onSuccess(data, context);
      }
    },

    /** Merged onError: global rules first in order, then local (unless suppressed). */
    onError: async (error: any, context?: any) => {
      const continueLocal = await runGlobalRules('onError', error, context);
      if (continueLocal && localCallbacks.onError) {
        await localCallbacks.onError(error, context);
      }
    },

    /** Merged onFinish: global rules first in order, then local (unless suppressed). */
    onFinish: async (context: any) => {
      const continueLocal = await runGlobalRules('onFinish', context);
      if (continueLocal && localCallbacks.onFinish) {
        await localCallbacks.onFinish(context);
      }
    },
  };
}
