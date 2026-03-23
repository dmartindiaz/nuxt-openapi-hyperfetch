/**
 * Utility functions for CLI operations
 */
import * as p from '@clack/prompts';
import { MESSAGES } from './messages.js';

/**
 * Handle cancellation uniformly across all prompts
 * This function never returns - it exits the process
 */
export function handleCancel(): never {
  p.cancel(MESSAGES.outro.cancelled);
  process.exit(0);
}

/**
 * Check if user cancelled the prompt and exit if so
 * Use this after every prompt to handle Ctrl+C gracefully
 *
 * @param value - The value returned from a prompt
 *
 * @example
 * const result = await p.text({ message: 'Enter name' });
 * checkCancellation(result);
 * // Now we know result is not a cancel symbol
 */
export function checkCancellation(value: unknown): void {
  if (p.isCancel(value)) {
    handleCancel();
  }
}

/**
 * Format a file path for display in messages
 * Normalizes path separators and removes trailing slashes
 */
export function formatPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/$/, '');
}

/**
 * Validate that a path is not empty
 */
export function validateNonEmpty(value: string | undefined): string | undefined {
  if (!value || value.trim() === '') {
    return 'This field is required';
  }
  return undefined;
}
