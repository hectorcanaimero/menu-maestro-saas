# Spacing System

This document describes the spacing design system used throughout the PideAI application.

## Overview

We use a consistent spacing system based on design tokens to ensure visual consistency across all components. The system is mobile-first and responsive.

## Design Tokens

Located in `src/lib/design-tokens.ts`, our spacing tokens are organized by usage:

### Component Padding

**Cards**: `p-4 sm:p-6`
- Mobile: 16px padding
- Desktop: 24px padding
- Usage: All `Card` components

**Dialogs/Sheets**: `p-4 sm:p-6`
- Mobile: 16px padding
- Desktop: 24px padding
- Usage: Modal dialogs, bottom sheets

**Pages**: `px-4 py-6 sm:px-6 sm:py-8`
- Mobile: 16px horizontal, 24px vertical
- Desktop: 24px horizontal, 32px vertical
- Usage: Main page containers

### Spacing Between Elements

**Stack (Vertical)**:
- `tight`: `space-y-2` (8px)
- `normal`: `space-y-4` (16px)
- `loose`: `space-y-6` (24px)
- `relaxed`: `space-y-8` (32px)

**Inline (Horizontal - Flexbox)**:
- `tight`: `gap-2` (8px)
- `normal`: `gap-4` (16px)
- `loose`: `gap-6` (24px)
- `relaxed`: `gap-8` (32px)

**Grid**:
- `tight`: `gap-3` (12px)
- `normal`: `gap-4` (16px)
- `loose`: `gap-6` (24px)
- `relaxed`: `gap-8` (32px)

## Components

### Stack Component

Use `Stack` for consistent vertical spacing between elements.

```tsx
import { Stack } from '@/components/ui/stack';

<Stack gap="normal">
  <div>Element 1</div>
  <div>Element 2</div>
  <div>Element 3</div>
</Stack>
```

**Props**:
- `gap`: 'tight' | 'normal' | 'loose' | 'relaxed' (default: 'normal')
- `className`: Additional CSS classes
- `as`: HTML element ('div' | 'section' | 'article' | 'aside' | 'nav')

### Inline Component

Use `Inline` for consistent horizontal spacing in flex layouts.

```tsx
import { Inline } from '@/components/ui/inline';

<Inline gap="normal" align="center" justify="between">
  <Button>Cancel</Button>
  <Button>Confirm</Button>
</Inline>
```

**Props**:
- `gap`: 'tight' | 'normal' | 'loose' | 'relaxed' (default: 'normal')
- `align`: 'start' | 'center' | 'end' | 'stretch' | 'baseline' (default: 'center')
- `justify`: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' (default: 'start')
- `wrap`: boolean (default: false)
- `className`: Additional CSS classes
- `as`: HTML element ('div' | 'section' | 'nav' | 'header' | 'footer')

## Usage Examples

### Card with Consistent Spacing

```tsx
<Card className={spacing.card.combined}>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Stack gap="normal">
      <p>Content line 1</p>
      <p>Content line 2</p>
    </Stack>
  </CardContent>
</Card>
```

### Form with Inline Buttons

```tsx
<Stack gap="normal">
  <Input label="Name" />
  <Input label="Email" />

  <Inline gap="normal" justify="end">
    <Button variant="outline">Cancel</Button>
    <Button>Submit</Button>
  </Inline>
</Stack>
```

### Grid Layout

```tsx
<div className={cn(spacing.grid.normal, 'grid grid-cols-2 md:grid-cols-3')}>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>
```

## Migration Guide

### Before (Inconsistent)

```tsx
// Inconsistent padding
<Card className="p-3">...</Card>
<Card className="p-4">...</Card>
<Card className="sm:p-6">...</Card>

// Inconsistent gaps
<div className="space-y-3">...</div>
<div className="space-y-4">...</div>
<div className="space-y-6">...</div>
```

### After (Consistent)

```tsx
// Consistent padding using tokens
<Card className={spacing.card.combined}>...</Card>

// Consistent gaps using Stack
<Stack gap="normal">...</Stack>
<Stack gap="tight">...</Stack>
<Stack gap="loose">...</Stack>
```

## Best Practices

1. **Always use design tokens**: Don't use arbitrary spacing values
2. **Use Stack/Inline components**: Instead of manual `space-y-*` or `gap-*`
3. **Mobile-first**: Tokens are already responsive
4. **Semantic naming**: Choose gap size based on visual hierarchy, not pixel values
5. **Consistency over customization**: Stick to the system unless there's a specific design reason

## Spacing Scale

Our spacing scale follows a predictable pattern:

- `tight`: 8px (0.5rem)
- `normal`: 16px (1rem)
- `loose`: 24px (1.5rem)
- `relaxed`: 32px (2rem)

This creates visual rhythm and makes the UI feel cohesive.

## Benefits

✅ **Visual Consistency**: Same spacing everywhere
✅ **Faster Development**: Use tokens instead of guessing
✅ **Easier Maintenance**: Change spacing in one place
✅ **Professional Appearance**: Consistent whitespace
✅ **Accessibility**: Proper spacing improves readability
✅ **Responsive**: Built-in mobile-first responsive values

## Reference

- Tailwind CSS Spacing: https://tailwindcss.com/docs/customizing-spacing
- Resend Design System: https://resend.com (inspiration for generous whitespace)
- shadcn/ui: https://ui.shadcn.com (consistent component spacing)
