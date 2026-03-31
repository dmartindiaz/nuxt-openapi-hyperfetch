/**
 * connector-types.ts — Structural return type interfaces for the new connector system.
 *
 * Uses locally-defined minimal type aliases for Ref/ComputedRef so this file compiles
 * in the CLI context (where Vue is not installed) and remains structurally compatible
 * with Vue's actual types in the user's Nuxt project.
 *
 * Copied to the user's project alongside the generated connectors and runtime helpers.
 */

// Minimal structural aliases — compatible with Vue's Ref<T> and ComputedRef<T>.
type Ref<T> = { value: T };
type ComputedRef<T> = { readonly value: T };

/** Operation name passed as context to connector-level callbacks. */
export type ConnectorOperation = 'create' | 'update' | 'delete' | 'get' | 'getAll';

export interface ConnectorCallbackContext {
  operation: ConnectorOperation;
}

// ─── Column / field defs (mirrors schema-analyzer output) ────────────────────

export interface ColumnDef {
  key: string;
  label: string;
  type: string;
}

export interface FormFieldDef {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  hidden?: boolean;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationState {
  currentPage: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPerPage: (n: number) => void;
}

// ─── UI state (shared sub-object in create / update / del) ───────────────────

export interface ConnectorUi {
  isOpen: Ref<boolean>;
  open: (...args: any[]) => void;
  close: () => void;
}

// ─── GetAllConnectorReturn ────────────────────────────────────────────────────

export interface GetAllConnectorReturn<TRow = unknown> {
  // State
  items: ComputedRef<TRow[]>;
  columns: ComputedRef<ColumnDef[]>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<unknown>;

  // Pagination
  pagination: ComputedRef<PaginationState | null>;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPerPage: (n: number) => void;

  // Selection
  selected: Ref<TRow[]>;
  select: (item: TRow) => void;
  deselect: (item: TRow) => void;
  toggleSelect: (item: TRow) => void;
  clearSelection: () => void;

  // Actions
  load: (params?: unknown) => Promise<void>;

  // Callbacks (developer-assignable)
  onSuccess: Ref<((items: TRow[]) => void) | null>;
  onError: Ref<((err: unknown) => void) | null>;
}

// ─── GetConnectorReturn ───────────────────────────────────────────────────────

export interface GetConnectorReturn<TItem = unknown> {
  // State
  data: Ref<TItem | null>;
  loading: Ref<boolean>;
  error: Ref<unknown>;
  fields: ComputedRef<FormFieldDef[]>;

  // Actions
  load: (id: string | number) => Promise<TItem>;
  clear: () => void;

  // Callbacks (developer-assignable via get.onSuccess(fn))
  // The per-operation callback complements the connector-level onSuccess option.
  onSuccess: (fn: (item: TItem) => void) => void;
  onError: (fn: (err: unknown) => void) => void;
}

// ─── CreateConnectorReturn ────────────────────────────────────────────────────

export interface CreateConnectorReturn<TInput = Record<string, unknown>, TOutput = TInput> {
  // Form state
  model: Ref<Partial<TInput>>;
  errors: Ref<Record<string, string[]>>;
  loading: Ref<boolean>;
  error: Ref<unknown>;
  submitted: Ref<boolean>;
  isValid: ComputedRef<boolean>;
  hasErrors: ComputedRef<boolean>;
  fields: ComputedRef<FormFieldDef[]>;

  // Actions
  execute: (data?: Partial<TInput>) => Promise<TOutput | undefined>;
  refresh: (data?: Partial<TInput>) => Promise<TOutput | undefined>;
  reset: () => void;
  setValues: (data: Partial<TInput>) => void;
  setField: (key: keyof TInput, value: unknown) => void;

  // Callbacks (developer-assignable via create.onSuccess(fn))
  // The per-operation callback complements the connector-level onSuccess option.
  onSuccess: (fn: (data: TOutput) => void) => void;
  onError: (fn: (err: unknown) => void) => void;

  // UI coordination
  ui: {
    isOpen: Ref<boolean>;
    open: () => void;
    close: () => void;
  };
}

// ─── UpdateConnectorReturn ────────────────────────────────────────────────────

export interface UpdateConnectorReturn<TInput = Record<string, unknown>, TOutput = TInput> {
  // Form state
  model: Ref<Partial<TInput>>;
  errors: Ref<Record<string, string[]>>;
  loading: Ref<boolean>;
  error: Ref<unknown>;
  submitted: Ref<boolean>;
  isValid: ComputedRef<boolean>;
  hasErrors: ComputedRef<boolean>;
  fields: ComputedRef<FormFieldDef[]>;
  targetId: Ref<string | number | null>;

  // Actions
  load: (id: string | number) => Promise<void>;
  execute: (id: string | number, data?: Partial<TInput>) => Promise<TOutput | undefined>;
  refresh: (id: string | number, data?: Partial<TInput>) => Promise<TOutput | undefined>;
  reset: () => void;
  setValues: (data: Partial<TInput>) => void;
  setField: (key: keyof TInput, value: unknown) => void;

  // Callbacks (developer-assignable via update.onSuccess(fn))
  // The per-operation callback complements the connector-level onSuccess option.
  onSuccess: (fn: (data: TOutput) => void) => void;
  onError: (fn: (err: unknown) => void) => void;

  // UI coordination
  ui: {
    isOpen: Ref<boolean>;
    open: (item?: Partial<TInput> & Record<string, unknown>) => void;
    close: () => void;
  };
}

// ─── DeleteConnectorReturn ────────────────────────────────────────────────────

export interface DeleteConnectorReturn<TItem = unknown> {
  // State
  staged: Ref<TItem | null>;
  hasStaged: ComputedRef<boolean>;
  loading: Ref<boolean>;
  error: Ref<unknown>;

  // Actions
  stage: (item: TItem) => void;
  cancel: () => void;
  execute: (item?: TItem) => Promise<void>;
  refresh: (item?: TItem) => Promise<void>;

  // Callbacks (developer-assignable via remove.onSuccess(fn))
  // The per-operation callback complements the connector-level onSuccess option.
  onSuccess: (fn: (item: TItem) => void) => void;
  onError: (fn: (err: unknown) => void) => void;

  // UI coordination
  ui: {
    isOpen: Ref<boolean>;
    open: (item: TItem) => void;
    close: () => void;
  };
}
