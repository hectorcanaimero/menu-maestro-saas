import { ReactNode } from 'react';
import { cn, spacing, SpacingSize } from '@/lib/design-tokens';

interface InlineProps {
  /**
   * Horizontal spacing between children
   * @default 'normal'
   */
  gap?: SpacingSize;
  /**
   * Children elements to display inline
   */
  children: ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Vertical alignment of children
   * @default 'center'
   */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /**
   * Horizontal alignment of children
   * @default 'start'
   */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /**
   * Allow wrapping of children
   * @default false
   */
  wrap?: boolean;
  /**
   * HTML element to render
   * @default 'div'
   */
  as?: 'div' | 'section' | 'nav' | 'header' | 'footer';
}

/**
 * Inline Component
 *
 * Provides consistent horizontal spacing between child elements.
 * Uses flexbox layout with the spacing design tokens.
 *
 * @example
 * ```tsx
 * <Inline gap="normal" align="center">
 *   <Button>Action 1</Button>
 *   <Button>Action 2</Button>
 * </Inline>
 * ```
 */
export function Inline({
  gap = 'normal',
  children,
  className,
  align = 'center',
  justify = 'start',
  wrap = false,
  as: Component = 'div',
}: InlineProps) {
  const gapClass = spacing.inline[gap];

  const alignClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  }[align];

  const justifyClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  }[justify];

  const wrapClass = wrap ? 'flex-wrap' : '';

  return (
    <Component className={cn('flex', gapClass, alignClass, justifyClass, wrapClass, className)}>
      {children}
    </Component>
  );
}
