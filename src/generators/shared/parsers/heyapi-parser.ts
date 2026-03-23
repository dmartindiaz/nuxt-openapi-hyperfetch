import { Project, SyntaxKind, type SourceFile, type TypeAliasDeclaration } from 'ts-morph';
import * as path from 'path';
import { existsSync, readFileSync } from 'node:fs';
import type { ApiClassInfo, MethodInfo } from '../types.js';
import { pascalCase } from 'change-case';
import { p } from '../../../cli/logger.js';

interface SdkOpInfo {
  httpMethod: string;
  description?: string;
  headers: Record<string, string>;
}

/**
 * Get Hey API generated files from the output directory.
 * Returns the sdk.gen.ts path — the single entry point for all operations.
 */
export function getApiFiles(inputDir: string): string[] {
  const sdkFile = path.join(inputDir, 'sdk.gen.ts');

  if (!existsSync(sdkFile)) {
    throw new Error(
      `Hey API output not found: ${sdkFile}\nMake sure to run @hey-api/openapi-ts before generating composables.`
    );
  }

  return [sdkFile];
}

/**
 * Parse Hey API generated files and return all operations as ApiClassInfo.
 * Reads both sdk.gen.ts (for HTTP method + description) and types.gen.ts (for param/response types).
 */
export function parseApiFile(sdkFilePath: string): ApiClassInfo {
  const inputDir = path.dirname(sdkFilePath);
  const typesFilePath = path.join(inputDir, 'types.gen.ts');

  if (!existsSync(typesFilePath)) {
    throw new Error(`types.gen.ts not found in ${inputDir}`);
  }

  // Parse types.gen.ts with ts-morph to read type declarations
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const typesFile = project.addSourceFileAtPath(typesFilePath);

  // Build operation info map from sdk.gen.ts using text parsing
  const sdkText = readFileSync(sdkFilePath, 'utf-8');
  const opMap = buildOperationMap(sdkText);

  const methodInfos: MethodInfo[] = [];

  // Iterate over all *Data type aliases — each represents one API operation
  for (const typeAlias of typesFile.getTypeAliases()) {
    const name = typeAlias.getName();

    // Skip non-operation types (ClientOptions, etc.)
    if (!name.endsWith('Data') || name === 'ClientOptions') {
      continue;
    }

    const baseName = name.slice(0, -4); // 'AddPetData' → 'AddPet'
    const opName = baseName.charAt(0).toLowerCase() + baseName.slice(1); // 'addPet'

    try {
      const methodInfo = extractMethodInfo(typeAlias, typesFile, baseName, opName, opMap);
      if (methodInfo) {
        methodInfos.push(methodInfo);
      }
    } catch (error) {
      p.log.warn(`Could not parse Hey API operation "${opName}": ${String(error)}`);
    }
  }

  return { className: 'Api', methods: methodInfos };
}

/**
 * Build a map of operation name → SdkOpInfo by text-parsing sdk.gen.ts.
 * Extracts HTTP method, JSDoc description, and Content-Type header.
 */
function buildOperationMap(sdkText: string): Map<string, SdkOpInfo> {
  const map = new Map<string, SdkOpInfo>();
  const lines = sdkText.split('\n');

  let jsDocLines: string[] = [];
  let inJsDoc = false;
  let pendingDescription: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '/**') {
      inJsDoc = true;
      jsDocLines = [line];
      continue;
    }

    if (inJsDoc) {
      jsDocLines.push(line);
      if (trimmed === '*/') {
        inJsDoc = false;
        pendingDescription = parseJsDocDescription(jsDocLines.join('\n'));
      }
      continue;
    }

    // Match: export const funcName =
    const funcMatch = line.match(/^export const (\w+) =/);
    if (funcMatch) {
      const funcName = funcMatch[1];

      // Scan ahead a few lines to find the HTTP method call
      const snippet = lines.slice(i, Math.min(i + 8, lines.length)).join('\n');
      const methodMatch = snippet.match(/\.(post|get|put|delete|patch)</i);
      const httpMethod = methodMatch ? methodMatch[1].toUpperCase() : 'GET';

      // Detect Content-Type header
      const headers: Record<string, string> = {};
      if (snippet.includes("'Content-Type': 'application/json'")) {
        headers['Content-Type'] = 'application/json';
      } else if (snippet.includes("'Content-Type': 'application/octet-stream'")) {
        headers['Content-Type'] = 'application/octet-stream';
      }

      map.set(funcName, { httpMethod, description: pendingDescription, headers });
      pendingDescription = undefined;
      jsDocLines = [];
    }
  }

  return map;
}

/**
 * Extract the first meaningful line from a JSDoc comment block.
 */
function parseJsDocDescription(jsDoc: string): string | undefined {
  for (const line of jsDoc.split('\n')) {
    const cleaned = line.replace(/^\s*[/*]+\s?/, '').trim();
    if (cleaned && !cleaned.startsWith('@')) {
      return cleaned;
    }
  }
  return undefined;
}

/**
 * Convert a *Data TypeAliasDeclaration into a MethodInfo object.
 */
function extractMethodInfo(
  typeAlias: TypeAliasDeclaration,
  typesFile: SourceFile,
  baseName: string,
  opName: string,
  opMap: Map<string, SdkOpInfo>
): MethodInfo | null {
  const dataTypeName = typeAlias.getName(); // e.g. 'AddPetData'

  const opInfo = opMap.get(opName);
  if (!opInfo) {
    p.log.warn(`Operation "${opName}" not found in sdk.gen.ts — skipping`);
    return null;
  }

  const typeNode = typeAlias.getTypeNode();
  if (!typeNode || typeNode.getKind() !== SyntaxKind.TypeLiteral) {
    return null;
  }

  const typeLiteral = typeNode.asKind(SyntaxKind.TypeLiteral);
  if (!typeLiteral) {
    return null;
  }

  let urlPath = '';
  let hasBody = false;
  let pathParams: string[] = [];
  let queryParams: string[] = [];
  let hasQueryParams = false;

  for (const member of typeLiteral.getMembers()) {
    if (member.getKind() !== SyntaxKind.PropertySignature) {
      continue;
    }

    const propSig = member.asKind(SyntaxKind.PropertySignature);
    if (!propSig) {
      continue;
    }

    const propName = propSig.getName();
    const typeNodeText = propSig.getTypeNode()?.getText() ?? '';

    switch (propName) {
      case 'url':
        // String literal type: "'/pet'" → strip quotes → '/pet'
        urlPath = typeNodeText.replace(/^['"`]|['"`]$/g, '');
        break;

      case 'body':
        if (typeNodeText !== 'never') {
          hasBody = true;
        }
        break;

      case 'path': {
        if (typeNodeText !== 'never') {
          const pathTypeNode = propSig.getTypeNode();
          if (pathTypeNode && pathTypeNode.getKind() === SyntaxKind.TypeLiteral) {
            const innerLiteral = pathTypeNode.asKind(SyntaxKind.TypeLiteral);
            if (innerLiteral) {
              pathParams = innerLiteral
                .getMembers()
                .filter((m) => m.getKind() === SyntaxKind.PropertySignature)
                .map((m) => m.asKind(SyntaxKind.PropertySignature)!.getName());
            }
          }
        }
        break;
      }

      case 'query': {
        if (typeNodeText !== 'never') {
          const queryTypeNode = propSig.getTypeNode();
          if (queryTypeNode && queryTypeNode.getKind() === SyntaxKind.TypeLiteral) {
            const innerLiteral = queryTypeNode.asKind(SyntaxKind.TypeLiteral);
            if (innerLiteral) {
              queryParams = innerLiteral
                .getMembers()
                .filter((m) => m.getKind() === SyntaxKind.PropertySignature)
                .map((m) => m.asKind(SyntaxKind.PropertySignature)!.getName());
              hasQueryParams = queryParams.length > 0;
            }
          }
        }
        break;
      }
    }
  }

  if (!urlPath) {
    return null;
  }

  // Extract response type from the matching *Responses type alias
  const responsesAlias = typesFile.getTypeAlias(`${baseName}Responses`);
  const responseType = responsesAlias ? extractResponseType(responsesAlias) : 'void';

  // Only set requestType if the operation actually requires input params
  const hasParams = hasBody || pathParams.length > 0 || hasQueryParams;
  const requestType = hasParams ? dataTypeName : undefined;

  return {
    name: opName,
    composableName: `useFetch${pascalCase(opName)}`,
    requestType,
    responseType,
    httpMethod: opInfo.httpMethod,
    path: urlPath,
    hasBody,
    bodyField: hasBody ? 'body' : undefined,
    hasQueryParams,
    queryParams,
    pathParams,
    headers: opInfo.headers,
    description: opInfo.description,
    hasRawMethod: false,
    rawMethodName: undefined,
    paramsShape: 'nested',
  };
}

/**
 * Extract the success (2xx) response type from a *Responses type alias.
 * Maps `unknown` to `void` for operations with no meaningful response body.
 */
function extractResponseType(responsesAlias: TypeAliasDeclaration): string {
  const typeNode = responsesAlias.getTypeNode();
  if (!typeNode || typeNode.getKind() !== SyntaxKind.TypeLiteral) {
    return 'void';
  }

  const typeLiteral = typeNode.asKind(SyntaxKind.TypeLiteral);
  if (!typeLiteral) {
    return 'void';
  }

  for (const member of typeLiteral.getMembers()) {
    if (member.getKind() !== SyntaxKind.PropertySignature) {
      continue;
    }

    const propSig = member.asKind(SyntaxKind.PropertySignature);
    if (!propSig) {
      continue;
    }

    const memberName = propSig.getName();
    if (memberName === '200' || memberName === '201' || memberName === '202') {
      const typeText = propSig.getTypeNode()?.getText() ?? '';
      return typeText === 'unknown' || typeText === '' ? 'void' : typeText;
    }
  }

  return 'void';
}
