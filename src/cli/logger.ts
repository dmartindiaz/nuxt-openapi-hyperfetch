/**
 * Centralized logging utilities using @clack/prompts
 * Re-exports @clack for easy use across the project
 */
import * as p from '@clack/prompts';

/**
 * Re-export @clack/prompts for consistent usage
 */
export { p };

/**
 * Create and manage a spinner for long operations
 *
 * @example
 * const spinner = createSpinner();
 * spinner.start('Processing files');
 * // do work
 * spinner.stop('Files processed');
 */
export function createSpinner() {
  return p.spinner();
}

/**
 * Log a success message (replaces console.log with ✓)
 */
export function logSuccess(message: string) {
  p.log.success(message);
}

/**
 * Log an error message
 */
export function logError(message: string) {
  p.log.error(message);
}

/**
 * Log a warning message
 */
export function logWarning(message: string) {
  p.log.warn(message);
}

/**
 * Log an info message
 */
export function logInfo(message: string) {
  p.log.info(message);
}

/**
 * Display a note/box with multiple lines of information
 * Great for "Next steps" sections
 */
export function logNote(message: string, title?: string) {
  p.note(message, title);
}

/**
 * Display section separator
 */
export function logStep(message: string) {
  p.log.step(message);
}

// ---------------------------------------------------------------------------
// Logger abstraction — allows generators to run in both CLI and Nuxt module
// ---------------------------------------------------------------------------

/**
 * Abstract logger interface used by generators.
 * Decouples generator output from @clack/prompts so the same generators work
 * in the interactive CLI and in the Nuxt module (where clack is irrelevant).
 */
export interface Logger {
  spinner(): { start(msg: string): void; stop(msg: string): void };
  log: {
    warn(msg: string): void;
    info(msg: string): void;
    success(msg: string): void;
    error(msg: string): void;
  };
  note(msg: string, title?: string): void;
}

/**
 * Creates a Logger backed by @clack/prompts — used by the CLI.
 */
export function createClackLogger(): Logger {
  return {
    spinner: () => p.spinner(),
    log: {
      warn: (msg) => p.log.warn(msg),
      info: (msg) => p.log.info(msg),
      success: (msg) => p.log.success(msg),
      error: (msg) => p.log.error(msg),
    },
    note: (msg, title) => p.note(msg, title),
  };
}

/**
 * Creates a Logger backed by console — used by the Nuxt module.
 */
export function createConsoleLogger(): Logger {
  const prefix = '[nuxt-openapi-hyperfetch]';
  return {
    spinner() {
      return {
        start: (msg: string) => console.log(`${prefix} ⏳ ${msg}`),
        stop: (msg: string) => console.log(`${prefix} ✓ ${msg}`),
      };
    },
    log: {
      warn: (msg) => console.warn(`${prefix} ⚠ ${msg}`),
      info: (msg) => console.info(`${prefix} ℹ ${msg}`),
      success: (msg) => console.log(`${prefix} ✓ ${msg}`),
      error: (msg) => console.error(`${prefix} ✗ ${msg}`),
    },
    note: (msg, title) => console.log(title ? `\n${prefix} ${title}:\n${msg}\n` : `\n${msg}\n`),
  };
}
