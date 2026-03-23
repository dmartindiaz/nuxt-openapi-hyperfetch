// @ts-nocheck
/**
 * Global API Callbacks Plugin
 *
 * ⚠️ IMPORTANT: This file is NEVER regenerated - your changes are safe!
 *
 * This plugin allows you to configure global callbacks for all API requests
 * made with useFetch* and useAsyncData* composables.
 *
 * 📚 Three ways to control global callbacks:
 *
 * 1️⃣ OPTION 1: skipGlobalCallbacks (disable from the call)
 *    Skip global callbacks for specific requests
 *    Example:
 *      useFetchGetPets({ skipGlobalCallbacks: true })
 *      useFetchGetPets({ skipGlobalCallbacks: ['onSuccess'] })
 *
 * 2️⃣ OPTION 2: return false (disable from the plugin)
 *    Global callbacks can return false to prevent local callback execution
 *    Example:
 *      onError: (error) => {
 *        if (error.statusCode === 401) {
 *          navigateTo('/login');
 *          return false; // Don't execute local onError
 *        }
 *      }
 *
 * 3️⃣ OPTION 3: patterns (URL matching)
 *    Only apply callbacks to URLs matching specific patterns
 *    Example:
 *      patterns: ['/api/**', '/api/v2/*']
 */

export default defineNuxtPlugin(() => {
  // Uncomment and customize the callbacks you need
  const globalCallbacks = {
    // ========================================================================
    // OPTION 3: URL Pattern Matching (OPTIONAL)
    // ========================================================================
    // Only apply global callbacks to URLs matching these patterns
    // Use ** to match any path (including nested), * to match single segment
    // If omitted or empty, callbacks apply to ALL requests
    // patterns: ['/api/**'],  // Only internal APIs
    // patterns: ['/api/v1/**', '/api/v2/**'],  // Multiple API versions
    // patterns: ['**/public/**'],  // All public endpoints
    // ========================================================================
    // onRequest: Called before every request
    // ========================================================================
    // Use cases:
    // - Add authentication headers globally
    // - Log all API calls
    // - Add request timestamps
    // - Modify request body/headers/params
    // onRequest: (context) => {
    //   console.log(`[API] ${context.method} ${context.url}`);
    //
    //   // Example 1: Add auth token to all requests
    //   // const token = useCookie('auth-token').value;
    //   // if (token) {
    //   //   return {
    //   //     headers: { 'Authorization': `Bearer ${token}` }
    //   //   };
    //   // }
    //
    //   // Example 2: Add request timestamp
    //   // return {
    //   //   headers: { 'X-Request-Time': new Date().toISOString() }
    //   // };
    //
    //   // Example 3: Block local onRequest (OPTION 2)
    //   // return false;
    // },
    // ========================================================================
    // onSuccess: Called when request succeeds
    // ========================================================================
    // Use cases:
    // - Show success notifications/toasts
    // - Track successful operations
    // - Update analytics
    // - Cache responses
    // onSuccess: (data, context) => {
    //   // Example 1: Success notification
    //   // const { $toast } = useNuxtApp();
    //   // $toast?.success('✅ Operation successful');
    //
    //   // Example 2: Track analytics
    //   // trackEvent('api_success', { url: context?.url });
    //
    //   // Example 3: Log response data (development only)
    //   // if (process.dev) {
    //   //   console.log('API Response:', data);
    //   // }
    //
    //   // Example 4: Cache specific responses
    //   // if (context?.url.includes('/api/config')) {
    //   //   localStorage.setItem('app-config', JSON.stringify(data));
    //   // }
    //
    //   // Example 5: Block local onSuccess for certain cases (OPTION 2)
    //   // if (data.status === 'pending_approval') {
    //   //   $toast?.info('⏳ Awaiting approval');
    //   //   return false; // Don't execute local onSuccess
    //   // }
    // },
    // ========================================================================
    // onError: Called when request fails
    // ========================================================================
    // Use cases:
    // - Handle authentication errors globally (401, 403)
    // - Show error notifications
    // - Log errors to monitoring service
    // - Handle network errors
    // - Retry logic
    // onError: (error, context) => {
    //   console.error('[API Error]', error);
    //   const { $toast } = useNuxtApp();
    //
    //   // Example 1: Handle authentication errors (OPTION 2)
    //   if (error.statusCode === 401) {
    //     $toast?.warning('⚠️ Session expired - redirecting to login...');
    //     navigateTo('/login');
    //     return false; // Don't execute local onError (avoiding duplicate messages)
    //   }
    //
    //   // Example 2: Handle forbidden errors
    //   // if (error.statusCode === 403) {
    //   //   $toast?.error('❌ Access denied');
    //   //   navigateTo('/');
    //   //   return false;
    //   // }
    //
    //   // Example 3: Handle server errors
    //   // if (error.statusCode >= 500) {
    //   //   $toast?.error('❌ Server error - please try again later');
    //   //   // Log to monitoring service
    //   //   // logErrorToSentry(error);
    //   // }
    //
    //   // Example 4: Handle rate limiting
    //   // if (error.statusCode === 429) {
    //   //   const retryAfter = error.data?.retryAfter || 60;
    //   //   $toast?.warning(`⏳ Too many requests - retry in ${retryAfter}s`);
    //   //   return false; // Don't show duplicate error in component
    //   // }
    //
    //   // Example 5: Handle network errors
    //   // if (error.message === 'Network request failed') {
    //   //   $toast?.error('❌ Network error - check your connection');
    //   // }
    //
    //   // Example 6: Generic error notification
    //   // $toast?.error(`❌ ${error.message || 'An error occurred'}`);
    //
    //   // Allow local onError to execute (return true or don't return)
    // },
    // ========================================================================
    // onFinish: Called when request completes (success or error)
    // ========================================================================
    // Use cases:
    // - Hide loading indicators
    // - Track request completion
    // - Clean up resources
    // - Update request counters
    // onFinish: (context) => {
    //   // Example 1: Track API call completion
    //   // const duration = Date.now() - context.startTime;
    //   // trackMetric('api_call_duration', duration, { url: context.url });
    //
    //   // Example 2: Log request completion
    //   // console.log(
    //   //   `[API] ${context.url} - ${context.success ? '✅ Success' : '❌ Failed'}`
    //   // );
    //
    //   // Example 3: Update request counter
    //   // const store = useRequestStore();
    //   // store.decrementPendingRequests();
    //
    //   // Example 4: Clean up global loading state
    //   // const { $loading } = useNuxtApp();
    //   // $loading?.hide();
    // },
  };

  return {
    provide: {
      getGlobalApiCallbacks: () => globalCallbacks,
    },
  };
});

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Use global callbacks (default behavior)
 *
 * const { data, error } = useFetchGetPets();
 * // ✅ All global callbacks execute automatically
 */

/**
 * Example 2: Skip ALL global callbacks (OPTION 1)
 *
 * const { data, error } = useFetchGetPets({
 *   skipGlobalCallbacks: true,
 * });
 * // ❌ No global callbacks execute
 */

/**
 * Example 3: Skip SPECIFIC global callbacks (OPTION 1)
 *
 * const { data, error } = useFetchUpdatePet(id, pet, {
 *   skipGlobalCallbacks: ['onSuccess'], // Skip global onSuccess only
 *   onSuccess: (data) => {
 *     // Only this local callback executes
 *     console.log('Pet updated:', data);
 *   }
 * });
 * // ✅ Global onError still executes
 * // ❌ Global onSuccess skipped
 * // ✅ Local onSuccess executes
 */

/**
 * Example 4: Global callback prevents local execution (OPTION 2)
 *
 * // In plugin:
 * onError: (error) => {
 *   if (error.statusCode === 401) {
 *     navigateTo('/login');
 *     return false; // Don't execute local onError
 *   }
 * }
 *
 * // In component:
 * const { data, error } = useFetchGetPets({
 *   onError: (error) => {
 *     // ❌ This won't execute for 401 errors (global returned false)
 *     // ✅ This executes for other errors (404, 500, etc.)
 *     console.error('Failed to load pets:', error);
 *   }
 * });
 */

/**
 * Example 5: URL pattern matching (OPTION 3)
 *
 * // In plugin:
 * patterns: ['/api/public/**']
 *
 * // In components:
 * useFetchGetPets();          // URL: /api/public/pets   ✅ Global callbacks execute
 * useFetchGetUser();          // URL: /api/users/me      ❌ Global callbacks skipped
 * useFetchGetPublicConfig();  // URL: /api/public/config ✅ Global callbacks execute
 */

/**
 * Example 6: Combine all options
 *
 * // In plugin:
 * patterns: ['/api/**'],
 * onError: (error) => {
 *   if (error.statusCode === 401) return false;
 * }
 *
 * // In component:
 * const { data } = useFetchCreatePet(pet, {
 *   skipGlobalCallbacks: ['onSuccess'], // Skip global success toast
 *   onSuccess: (pet) => {
 *     // Show custom success message
 *     toast.success(`🐕 ${pet.name} added successfully!`);
 *   },
 *   onError: (error) => {
 *     // This won't execute for 401 (global returns false)
 *     // This executes for other errors
 *     console.error('Failed to create pet:', error);
 *   }
 * });
 */

// ============================================================================
// COMMON PATTERNS
// ============================================================================

/**
 * Pattern 1: Toast notifications for all operations
 *
 * const globalCallbacks = {
 *   onSuccess: () => {
 *     useNuxtApp().$toast?.success('✅ Success');
 *   },
 *   onError: (error) => {
 *     if (error.statusCode === 401) {
 *       navigateTo('/login');
 *       return false;
 *     }
 *     useNuxtApp().$toast?.error(`❌ ${error.message}`);
 *   }
 * };
 */

/**
 * Pattern 2: Authentication + logging
 *
 * const globalCallbacks = {
 *   onRequest: (context) => {
 *     console.log(`[API] ${context.method} ${context.url}`);
 *     const token = useCookie('auth-token').value;
 *     if (token) {
 *       return { headers: { 'Authorization': `Bearer ${token}` } };
 *     }
 *   },
 *   onError: (error) => {
 *     if (error.statusCode === 401) {
 *       useCookie('auth-token').value = null;
 *       navigateTo('/login');
 *       return false;
 *     }
 *   }
 * };
 */

/**
 * Pattern 3: Analytics tracking
 *
 * const globalCallbacks = {
 *   onSuccess: (data, context) => {
 *     trackEvent('api_success', { endpoint: context?.url });
 *   },
 *   onError: (error, context) => {
 *     trackEvent('api_error', {
 *       endpoint: context?.url,
 *       statusCode: error.statusCode
 *     });
 *   }
 * };
 */

/**
 * Pattern 4: Loading states
 *
 * const globalCallbacks = {
 *   onRequest: () => {
 *     useLoadingStore().increment();
 *   },
 *   onFinish: () => {
 *     useLoadingStore().decrement();
 *   }
 * };
 */
