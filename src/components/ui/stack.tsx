import { ReactNode } from 'react';
import { cn, spacing, SpacingSize } from '@/lib/design-tokens';

interface StackProps {
  /**
   * Vertical spacing between children
   * @default 'normal'
   */
  gap?: SpacingSize;
  /**
   * Children elements to stack vertically
   */
  children: ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * HTML element to render
   * @default 'div'
   */
  as?: 'div' | 'section' | 'article' | 'aside' | 'nav';
}

/**
 * Stack Component
 *
 * Provides consistent vertical spacing between child elements.
 * Uses the spacing design tokens for visual consistency.
 *
 * @example
 * ```tsx
 * <Stack gap="normal">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Stack>
 * ```
 */
export function Stack({
  gap = 'normal',
  children,
  className,
  as: Component = 'div',
}: StackProps) {
  const gapClass = spacing.stack[gap];

  return <Component className={cn(gapClass, className)}>{children}</Component>;
}
