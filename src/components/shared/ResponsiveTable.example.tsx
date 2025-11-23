/**
 * ResponsiveTable - Usage Examples
 *
 * This file demonstrates how to use the ResponsiveTable component
 * with different types of data.
 */

import { ResponsiveTable, ColumnDef } from "./ResponsiveTable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Package } from "lucide-react";

// ============================================
// Example 1: Categories Table
// ============================================

interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number | null;
  product_count?: number;
}

// Define columns for desktop view
const categoryColumns: ColumnDef<Category>[] = [
  {
    id: "name",
    header: "Nombre",
    cell: (category) => <span className="font-medium">{category.name}</span>,
  },
  {
    id: "description",
    header: "Descripción",
    cell: (category) => (
      <span className="max-w-xs truncate">{category.description || "-"}</span>
    ),
    cellClassName: "max-w-xs truncate",
  },
  {
    id: "order",
    header: "Orden",
    cell: (category) => category.display_order,
  },
  {
    id: "products",
    header: "Productos",
    cell: (category) => (
      <Badge variant="outline" className="flex items-center gap-1 w-fit">
        <Package className="h-3 w-3" />
        {category.product_count || 0}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Acciones",
    headerClassName: "text-right",
    cellClassName: "text-right",
    cell: (category) => (
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="icon">
          <Pencil className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    ),
  },
];

// Mobile card renderer
function CategoryMobileCard({ category }: { category: Category }) {
  return (
    <Card className="border-0 shadow-none bg-muted/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {category.description}
              </p>
            )}
          </div>
          <Badge variant="outline" className="flex items-center gap-1 shrink-0">
            <Package className="h-3 w-3" />
            {category.product_count || 0}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">Orden: </span>
            <span className="font-medium">{category.display_order}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Usage example
export function CategoriesTableExample() {
  const categories: Category[] = [
    {
      id: "1",
      name: "Pizzas",
      description: "Deliciosas pizzas artesanales",
      display_order: 1,
      product_count: 12,
    },
    {
      id: "2",
      name: "Bebidas",
      description: "Refrescos y jugos naturales",
      display_order: 2,
      product_count: 8,
    },
  ];

  return (
    <ResponsiveTable
      data={categories}
      columns={categoryColumns}
      renderMobileCard={(category) => <CategoryMobileCard category={category} />}
      getRowKey={(category) => category.id}
      loading={false}
      emptyMessage="No hay categorías disponibles"
    />
  );
}

// ============================================
// Example 2: Orders Table
// ============================================

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const orderColumns: ColumnDef<Order>[] = [
  {
    id: "order_number",
    header: "Número",
    cell: (order) => <span className="font-medium">#{order.order_number}</span>,
  },
  {
    id: "customer",
    header: "Cliente",
    cell: (order) => order.customer_name,
  },
  {
    id: "total",
    header: "Total",
    cell: (order) => <span className="font-bold">$ {order.total_amount.toFixed(2)}</span>,
  },
  {
    id: "status",
    header: "Estado",
    cell: (order) => (
      <Badge variant={order.status === "delivered" ? "secondary" : "outline"}>
        {order.status}
      </Badge>
    ),
  },
];

export function OrdersTableExample() {
  const orders: Order[] = [];

  return (
    <ResponsiveTable
      data={orders}
      columns={orderColumns}
      renderMobileCard={(order) => (
        <Card className="border-0 shadow-none bg-muted/50">
          <CardHeader>
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">#{order.order_number}</p>
                <p className="text-sm text-muted-foreground">{order.customer_name}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">$ {order.total_amount.toFixed(2)}</p>
                <Badge variant="outline">{order.status}</Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}
      getRowKey={(order) => order.id}
      loading={false}
      emptyMessage="No hay órdenes disponibles"
      onRowClick={(order) => console.log("Clicked order:", order.id)}
    />
  );
}

// ============================================
// Example 3: With Loading State
// ============================================

export function LoadingTableExample() {
  return (
    <ResponsiveTable
      data={[]}
      columns={categoryColumns}
      renderMobileCard={(category) => <CategoryMobileCard category={category} />}
      getRowKey={(category) => category.id}
      loading={true}
      emptyMessage="No hay datos"
    />
  );
}
