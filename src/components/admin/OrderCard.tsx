import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, FileImage, Phone, Mail, MapPin, Calendar, DollarSign } from "lucide-react";

interface OrderItemExtra {
  id: string;
  extra_name: string;
  extra_price: number;
}

interface OrderItem {
  id: string;
  quantity: number;
  price_at_time: number;
  item_name: string;
  order_item_extras: OrderItemExtra[];
}

interface Order {
  id: string;
  status: string;
  order_type: string | null;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_address: string | null;
  notes: string | null;
  payment_method: string | null;
  payment_proof_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  order_items: OrderItem[];
}

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onViewDetails: (order: Order) => void;
}

export const OrderCard = ({ order, onStatusChange, onViewDetails }: OrderCardProps) => {
  const getOrderTypeBadge = (type: string) => {
    const typeConfig: Record<string, string> = {
      delivery: "Entrega",
      pickup: "Recoger",
      digital_menu: "En Tienda"
    };
    return typeConfig[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      preparing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      ready: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    };
    return colors[status] || colors.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmado",
      preparing: "Preparando",
      ready: "Listo",
      delivered: "Entregado",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono font-bold">#{order.id.slice(0, 8)}</span>
              <Badge variant="outline" className="text-xs">
                {getOrderTypeBadge(order.order_type || 'delivery')}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span className="text-xs">
                {order.created_at ? new Date(order.created_at).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }) : 'N/A'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {order.payment_proof_url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => order.payment_proof_url && window.open(order.payment_proof_url, '_blank')}
              >
                <FileImage className="w-4 h-4 text-primary" />
              </Button>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{order.customer_name}</span>
          </div>
          {order.customer_phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span className="text-xs">{order.customer_phone}</span>
            </div>
          )}
          {order.delivery_address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="text-xs line-clamp-1">{order.delivery_address}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-lg font-bold">${order.total_amount.toFixed(2)}</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Select
            value={order.status}
            onValueChange={(value) => onStatusChange(order.id, value)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="preparing">Preparando</SelectItem>
              <SelectItem value="ready">Listo</SelectItem>
              <SelectItem value="delivered">Entregado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(order)}
            className="h-9"
          >
            <Eye className="w-3 h-3 mr-1" />
            Detalles
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};