import * as path from 'path';
import type { MethodInfo } from './types.js';
import { pascalCase, camelCase } from 'change-case';

/**
 * Generate the Auth Context stub file
 * This file is generated ONCE and never overwritten
 */
export function generateAuthContextStub(): string {
  return `import type { H3Event } from 'h3';
import type { AuthContext } from './types.js';

/**
 * Get authentication context from the current request
 * 
 * TODO: Implement your authentication logic here
 * This function is called automatically by all generated server routes.
 * 
 * IMPORTANT: This file is NEVER regenerated - your changes are safe!
 * 
 * Examples for popular auth modules:
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Option 1: @sidebase/nuxt-auth
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * import { getServerSession } from '#auth';
 * 
 * export async function getAuthContext(event: H3Event): Promise<AuthContext> {
 *   const session = await getServerSession(event);
 *   
 *   if (!session) {
 *     return {
 *       isAuthenticated: false,
 *       userId: null,
 *       roles: [],
 *       permissions: [],
 *     };
 *   }
 *   
 *   return {
 *     isAuthenticated: true,
 *     userId: session.user.id,
 *     email: session.user.email,
 *     roles: session.user.roles || [],
 *     permissions: session.user.permissions || [],
 *   };
 * }
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Option 2: Custom JWT
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * import { getCookie } from 'h3';
 * import jwt from 'jsonwebtoken';
 * 
 * export async function getAuthContext(event: H3Event): Promise<AuthContext> {
 *   const token = getCookie(event, 'auth-token');
 *   
 *   if (!token) {
 *     return {
 *       isAuthenticated: false,
 *       userId: null,
 *       roles: [],
 *       permissions: [],
 *     };
 *   }
 *   
 *   try {
 *     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
 *     return {
 *       isAuthenticated: true,
 *       userId: decoded.sub,
 *       email: decoded.email,
 *       roles: decoded.roles || [],
 *       permissions: decoded.permissions || [],
 *     };
 *   } catch (error) {
 *     return {
 *       isAuthenticated: false,
 *       userId: null,
 *       roles: [],
 *       permissions: [],
 *     };
 *   }
 * }
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Option 3: Session Cookies
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * import { getCookie } from 'h3';
 * 
 * export async function getAuthContext(event: H3Event): Promise<AuthContext> {
 *   const sessionId = getCookie(event, 'session-id');
 *   
 *   if (!sessionId) {
 *     return {
 *       isAuthenticated: false,
 *       userId: null,
 *       roles: [],
 *       permissions: [],
 *     };
 *   }
 *   
 *   // TODO: Look up session in your database/store
 *   const session = await db.sessions.findOne({ id: sessionId });
 *   
 *   if (!session || session.expiresAt < Date.now()) {
 *     return {
 *       isAuthenticated: false,
 *       userId: null,
 *       roles: [],
 *       permissions: [],
 *     };
 *   }
 *   
 *   return {
 *     isAuthenticated: true,
 *     userId: session.userId,
 *     roles: session.roles || [],
 *     permissions: session.permissions || [],
 *   };
 * }
 */

/**
 * Default implementation - No authentication
 * Replace this with your actual auth logic above
 */
export async function getAuthContext(event: H3Event): Promise<AuthContext> {
  // TODO: Implement your authentication logic
  // See examples above for popular auth modules
  
  return {
    isAuthenticated: false,
    userId: null,
    roles: [],
    permissions: [],
  };
}
`;
}

/**
 * Generate the Auth Types stub file
 * This file is generated ONCE and never overwritten
 */
export function generateAuthTypesStub(): string {
  return `/**
 * Authentication context type
 * 
 * IMPORTANT: This file is NEVER regenerated - your changes are safe!
 * 
 * You can extend this interface with any properties you need:
 * - User information (email, name, avatar)
 * - Permissions and roles
 * - Organization/tenant context
 * - Feature flags
 * - Custom metadata
 */
export interface AuthContext {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  
  /** User ID (null if not authenticated) */
  userId: string | null;
  
  /** User roles (e.g., ['admin', 'user']) */
  roles: string[];
  
  /** User permissions (e.g., ['pet:read', 'pet:write']) */
  permissions: string[];
  
  // Add more fields as needed:
  // email?: string;
  // name?: string;
  // avatar?: string;
  // organizationId?: string;
  // tenantId?: string;
  // features?: string[];
  // metadata?: Record<string, any>;
}

/**
 * Helper to check if user has a specific permission
 */
export function hasPermission(auth: AuthContext, permission: string): boolean {
  return auth.isAuthenticated && auth.permissions.includes(permission);
}

/**
 * Helper to check if user has a specific role
 */
export function hasRole(auth: AuthContext, role: string): boolean {
  return auth.isAuthenticated && auth.roles.includes(role);
}

/**
 * Helper to check if user has ANY of the specified roles
 */
export function hasAnyRole(auth: AuthContext, roles: string[]): boolean {
  return auth.isAuthenticated && roles.some(role => auth.roles.includes(role));
}

/**
 * Helper to check if user has ALL of the specified roles
 */
export function hasAllRoles(auth: AuthContext, roles: string[]): boolean {
  return auth.isAuthenticated && roles.every(role => auth.roles.includes(role));
}
`;
}

/**
 * Generate a transformer stub for a specific resource
 * This file is generated ONCE and never overwritten
 */
export function generateTransformerStub(
  resource: string,
  methods: MethodInfo[],
  inputDir: string
): string {
  const resourcePascal = pascalCase(resource);
  const resourceCamel = camelCase(resource);

  // Compute ~/path for model types import
  const projectRoot = process.cwd();
  const relativeInputDir = path.relative(projectRoot, path.resolve(inputDir)).replace(/\\/g, '/');
  const modelsImportPath = `~/${relativeInputDir}/models`;
  // Extract unique type names from methods
  const typeNames = new Set<string>();
  methods.forEach((method) => {
    if (method.responseType) {
      const baseType = extractBaseType(method.responseType);
      if (baseType) {
        typeNames.add(baseType);
      }
    }
  });

  const importTypes = Array.from(typeNames).join(', ');

  return `import type { H3Event } from 'h3';
import type { AuthContext } from '~/server/auth/types';
${importTypes ? `import type { ${importTypes} } from '${modelsImportPath}';\n` : ''}
/**
 * Transformer for ${resource} endpoints
 * 
 * IMPORTANT: This file is NEVER regenerated - your changes are safe!
 * 
 * This transformer is automatically called by generated server routes.
 * Add your business logic here:
 * - Data transformation
 * - Permission checks
 * - Filtering sensitive data
 * - Combining multiple sources
 * - Caching logic
 * - Rate limiting
 * 
 * The transformer receives:
 * - data: The raw response from the backend API
 * - event: The h3 event (for accessing headers, query params, etc.)
 * - auth: The authentication context
 */

/**
 * Transform ${resource} data
 * 
 * TODO: Implement your transformation logic here
 * 
 * Examples:
 * 
 * 1. Add computed fields:
 *    return { ...data, fullName: \`\${data.firstName} \${data.lastName}\` }
 * 
 * 2. Filter sensitive data:
 *    const { password, internalId, ...safe } = data
 *    return safe
 * 
 * 3. Add permissions:
 *    return {
 *      ...data,
 *      canEdit: auth.permissions.includes('${resourceCamel}:write'),
 *      canDelete: auth.permissions.includes('${resourceCamel}:delete'),
 *    }
 * 
 * 4. Filter based on permissions:
 *    if (!auth.permissions.includes('${resourceCamel}:read:all')) {
 *      return { ...data, sensitiveField: undefined }
 *    }
 *    return data
 */
export async function transform${resourcePascal}<T = any>(
  data: T,
  event: H3Event,
  auth: AuthContext | null
): Promise<T> {
  // TODO: Add your transformation logic here
  
  // Example: Add permission flags
  // if (typeof data === 'object' && data !== null) {
  //   return {
  //     ...data,
  //     canEdit: auth?.permissions.includes('${resourceCamel}:write') ?? false,
  //     canDelete: auth?.permissions.includes('${resourceCamel}:delete') ?? false,
  //   } as T;
  // }
  
  // Default: Return data unchanged
  return data;
}
`;
}

/**
 * Generate transformer examples file
 * This file is ALWAYS regenerated as a reference
 */
export function generateTransformerExamples(): string {
  return `/**
 * ⚠️ EXAMPLES ONLY - DO NOT EDIT
 * 
 * This file contains examples of transformer patterns.
 * Copy these examples to your actual transformer files.
 * 
 * This file is regenerated on every generation - changes will be lost!
 * 
 * @generated by nuxt-openapi-generator
 */

import type { H3Event } from 'h3';
import type { AuthContext } from '~/server/auth/types';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Example 1: Basic Transformation
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Transform backend data to frontend format
 */
export async function exampleBasicTransform<T>(
  data: T,
  event: H3Event,
  auth: AuthContext | null
): Promise<T> {
  // Add computed fields
  if (typeof data === 'object' && data !== null) {
    return {
      ...data,
      // Example: Format dates
      // createdAtFormatted: new Date(data.createdAt).toLocaleDateString(),
      
      // Example: Add computed values
      // fullName: \`\${data.firstName} \${data.lastName}\`,
      
      // Example: Add metadata
      // _metadata: {
      //   retrievedAt: Date.now(),
      //   userId: auth?.userId,
      // },
    } as T;
  }
  
  return data;
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Example 2: Filter Sensitive Data
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Remove fields that shouldn't be exposed to the client
 */
export async function exampleFilterSensitiveData(
  data: any,
  event: H3Event,
  auth: AuthContext | null
): Promise<any> {
  // Define sensitive fields
  const sensitiveFields = ['password', 'passwordHash', 'ssn', 'internalId', 'secretKey'];
  
  if (Array.isArray(data)) {
    return data.map(item => filterObject(item, sensitiveFields));
  }
  
  return filterObject(data, sensitiveFields);
}

function filterObject(obj: any, fieldsToRemove: string[]): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const filtered = { ...obj };
  fieldsToRemove.forEach(field => delete filtered[field]);
  return filtered;
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Example 3: Add Permission Flags
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Enrich data with user-specific permissions
 */
export async function exampleAddPermissions(
  data: any,
  event: H3Event,
  auth: AuthContext | null
): Promise<any> {
  if (typeof data !== 'object' || data === null) return data;
  
  return {
    ...data,
    // Add permission flags
    canEdit: auth?.permissions.includes('resource:write') ?? false,
    canDelete: auth?.permissions.includes('resource:delete') ?? false,
    canShare: auth?.permissions.includes('resource:share') ?? false,
    
    // Add ownership check
    isOwner: auth?.userId === data.userId,
    
    // Add role-based flags
    isAdmin: auth?.roles.includes('admin') ?? false,
  };
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Example 4: Combine Multiple Sources
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Fetch additional data from other endpoints
 */
export async function exampleCombineSources(
  data: any,
  event: H3Event,
  auth: AuthContext | null
): Promise<any> {
  const config = useRuntimeConfig();
  
  // Example: Fetch related data
  // const reviews = await $fetch(\`\${config.apiBaseUrl}/reviews/\${data.id}\`);
  // const availability = await $fetch(\`\${config.apiBaseUrl}/availability/\${data.id}\`);
  
  return {
    ...data,
    // reviews,
    // availability,
  };
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Example 5: Permission-Based Filtering
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Show/hide fields based on user permissions
 */
export async function examplePermissionBasedFiltering(
  data: any,
  event: H3Event,
  auth: AuthContext | null
): Promise<any> {
  if (typeof data !== 'object' || data === null) return data;
  
  const result = { ...data };
  
  // Hide sensitive fields for non-admins
  if (!auth?.roles.includes('admin')) {
    delete result.internalNotes;
    delete result.costPrice;
    delete result.supplierInfo;
  }
  
  // Show detailed info only for specific permission
  if (!auth?.permissions.includes('resource:read:detailed')) {
    delete result.analytics;
    delete result.auditLog;
  }
  
  return result;
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Example 6: Array Transformation
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Transform each item in an array
 */
export async function exampleArrayTransform(
  data: any[],
  event: H3Event,
  auth: AuthContext | null
): Promise<any[]> {
  if (!Array.isArray(data)) return data;
  
  return data.map(item => ({
    ...item,
    // Add permission checks for each item
    canEdit: auth?.userId === item.ownerId,
    canDelete: auth?.roles.includes('admin') || auth?.userId === item.ownerId,
  }));
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Example 7: Error Handling
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Handle transformation errors gracefully
 */
export async function exampleErrorHandling(
  data: any,
  event: H3Event,
  auth: AuthContext | null
): Promise<any> {
  try {
    // Attempt transformation
    return {
      ...data,
      processed: true,
    };
  } catch (error) {
    console.error('Transformation error:', error);
    
    // Return original data on error
    return data;
  }
}
`;
}

/**
 * Generate BFF README file
 */
export function generateBffReadme(): string {
  return `# Backend for Frontend (BFF) - Transformers

This directory contains **transformer functions** that add business logic to your API routes.

## 🎯 What are Transformers?

Transformers allow you to add custom logic between the backend API and your Nuxt client:

\`\`\`
Client → Generated Route → Transformer → Backend API
                ↓
            Your Logic
\`\`\`

## 📂 File Structure

\`\`\`
server/
  auth/
    context.ts          ← Authentication logic (YOU implement once)
    types.ts            ← Auth types and helpers
  api/                  ← Generated routes (NEVER edit these)
    pet/
      [id].get.ts       ← Calls transformPet() automatically
  bff/
    transformers/       ← Your business logic (SAFE to edit)
      pet.ts            ← Transform pet data
      store.ts          ← Transform store data
    _transformers.example.ts ← Examples (regenerated for reference)
    README.md           ← This file
\`\`\`

## 🔒 Which Files Are Safe to Edit?

| File | Safe to Edit? | Regenerated? |
|------|---------------|--------------|
| \`server/auth/context.ts\` | ✅ YES | ❌ NO |
| \`server/auth/types.ts\` | ✅ YES | ❌ NO |
| \`server/bff/transformers/*.ts\` | ✅ YES | ❌ NO |
| \`server/api/**/*.ts\` | ❌ NO | ✅ YES |
| \`server/bff/_transformers.example.ts\` | ❌ NO | ✅ YES |

## 🚀 Quick Start

### 1. Implement Authentication (Optional)

Edit \`server/auth/context.ts\` and implement \`getAuthContext()\`:

\`\`\`typescript
// server/auth/context.ts
import { getServerSession } from '#auth';

export async function getAuthContext(event: H3Event): Promise<AuthContext> {
  const session = await getServerSession(event);
  
  return {
    isAuthenticated: !!session,
    userId: session?.user.id ?? null,
    roles: session?.user.roles ?? [],
    permissions: session?.user.permissions ?? [],
  };
}
\`\`\`

### 2. Add Transformation Logic

Edit transformer files in \`server/bff/transformers/\`:

\`\`\`typescript
// server/bff/transformers/pet.ts
export async function transformPet(
  data: any,
  event: H3Event,
  auth: AuthContext | null
): Promise<any> {
  // Add permission flags
  return {
    ...data,
    canEdit: auth?.permissions.includes('pet:write') ?? false,
    canDelete: auth?.permissions.includes('pet:delete') ?? false,
  };
}
\`\`\`

### 3. Use From Client

No changes needed - your generated routes automatically use transformers:

\`\`\`vue
<script setup>
const { data: pet } = await useFetch('/api/pet/123');

// pet.canEdit and pet.canDelete are now available!
</script>
\`\`\`

## 📚 Common Use Cases

### Filter Sensitive Data

\`\`\`typescript
export async function transformUser(data: any, event: H3Event, auth: AuthContext | null) {
  const { password, ssn, internalId, ...safe } = data;
  return safe;
}
\`\`\`

### Add Permission Flags

\`\`\`typescript
export async function transformPost(data: any, event: H3Event, auth: AuthContext | null) {
  return {
    ...data,
    canEdit: auth?.userId === data.authorId,
    canDelete: auth?.roles.includes('admin'),
  };
}
\`\`\`

### Combine Multiple Sources

\`\`\`typescript
export async function transformProduct(data: any, event: H3Event, auth: AuthContext | null) {
  const config = useRuntimeConfig();
  
  const [reviews, inventory] = await Promise.all([
    $fetch(\`\${config.apiBaseUrl}/reviews/\${data.id}\`),
    $fetch(\`\${config.apiBaseUrl}/inventory/\${data.id}\`),
  ]);
  
  return {
    ...data,
    reviews,
    inventory,
  };
}
\`\`\`

### Permission-Based Filtering

\`\`\`typescript
export async function transformReport(data: any, event: H3Event, auth: AuthContext | null) {
  const result = { ...data };
  
  // Hide sensitive data for non-admins
  if (!auth?.roles.includes('admin')) {
    delete result.financialDetails;
    delete result.internalNotes;
  }
  
  return result;
}
\`\`\`

## 🔄 Regeneration Safety

**IMPORTANT:** When you regenerate routes with the CLI:
- ✅ Transformer files are **PRESERVED**
- ✅ Auth context files are **PRESERVED**
- ❌ Generated routes are **OVERWRITTEN** (but this is OK!)

Your custom logic is always safe because it lives in separate files.

## 🎓 Best Practices

1. **Keep Transformers Pure**: Avoid side effects, focus on data transformation
2. **One Transformer Per Resource**: \`pet.ts\`, \`store.ts\`, etc.
3. **Use TypeScript**: Add proper types for better IntelliSense
4. **Document Your Logic**: Add comments explaining business rules
5. **Test Edge Cases**: Handle \`null\`, arrays, missing fields gracefully
6. **Performance**: Use \`Promise.all()\` for parallel fetches
7. **Security**: Always validate auth before accessing sensitive data

## 🆘 Troubleshooting

**Transformer not being called?**
- Check that the transformer file exists
- Verify the function name matches: \`transform{Resource}\`
- Check console for import errors

**Auth context is null?**
- Verify \`getAuthContext()\` is implemented in \`server/auth/context.ts\`
- Check for errors in the auth implementation
- Auth is optional - transformers work without it

**Types not working?**
- Ensure types are exported from \`~/types/api\`
- Add explicit type parameters to transformer functions
- Check TypeScript errors in the console

## 📖 Learn More

See \`_transformers.example.ts\` for more examples.
`;
}

/**
 * Extract base type name from a type string
 * Examples:
 *   "Pet" -> "Pet"
 *   "Pet[]" -> "Pet"
 *   "Array<Pet>" -> "Pet"
 */
function extractBaseType(typeString: string): string | null {
  // Remove array brackets
  let baseType = typeString.replace(/\[\]$/, '').replace(/^Array<(.+)>$/, '$1');

  // Remove whitespace
  baseType = baseType.trim();

  // Only return if it looks like a custom type (starts with capital)
  if (baseType && /^[A-Z]/.test(baseType)) {
    return baseType;
  }

  return null;
}
