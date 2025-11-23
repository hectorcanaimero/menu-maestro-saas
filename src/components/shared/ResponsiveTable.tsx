import { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

/**
 * Column definition for desktop table view
 */
export interface ColumnDef<T> {
  /** Unique identifier for the column */
  id: string;
  /** Column header text */
  header: string | ReactNode;
  /** Render function for cell content */
  cell: (item: T) => ReactNode;
  /** Optional className for the header cell */
  headerClassName?: string;
  /** Optional className for the body cell */
  cellClassName?: string;
}

/**
 * Props for the ResponsiveTable component
 */
export interface ResponsiveTableProps<T> {
  /** Array of data items to display */
  data: T[];
  /** Column definitions for desktop table view */
  columns: ColumnDef<T>[];
  /** Render function for mobile card view */
  renderMobileCard: (item: T, index: number) => ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Message to display when no data */
  emptyMessage?: string;
  /** Optional click handler for rows/cards */
  onRowClick?: (item: T) => void;
  /** Unique key extractor function */
  getRowKey: (item: T, index: number) => string;
  /** Optional className for mobile container */
  mobileClassName?: string;
  /** Optional className for desktop container */
  desktopClassName?: string;
}

/**
 * ResponsiveTable Component
 *
 * A reusable table component that automatically switches between
 * mobile card view and desktop table view based on screen size.
 *
 * @example
 * ```tsx
 * <ResponsiveTable
 *   data={categories}
 *   columns={categoryColumns}
 *   renderMobileCard={(category) => <CategoryCard category={category} />}
 *   getRowKey={(category) => category.id}
 *   loading={isLoading}
 *   emptyMessage="No hay categorías disponibles"
 * />
 * ```
 */
export function ResponsiveTable<T>({
  data,
  columns,
  renderMobileCard,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  onRowClick,
  getRowKey,
  mobileClassName = "sm:hidden space-y-3",
  desktopClassName = "hidden sm:block",
}: ResponsiveTableProps<T>) {
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Mobile view - Card layout */}
      <div className={mobileClassName}>
        {data.map((item, index) => (
          <div
            key={getRowKey(item, index)}
            onClick={() => onRowClick?.(item)}
            className={onRowClick ? "cursor-pointer" : ""}
          >
            {renderMobileCard(item, index)}
          </div>
        ))}
      </div>

      {/* Desktop view - Table layout */}
      <div className={desktopClassName}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} className={column.headerClassName}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={getRowKey(item, index)}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.cellClassName}>
                    {column.cell(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
