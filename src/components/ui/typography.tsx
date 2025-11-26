import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { typography, BodySize } from '@/lib/typography';

interface TypographyProps {
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * H1 - Page Title
 * Use once per page for the main heading
 */
export function H1({ children, className, as: Component = 'h1' }: TypographyProps) {
  return (
    <Component className={cn(typography.h1, className)}>
      {children}
    </Component>
  );
}

/**
 * H2 - Section Title
 * Use for major sections within a page
 */
export function H2({ children, className, as: Component = 'h2' }: TypographyProps) {
  return (
    <Component className={cn(typography.h2, className)}>
      {children}
    </Component>
  );
}

/**
 * H3 - Subsection Title
 * Use for subsections within major sections
 */
export function H3({ children, className, as: Component = 'h3' }: TypographyProps) {
  return (
    <Component className={cn(typography.h3, className)}>
      {children}
    </Component>
  );
}

/**
 * H4 - Card/Component Title
 * Use for card headings and component titles
 */
export function H4({ children, className, as: Component = 'h4' }: TypographyProps) {
  return (
    <Component className={cn(typography.h4, className)}>
      {children}
    </Component>
  );
}

/**
 * H5 - Small Heading
 * Use for small headings and labels
 */
export function H5({ children, className, as: Component = 'h5' }: TypographyProps) {
  return (
    <Component className={cn(typography.h5, className)}>
      {children}
    </Component>
  );
}

interface BodyProps extends TypographyProps {
  size?: BodySize;
}

/**
 * Body - Body Text
 * Use for all body text content
 */
export function Body({
  children,
  size = 'base',
  className,
  as: Component = 'p',
}: BodyProps) {
  return (
    <Component className={cn(typography.body[size], className)}>
      {children}
    </Component>
  );
}

/**
 * Caption - Small Helper Text
 * Use for captions, helper text, and metadata
 */
export function Caption({ children, className, as: Component = 'p' }: TypographyProps) {
  return (
    <Component className={cn(typography.caption, className)}>
      {children}
    </Component>
  );
}

/**
 * Label - Form Labels
 * Use for form field labels
 */
export function Label({ children, className, as: Component = 'label' }: TypographyProps) {
  return (
    <Component className={cn(typography.label, className)}>
      {children}
    </Component>
  );
}

/**
 * Code - Inline Code
 * Use for inline code snippets
 */
export function Code({ children, className, as: Component = 'code' }: TypographyProps) {
  return (
    <Component className={cn(typography.code, className)}>
      {children}
    </Component>
  );
}

/**
 * Link - Text Link
 * Use for text links
 */
export function Link({
  children,
  className,
  as: Component = 'a',
  ...props
}: TypographyProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Component className={cn(typography.link, className)} {...(props as any)}>
      {children}
    </Component>
  );
}
