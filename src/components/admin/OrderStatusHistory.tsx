import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, User, ArrowRight, Loader2 } from "lucide-react";

/**
 * Order Status History Entry
 */
export interface OrderStatusHistoryEntry {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
  store_id: string;
}

/**
 * Get status badge variant based on status
 */
function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    pending: "outline",
    confirmed: "secondary",
    preparing: "default",
    ready: "default",
    delivered: "secondary",
    cancelled: "destructive",
  };
  return variants[status] || "outline";
}

/**
 * Get status label in Spanish
 */
function getStatusLabel(status: string | null): string {
  if (!status) return "Inicial";

  const labels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    preparing: "Preparando",
    ready: "Listo",
    delivered: "Entregado",
    cancelled: "Cancelado",
  };
  return labels[status] || status;
}

/**
 * OrderStatusHistory Component Props
 */
export interface OrderStatusHistoryProps {
  /** Order ID to fetch history for */
  orderId: string;
  /** Optional className for the container */
  className?: string;
  /** Show as compact view (for cards) */
  compact?: boolean;
}

/**
 * OrderStatusHistory Component
 *
 * Displays the complete history of status changes for an order,
 * including timestamps, user who made the change, and optional notes.
 *
 * @example
 * ```tsx
 * <OrderStatusHistory orderId="123-456-789" />
 * ```
 */
export function OrderStatusHistory({
  orderId,
  className = "",
  compact = false,
}: OrderStatusHistoryProps) {
  // Fetch order status history
  const { data: history, isLoading } = useQuery({
    queryKey: ["order-status-history", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      return data as OrderStatusHistoryEntry[];
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty state
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No hay historial de cambios disponible
      </div>
    );
  }

  // Compact view (for mobile cards or sidebars)
  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <h4 className="text-sm font-semibold text-muted-foreground">Historial</h4>
        {history.map((entry) => (
          <div key={entry.id} className="flex items-center gap-2 text-xs">
            <Badge variant={getStatusVariant(entry.to_status)} className="text-xs">
              {getStatusLabel(entry.to_status)}
            </Badge>
            <span className="text-muted-foreground">
              {format(new Date(entry.changed_at), "dd/MM HH:mm", { locale: es })}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Full view (for desktop details)
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Historial de Estado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
            >
              {/* Timeline indicator */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-3 h-3 rounded-full ${
                    index === 0 ? "bg-primary" : "bg-muted-foreground"
                  }`}
                />
                {index < history.length - 1 && (
                  <div className="w-0.5 h-full bg-border min-h-[20px]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                {/* Status change */}
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.from_status && (
                    <>
                      <Badge
                        variant={getStatusVariant(entry.from_status)}
                        className="text-xs"
                      >
                        {getStatusLabel(entry.from_status)}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </>
                  )}
                  <Badge
                    variant={getStatusVariant(entry.to_status)}
                    className="text-xs"
                  >
                    {getStatusLabel(entry.to_status)}
                  </Badge>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {format(
                      new Date(entry.changed_at),
                      "dd/MM/yyyy 'a las' HH:mm",
                      { locale: es }
                    )}
                  </span>
                </div>

                {/* User (if available) */}
                {entry.changed_by && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>ID: {entry.changed_by.slice(0, 8)}...</span>
                  </div>
                )}

                {/* Notes (if available) */}
                {entry.notes && (
                  <div className="text-sm bg-muted p-2 rounded">
                    <span className="font-medium">Nota:</span> {entry.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook to fetch order status analytics
 */
export function useOrderStatusAnalytics(storeId: string) {
  return useQuery({
    queryKey: ["order-status-analytics", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_status_analytics")
        .select("*")
        .eq("store_id", storeId);

      if (error) throw error;
      return data;
    },
  });
}
