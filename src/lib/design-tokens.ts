/**
 * Design Tokens - Spacing System
 *
 * Centralized spacing configuration for consistent UI across the application.
 * Based on mobile-first principles with responsive breakpoints.
 */

export const spacing = {
  // Component padding (internal spacing)
  card: {
    mobile: 'p-4',
    desktop: 'sm:p-6',
    combined: 'p-4 sm:p-6',
  },
  dialog: {
    mobile: 'p-4',
    desktop: 'sm:p-6',
    combined: 'p-4 sm:p-6',
  },
  sheet: {
    mobile: 'p-4',
    desktop: 'sm:p-6',
    combined: 'p-4 sm:p-6',
  },
  page: {
    mobile: 'px-4 py-6',
    desktop: 'sm:px-6 sm:py-8',
    combined: 'px-4 py-6 sm:px-6 sm:py-8',
  },
  section: {
    mobile: 'px-4 py-4',
    desktop: 'sm:px-6 sm:py-6',
    combined: 'px-4 py-4 sm:px-6 sm:py-6',
  },

  // Stack spacing (vertical)
  stack: {
    tight: 'space-y-2',
    normal: 'space-y-4',
    loose: 'space-y-6',
    relaxed: 'space-y-8',
  },

  // Inline spacing (horizontal - flex gap)
  inline: {
    tight: 'gap-2',
    normal: 'gap-4',
    loose: 'gap-6',
    relaxed: 'gap-8',
  },

  // Grid spacing
  grid: {
    tight: 'gap-3',
    normal: 'gap-4',
    loose: 'gap-6',
    relaxed: 'gap-8',
  },

  // Margin spacing (external spacing)
  margin: {
    section: 'mb-6 sm:mb-8',
    element: 'mb-4',
    tight: 'mb-2',
  },
} as const;

/**
 * Utility function to combine class names
 * Filters out undefined and false values
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Type helpers for spacing values
 */
export type SpacingSize = 'tight' | 'normal' | 'loose' | 'relaxed';
export type StackGap = typeof spacing.stack[SpacingSize];
export type InlineGap = typeof spacing.inline[SpacingSize];
export type GridGap = typeof spacing.grid[SpacingSize];
