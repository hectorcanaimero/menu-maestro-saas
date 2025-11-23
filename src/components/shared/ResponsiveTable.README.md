# ResponsiveTable Component

A reusable, responsive table component that automatically switches between mobile card view and desktop table view based on screen size.

## Features

- ✅ **Automatic Responsive Behavior**: Mobile (< 640px) shows cards, Desktop (≥ 640px) shows table
- ✅ **TypeScript Generic Support**: Fully typed for any data structure
- ✅ **Loading State**: Built-in loading spinner
- ✅ **Empty State**: Customizable empty message
- ✅ **Click Handlers**: Optional row/card click support
- ✅ **Flexible Rendering**: Custom mobile card renderer
- ✅ **Customizable Columns**: Define columns with custom rendering
- ✅ **Custom Styling**: Optional className props for containers

## Installation

The component is already available in the project at:
```
src/components/shared/ResponsiveTable.tsx
```

## Basic Usage

```typescript
import { ResponsiveTable, ColumnDef } from "@/components/shared/ResponsiveTable";

// Define your data type
interface Category {
  id: string;
  name: string;
  description: string;
}

// Define columns for desktop view
const columns: ColumnDef<Category>[] = [
  {
    id: "name",
    header: "Nombre",
    cell: (category) => category.name,
  },
  {
    id: "description",
    header: "Descripción",
    cell: (category) => category.description,
  },
];

// Use the component
<ResponsiveTable
  data={categories}
  columns={columns}
  renderMobileCard={(category) => (
    <Card>
      <CardContent>
        <h3>{category.name}</h3>
        <p>{category.description}</p>
      </CardContent>
    </Card>
  )}
  getRowKey={(category) => category.id}
/>
```

## API Reference

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `data` | `T[]` | ✅ Yes | - | Array of data items to display |
| `columns` | `ColumnDef<T>[]` | ✅ Yes | - | Column definitions for desktop table |
| `renderMobileCard` | `(item: T, index: number) => ReactNode` | ✅ Yes | - | Render function for mobile cards |
| `getRowKey` | `(item: T, index: number) => string` | ✅ Yes | - | Unique key extractor |
| `loading` | `boolean` | ❌ No | `false` | Loading state |
| `emptyMessage` | `string` | ❌ No | `"No hay datos disponibles"` | Empty state message |
| `onRowClick` | `(item: T) => void` | ❌ No | - | Click handler for rows/cards |
| `mobileClassName` | `string` | ❌ No | `"sm:hidden space-y-3"` | Mobile container className |
| `desktopClassName` | `string` | ❌ No | `"hidden sm:block"` | Desktop container className |

### ColumnDef Interface

```typescript
interface ColumnDef<T> {
  id: string;                      // Unique column identifier
  header: string | ReactNode;      // Column header content
  cell: (item: T) => ReactNode;    // Cell render function
  headerClassName?: string;        // Optional header className
  cellClassName?: string;          // Optional cell className
}
```

## Examples

### Example 1: Simple Table

```typescript
<ResponsiveTable
  data={users}
  columns={[
    { id: "name", header: "Name", cell: (user) => user.name },
    { id: "email", header: "Email", cell: (user) => user.email },
  ]}
  renderMobileCard={(user) => (
    <div className="p-4 border rounded">
      <p>{user.name}</p>
      <p>{user.email}</p>
    </div>
  )}
  getRowKey={(user) => user.id}
/>
```

### Example 2: With Loading

```typescript
<ResponsiveTable
  data={products}
  columns={productColumns}
  renderMobileCard={(product) => <ProductCard product={product} />}
  getRowKey={(product) => product.id}
  loading={isLoading}
  emptyMessage="No products found"
/>
```

### Example 3: With Click Handler

```typescript
<ResponsiveTable
  data={orders}
  columns={orderColumns}
  renderMobileCard={(order) => <OrderCard order={order} />}
  getRowKey={(order) => order.id}
  onRowClick={(order) => router.push(`/orders/${order.id}`)}
/>
```

### Example 4: Custom Styling

```typescript
<ResponsiveTable
  data={items}
  columns={[
    {
      id: "name",
      header: "Product",
      cell: (item) => item.name,
      headerClassName: "font-bold",
      cellClassName: "text-primary",
    },
  ]}
  renderMobileCard={(item) => <ItemCard item={item} />}
  getRowKey={(item) => item.id}
  mobileClassName="sm:hidden space-y-4 p-4"
  desktopClassName="hidden sm:block overflow-x-auto"
/>
```

## Responsive Breakpoint

The component uses the `sm:` breakpoint (640px) from Tailwind CSS:

- **Mobile** (< 640px): Shows `renderMobileCard` view
- **Desktop** (≥ 640px): Shows table view with `columns`

## Migration Guide

### Before (Manual Implementation)

```typescript
// Old way - duplicated code
<>
  {/* Mobile view */}
  <div className="sm:hidden space-y-3">
    {data.map((item) => (
      <Card key={item.id}>
        {/* Mobile card content */}
      </Card>
    ))}
  </div>

  {/* Desktop view */}
  <div className="hidden sm:block">
    <Table>
      <TableHeader>
        {/* Table header */}
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            {/* Table cells */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
</>
```

### After (Using ResponsiveTable)

```typescript
// New way - reusable component
<ResponsiveTable
  data={data}
  columns={columns}
  renderMobileCard={(item) => <MobileCard item={item} />}
  getRowKey={(item) => item.id}
/>
```

## Benefits

- 🎯 **Reduces Code**: ~50-100 lines saved per table
- 🎨 **Consistent UX**: Same mobile/desktop pattern everywhere
- 🛠️ **Easier Maintenance**: Update once, applies to all tables
- ⚡ **Faster Development**: New tables in minutes
- 📱 **Mobile-First**: Optimized for all screen sizes

## Related Components

- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` from `@/components/ui/table`
- `Card`, `CardHeader`, `CardContent` from `@/components/ui/card`
- `Badge` from `@/components/ui/badge`

## TypeScript Support

The component is fully typed with TypeScript generics:

```typescript
function ResponsiveTable<T>({ ... }: ResponsiveTableProps<T>)
```

This ensures type safety for:
- Data items
- Column definitions
- Cell renderers
- Click handlers

## See Also

- [ResponsiveTable.example.tsx](./ResponsiveTable.example.tsx) - Complete examples
- [Issue #7](https://github.com/hectorcanaimero/menu-maestro-saas/issues/7) - Original requirement
