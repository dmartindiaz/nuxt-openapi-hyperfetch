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
