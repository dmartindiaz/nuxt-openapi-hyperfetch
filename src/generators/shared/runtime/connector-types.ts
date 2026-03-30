/**
 * connector-types.ts — Structural return type interfaces for the 4 runtime connectors.
 *
 * Uses locally-defined minimal type aliases for Ref/ComputedRef/ShallowRef so this
 * file compiles in the CLI context (where Vue is not installed) and remains
 * structurally compatible with Vue's actual types in the user's Nuxt project.
 *
 * Copied to the user's project alongside the generated connectors and runtime helpers.
 */

// Minimal structural aliases — compatible with Vue's Ref<T>, ComputedRef<T>, ShallowRef<T>.
// These are intentionally kept as simple as possible to avoid coupling to Vue's internals.
type Ref<T> = { value: T };
type ShallowRef<T> = { value: T };
type ComputedRef<T> = { readonly value: T };

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
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPerPage: (n: number) => void;
}

// ─── ListConnectorReturn ──────────────────────────────────────────────────────

export interface ListConnectorReturn<TRow = unknown> {
  // State
  rows: ComputedRef<TRow[]>;
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
  onRowSelect: (row: TRow) => void;
  clearSelection: () => void;

  // Actions
  refresh: () => void;

  // CRUD coordination — public methods
  create: () => void;
  update: (row: TRow) => void;
  remove: (row: TRow) => void;

  // CRUD coordination — internal triggers (watch in the parent component)
  _createTrigger: Ref<number>;
  _updateTarget: ShallowRef<TRow | null>;
  _deleteTarget: ShallowRef<TRow | null>;
}

// ─── DetailConnectorReturn ────────────────────────────────────────────────────

export interface DetailConnectorReturn<TItem = unknown> {
  // State
  item: ComputedRef<TItem | null>;
  loading: ComputedRef<boolean>;
  error: ComputedRef<unknown>;
  fields: ComputedRef<FormFieldDef[]>;

  // Actions
  load: (id: string | number) => Promise<void>;
  clear: () => void;

  // Internals (advanced use)
  _composable: unknown;
  _currentId: Ref<string | number | null>;
}

// ─── FormConnectorReturn ──────────────────────────────────────────────────────

export interface FormConnectorReturn<TInput = Record<string, unknown>> {
  // State
  model: Ref<Partial<TInput>>;
  errors: Ref<Record<string, string[]>>;
  loading: Ref<boolean>;
  submitError: Ref<unknown>;
  submitted: Ref<boolean>;
  isValid: ComputedRef<boolean>;
  hasErrors: ComputedRef<boolean>;
  fields: ComputedRef<FormFieldDef[]>;

  // Callbacks (developer-assignable)
  onSuccess: Ref<((data: unknown) => void) | null>;
  onError: Ref<((err: unknown) => void) | null>;

  // Actions
  submit: () => Promise<void>;
  reset: () => void;
  setValues: (data: Partial<TInput>) => void;
}

// ─── DeleteConnectorReturn ────────────────────────────────────────────────────

export interface DeleteConnectorReturn<TItem = unknown> {
  // State
  target: Ref<TItem | null>;
  isOpen: Ref<boolean>;
  loading: Ref<boolean>;
  error: Ref<unknown>;
  hasTarget: ComputedRef<boolean>;

  // Callbacks (developer-assignable)
  onSuccess: Ref<((item: TItem) => void) | null>;
  onError: Ref<((err: unknown) => void) | null>;

  // Actions
  setTarget: (item: TItem) => void;
  cancel: () => void;
  confirm: () => Promise<void>;
}
