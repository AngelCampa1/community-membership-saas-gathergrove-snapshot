/**
 * Mock implementation for @/lib/utils
 */

export function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}