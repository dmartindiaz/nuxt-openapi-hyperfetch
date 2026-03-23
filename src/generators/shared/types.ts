/**
 * Shared types used by multiple generators
 */

export interface MethodInfo {
  name: string; // 'addPet'
  composableName: string; // 'useFetchAddPet' or 'useAsyncDataAddPet'
  requestType?: string; // 'AddPetRequest'
  responseType: string; // 'Pet'
  httpMethod: string; // 'POST' | 'GET' | 'PUT' | 'DELETE' | 'PATCH'
  path: string; // '/pet' or '/pet/{petId}'
  hasBody: boolean; // true if method uses body
  bodyField?: string; // 'pet' (from params.pet)
  hasQueryParams: boolean; // true if has query parameters
  queryParams: string[]; // ['status', 'tags']
  pathParams: string[]; // ['petId']
  headers: Record<string, string>; // Default headers
  description?: string; // Method description from comments
  hasRawMethod: boolean; // true if xxxRaw method exists
  rawMethodName?: string; // 'addPetRaw'
  paramsShape?: 'flat' | 'nested'; // 'flat' for official generator, 'nested' for Hey API
}

export interface ApiClassInfo {
  className: string; // 'PetApi'
  methods: MethodInfo[];
}
