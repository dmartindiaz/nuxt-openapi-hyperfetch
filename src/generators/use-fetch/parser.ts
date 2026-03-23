import { Project, SourceFile, MethodDeclaration, SyntaxKind, Node } from 'ts-morph';
import * as path from 'path';
import { existsSync, readdirSync } from 'node:fs';
import type { ApiClassInfo, MethodInfo } from './types.js';
import { pascalCase } from 'change-case';
import { p } from '../../cli/logger.js';

/**
 * Get all API files from the input directory
 */
export function getApiFiles(inputDir: string): string[] {
  const apisDir = path.join(inputDir, 'apis');

  if (!existsSync(apisDir)) {
    throw new Error(`APIs directory not found: ${apisDir}`);
  }

  const files = readdirSync(apisDir);
  return files
    .filter((file: string) => file.endsWith('.ts') && file !== 'index.ts')
    .map((file: string) => path.join(apisDir, file));
}

/**
 * Parse an API file and extract all methods
 */
export function parseApiFile(filePath: string): ApiClassInfo {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(filePath);

  // Find the API class (e.g., PetApi, StoreApi)
  const classes = sourceFile.getClasses();
  if (classes.length === 0) {
    throw new Error(`No class found in ${filePath}`);
  }

  const apiClass = classes[0];
  const className = apiClass.getName() || '';

  // Get all public methods (excluding Raw and RequestOpts)
  const methods = getPublicMethods(apiClass.getMethods());

  const methodInfos: MethodInfo[] = [];

  for (const method of methods) {
    try {
      const methodInfo = extractMethodInfo(method, sourceFile);
      if (methodInfo) {
        methodInfos.push(methodInfo);
      }
    } catch (error) {
      p.log.warn(`Could not parse method ${method.getName()}: ${String(error)}`);
    }
  }

  return {
    className,
    methods: methodInfos,
  };
}

/**
 * Filter to get only public methods (not Raw, not RequestOpts)
 */
function getPublicMethods(methods: MethodDeclaration[]): MethodDeclaration[] {
  return methods.filter((method) => {
    const name = method.getName();
    const isAsync = method.isAsync();
    const isPublic =
      !method.hasModifier(SyntaxKind.PrivateKeyword) &&
      !method.hasModifier(SyntaxKind.ProtectedKeyword);

    return isPublic && isAsync && !name.endsWith('Raw') && !name.endsWith('RequestOpts');
  });
}

/**
 * Extract method information
 */
function extractMethodInfo(method: MethodDeclaration, sourceFile: SourceFile): MethodInfo | null {
  const methodName = method.getName();
  const composableName = `useFetch${pascalCase(methodName)}`;

  // Get parameters
  const params = method.getParameters();
  let requestType = params.length > 0 ? params[0].getType().getText() : undefined;

  // Clean up type text: remove import() expressions and fix formatting
  if (requestType) {
    // Remove all import("path") expressions
    requestType = requestType.replace(/import\([^)]+\)\./g, '');

    // If it's the default RequestInit | InitOverrideFunction, treat as no params
    if (requestType === 'RequestInit | InitOverrideFunction') {
      requestType = undefined;
    }
  }

  // Get return type
  const returnType = method.getReturnType();
  const responseType = extractResponseType(returnType.getText());

  // Find corresponding RequestOpts method
  const requestOptsMethodName = `${methodName}RequestOpts`;
  const requestOptsMethod = sourceFile.getClasses()[0].getMethod(requestOptsMethodName);

  if (!requestOptsMethod) {
    p.log.warn(`Could not find ${requestOptsMethodName} method`);
    return null;
  }

  // Parse request options
  const requestOpts = parseRequestOptions(requestOptsMethod);

  // Get description from JSDoc
  const jsDocs = method.getJsDocs();
  const description = jsDocs.length > 0 ? jsDocs[0].getDescription().trim() : undefined;

  // Detect if Raw method exists
  const rawMethodName = `${methodName}Raw`;
  const classDeclaration = sourceFile.getClasses()[0];
  const hasRawMethod = classDeclaration.getMethod(rawMethodName) !== undefined;

  return {
    name: methodName,
    composableName,
    requestType,
    responseType,
    httpMethod: requestOpts.method,
    path: requestOpts.path,
    hasBody: requestOpts.hasBody,
    bodyField: requestOpts.bodyField,
    hasQueryParams: requestOpts.queryParams.length > 0,
    queryParams: requestOpts.queryParams,
    pathParams: extractPathParams(requestOpts.path),
    headers: requestOpts.headers,
    description,
    hasRawMethod,
    rawMethodName: hasRawMethod ? rawMethodName : undefined,
  };
}

/**
 * Extract response type from Promise<Type>
 */
function extractResponseType(returnTypeText: string): string {
  // Match Promise<Type>
  const match = returnTypeText.match(/Promise<(.+)>$/);
  if (match) {
    // Remove all import("path") expressions
    return match[1].replace(/import\([^)]+\)\./g, '');
  }
  return 'void';
}

/**
 * Parse the RequestOpts method to extract request details
 */
function parseRequestOptions(method: MethodDeclaration): {
  path: string;
  method: string;
  headers: Record<string, string>;
  hasBody: boolean;
  bodyField?: string;
  queryParams: string[];
} {
  const result = {
    path: '',
    method: 'GET',
    headers: {} as Record<string, string>,
    hasBody: false,
    bodyField: undefined as string | undefined,
    queryParams: [] as string[],
  };

  // Find the return statement
  const returnStatements = method.getDescendantsOfKind(SyntaxKind.ReturnStatement);
  if (returnStatements.length === 0) {
    return result;
  }

  const returnStmt = returnStatements[0];
  const objectLiteral = returnStmt.getFirstDescendantByKind(SyntaxKind.ObjectLiteralExpression);

  if (!objectLiteral) {
    return result;
  }

  // Parse each property
  for (const prop of objectLiteral.getProperties()) {
    if (prop.getKind() !== SyntaxKind.PropertyAssignment) {
      continue;
    }

    const propAssignment = prop.asKind(SyntaxKind.PropertyAssignment);
    if (!propAssignment) {
      continue;
    }

    const propName = propAssignment.getName();
    const initializer = propAssignment.getInitializer();

    if (!initializer) {
      continue;
    }

    switch (propName) {
      case 'path': {
        // Extract path from variable assignment
        const pathValue = extractStringValue(initializer, method);
        if (pathValue) {
          result.path = pathValue;
        }
        break;
      }
      case 'method': {
        const methodValue = extractStringValue(initializer, method);
        if (methodValue) {
          result.method = methodValue;
        }
        break;
      }
      case 'body': {
        result.hasBody = true;
        // Try to extract body field (e.g., params['pet'] or params.pet)
        const bodyText = initializer.getText();
        const bodyMatch = bodyText.match(/requestParameters(?:\['(\w+)'\]|\.(\w+))/);
        if (bodyMatch) {
          result.bodyField = bodyMatch[1] || bodyMatch[2];
        }
        break;
      }
      case 'headers': {
        // Extract headers if it's an object literal
        if (initializer.getKind() === SyntaxKind.ObjectLiteralExpression) {
          const headersObj = initializer.asKind(SyntaxKind.ObjectLiteralExpression);
          if (headersObj) {
            for (const headerProp of headersObj.getProperties()) {
              if (headerProp.getKind() === SyntaxKind.PropertyAssignment) {
                const headerAssignment = headerProp.asKind(SyntaxKind.PropertyAssignment);
                if (headerAssignment) {
                  const headerName = headerAssignment.getName();
                  const headerValue = headerAssignment.getInitializer();
                  if (headerValue && headerValue.getKind() === SyntaxKind.StringLiteral) {
                    result.headers[headerName] = headerValue.getText().slice(1, -1);
                  }
                }
              }
            }
          }
        }
        break;
      }
    }
  }

  // Extract query parameters from the method body
  result.queryParams = extractQueryParams(method);

  return result;
}

/**
 * Extract string value from expression
 */
function extractStringValue(node: Node, method: MethodDeclaration): string | null {
  // Direct string literal
  if (node.getKind() === SyntaxKind.StringLiteral) {
    return node.getText().slice(1, -1); // Remove quotes
  }

  // Template literal
  if (
    node.getKind() === SyntaxKind.TemplateExpression ||
    node.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral
  ) {
    return node.getText().slice(1, -1); // Remove backticks
  }

  // Variable reference - try to find its value
  if (node.getKind() === SyntaxKind.Identifier) {
    const varName = node.getText();

    // Find variable declarations in the method body
    const varDeclarations = method.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
    for (const varDecl of varDeclarations) {
      if (varDecl.getName() === varName) {
        const initializer = varDecl.getInitializer();
        if (initializer) {
          if (initializer.getKind() === SyntaxKind.StringLiteral) {
            return initializer.getText().slice(1, -1);
          }
          if (
            initializer.getKind() === SyntaxKind.TemplateExpression ||
            initializer.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral
          ) {
            return initializer.getText().slice(1, -1);
          }
        }
      }
    }
  }

  return null;
}

/**
 * Extract query parameters from method body
 */
function extractQueryParams(method: MethodDeclaration): string[] {
  const params: string[] = [];
  const methodText = method.getText();

  // Look for queryParameters['paramName'] or queryParameters.paramName
  const regex = /queryParameters(?:\['(\w+)'\]|\.(\w+))/g;
  let match;

  while ((match = regex.exec(methodText)) !== null) {
    const paramName = match[1] || match[2];
    if (paramName && !params.includes(paramName)) {
      params.push(paramName);
    }
  }

  return params;
}

/**
 * Extract path parameters from path string (e.g., /pet/{petId} -> ['petId'])
 */
function extractPathParams(path: string): string[] {
  const regex = /\{(\w+)\}/g;
  const params: string[] = [];
  let match;

  while ((match = regex.exec(path)) !== null) {
    params.push(match[1]);
  }

  return params;
}
