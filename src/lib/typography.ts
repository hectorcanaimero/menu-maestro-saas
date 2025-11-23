/**
 * Typography Scale and Tokens
 *
 * Defines consistent typography across the application.
 * Mobile-first approach with responsive sizes.
 */

export const typography = {
  // Page titles (H1) - Used once per page
  h1: 'text-3xl sm:text-4xl font-bold tracking-tight',

  // Section titles (H2) - Major sections
  h2: 'text-2xl sm:text-3xl font-bold tracking-tight',

  // Subsection titles (H3)
  h3: 'text-xl sm:text-2xl font-semibold',

  // Card/Component titles (H4)
  h4: 'text-lg font-semibold',

  // Small headings (H5)
  h5: 'text-base font-semibold',

  // Body text variants
  body: {
    large: 'text-lg leading-relaxed',
    base: 'text-base leading-normal',
    small: 'text-sm leading-normal',
  },

  // Special text styles
  caption: 'text-xs text-muted-foreground',
  label: 'text-sm font-medium',
  code: 'font-mono text-sm bg-muted px-1.5 py-0.5 rounded',

  // Link styles
  link: 'text-primary underline-offset-4 hover:underline',
} as const;

export type TypographyVariant = keyof typeof typography;
export type BodySize = keyof typeof typography.body;
