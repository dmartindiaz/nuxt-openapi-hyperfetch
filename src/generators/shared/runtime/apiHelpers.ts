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
 * Global callbacks configuration
 * Can be provided via Nuxt plugin: $getGlobalApiCallbacks
 */
export interface GlobalCallbacksConfig {
  /**
   * Optional URL patterns to match (Opción 3)
   * Only apply global callbacks to URLs matching these patterns
   * Supports wildcards: '/api/**', '/api/public/*', etc.
   * If omitted, callbacks apply to all requests
   */
  patterns?: string[];

  /**
   * Called before every request matching patterns
   * Return false to prevent local callback execution (Opción 2)
   * Return modified context to change request
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
   * Called when request succeeds
   * Return false to prevent local callback execution (Opción 2)
   */
  onSuccess?: (data: any, context?: any) => void | Promise<void> | boolean | Promise<boolean>;

  /**
   * Called when request fails
   * Return false to prevent local callback execution (Opción 2)
   */
  onError?: (error: any, context?: any) => void | Promise<void> | boolean | Promise<boolean>;

  /**
   * Called when request finishes (success or error)
   * Return false to prevent local callback execution (Opción 2)
   */
  onFinish?: (context: FinishContext<any>) => void | Promise<void> | boolean | Promise<boolean>;
}

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
 * Helper function to get global callbacks from user configuration
 * Uses Nuxt plugin provide: plugins/api-callbacks.ts with $getGlobalApiCallbacks
 */
export function getGlobalCallbacks(): GlobalCallbacksConfig {
  try {
    const nuxtApp = useNuxtApp();
    // @ts-ignore - $getGlobalApiCallbacks may or may not exist (user-defined)
    if (nuxtApp.$getGlobalApiCallbacks) {
      // @ts-ignore
      const callbacks = nuxtApp.$getGlobalApiCallbacks();
      if (callbacks && typeof callbacks === 'object') {
        return callbacks;
      }
    }
  } catch (e) {
    // useNuxtApp not available or plugin not configured, that's OK
  }

  return {};
}

/**
 * Check if a global callback should be applied to a specific request
 * Implements Opción 1 (skipGlobalCallbacks) and Opción 3 (pattern matching)
 */
export function shouldApplyGlobalCallback(
  url: string,
  callbackName: 'onRequest' | 'onSuccess' | 'onError' | 'onFinish',
  patterns?: string[],
  skipConfig?: SkipGlobalCallbacks
): boolean {
  // Opción 1: Check if callback is skipped via skipGlobalCallbacks
  if (skipConfig === true) {
    return false; // Skip all global callbacks
  }

  if (Array.isArray(skipConfig) && skipConfig.includes(callbackName)) {
    return false; // Skip this specific callback
  }

  // Opción 3: Check pattern matching
  if (patterns && patterns.length > 0) {
    return patterns.some((pattern) => {
      // Convert glob pattern to regex
      // ** matches any characters including /
      // * matches any characters except /
      const regexPattern = pattern
        .replace(/\*\*/g, '@@DOUBLE_STAR@@')
        .replace(/\*/g, '[^/]*')
        .replace(/@@DOUBLE_STAR@@/g, '.*');

      const regex = new RegExp('^' + regexPattern + '$');
      return regex.test(url);
    });
  }

  // By default, apply global callback
  return true;
}

/**
 * Merge local and global callbacks with proper execution order
 * Implements all 3 options:
 * - Opción 1: skipGlobalCallbacks to disable global callbacks
 * - Opción 2: global callbacks can return false to prevent local execution
 * - Opción 3: pattern matching to apply callbacks only to matching URLs
 */
export function mergeCallbacks(
  url: string,
  localCallbacks: {
    onRequest?: Function;
    onSuccess?: Function;
    onError?: Function;
    onFinish?: Function;
  },
  skipConfig?: SkipGlobalCallbacks
) {
  const global = getGlobalCallbacks();

  return {
    /**
     * Merged onRequest callback
     * Executes global first, then local
     * Global can return modifications or false to cancel local
     */
    onRequest: async (ctx: RequestContext) => {
      // Execute global onRequest
      if (
        shouldApplyGlobalCallback(url, 'onRequest', global.patterns, skipConfig) &&
        global.onRequest
      ) {
        try {
          const result = await global.onRequest(ctx);

          // Opción 2: If global returns false, don't execute local
          if (result === false) {
            return;
          }

          // If global returns modified context, use it
          if (result && typeof result === 'object' && !('then' in result)) {
            return result;
          }
        } catch (error) {
          console.error('Error in global onRequest callback:', error);
        }
      }

      // Execute local onRequest
      if (localCallbacks.onRequest) {
        return await localCallbacks.onRequest(ctx);
      }
    },

    /**
     * Merged onSuccess callback
     * Executes global first, then local (if global doesn't return false)
     */
    onSuccess: async (data: any, context?: any) => {
      let continueLocal = true;

      // Execute global onSuccess
      if (
        shouldApplyGlobalCallback(url, 'onSuccess', global.patterns, skipConfig) &&
        global.onSuccess
      ) {
        try {
          const result = await global.onSuccess(data, context);

          // Opción 2: If global returns false, don't execute local
          if (result === false) {
            continueLocal = false;
          }
        } catch (error) {
          console.error('Error in global onSuccess callback:', error);
        }
      }

      // Execute local onSuccess (if not cancelled)
      if (continueLocal && localCallbacks.onSuccess) {
        await localCallbacks.onSuccess(data, context);
      }
    },

    /**
     * Merged onError callback
     * Executes global first, then local (if global doesn't return false)
     */
    onError: async (error: any, context?: any) => {
      let continueLocal = true;

      // Execute global onError
      if (
        shouldApplyGlobalCallback(url, 'onError', global.patterns, skipConfig) &&
        global.onError
      ) {
        try {
          const result = await global.onError(error, context);

          // Opción 2: If global returns false, don't execute local
          if (result === false) {
            continueLocal = false;
          }
        } catch (error) {
          console.error('Error in global onError callback:', error);
        }
      }

      // Execute local onError (if not cancelled)
      if (continueLocal && localCallbacks.onError) {
        await localCallbacks.onError(error, context);
      }
    },

    /**
     * Merged onFinish callback
     * Executes global first, then local (if global doesn't return false)
     */
    onFinish: async (context: any) => {
      let continueLocal = true;

      // Execute global onFinish
      if (
        shouldApplyGlobalCallback(url, 'onFinish', global.patterns, skipConfig) &&
        global.onFinish
      ) {
        try {
          const result = await global.onFinish(context);

          // Opción 2: If global returns false, don't execute local
          if (result === false) {
            continueLocal = false;
          }
        } catch (error) {
          console.error('Error in global onFinish callback:', error);
        }
      }

      // Execute local onFinish (if not cancelled)
      if (continueLocal && localCallbacks.onFinish) {
        await localCallbacks.onFinish(context);
      }
    },
  };
}
