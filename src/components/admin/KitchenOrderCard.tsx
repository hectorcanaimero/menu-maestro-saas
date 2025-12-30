import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Phone, User, Calendar, MapPin, Printer, DollarSign, CreditCard, Table as TableIcon, Receipt } from 'lucide-react';
import { useState } from 'react';

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

interface KitchenOrderCardProps {
  order: Order;
  orderNumber: number;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onPrintOrder: (order: Order) => void;
  onPrintTicket: (order: Order) => void;
}

export const KitchenOrderCard = ({
  order,
  orderNumber,
  onStatusChange,
  onPrintOrder,
  onPrintTicket,
}: KitchenOrderCardProps) => {
  const [showPaymentProof, setShowPaymentProof] = useState(false);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-purple-500',
      ready: 'bg-green-500',
      delivered: 'bg-gray-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'En Proceso',
      ready: 'Listo',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      delivery: 'Entrega',
      pickup: 'Recoger',
      digital_menu: 'Mesa',
    };
    return labels[type] || type;
  };

  // Extract table number from delivery_address for digital menu orders
  const tableNumber =
    order.order_type === 'digital_menu' && order.delivery_address ? order.delivery_address.replace('Mesa ', '') : null;

  return (
    <Card className="overflow-hidden border-2 hover:shadow-lg transition-shadow">
      <div className={`h-2 ${getStatusColor(order.status)}`} />

      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2>Orden #{orderNumber}</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {order.created_at ? new Date(order.created_at).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                }) : 'N/A'}{' '}
                –{' '}
                {order.created_at ? new Date(order.created_at).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                }) : ''}
              </span>
            </div>
          </div>
          <div className="flex gap-2 me-3">
            <Badge className={getStatusColor(order.status) + ' text-white'}>{getStatusLabel(order.status)}</Badge>
          </div>

          {/* Print Buttons */}
        </div>
        <div className="space-y-2">
          <div className="flex justify-content-center gap-2 me-3">
            <Button variant="outline" size="sm" onClick={() => onPrintOrder(order)} className="h-9">
              <Printer className="w-4 h-4 mr-1" />
              Pedido
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPrintTicket(order)} className="h-9">
              <Printer className="w-4 h-4 mr-1" />
              Comanda
            </Button>
          </div>
        </div>
        {/* Customer Info */}
        <div className="space-y-2 py-3 border-y">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">{order.customer_name}</span>
          </div>
          {order.customer_phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{order.customer_phone}</span>
            </div>
          )}
          {order.order_type === 'delivery' && order.delivery_address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="line-clamp-2">{order.delivery_address}</span>
            </div>
          )}
          {tableNumber && (
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-base">
                Tabla {tableNumber}
              </Badge>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="space-y-2">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-bold">
                    {item.quantity}x
                  </Badge>
                  <span className="font-medium">{item.item_name}</span>
                </div>
                {item.order_item_extras && item.order_item_extras.length > 0 && (
                  <div className="ml-10 mt-1 text-xs text-muted-foreground">
                    {item.order_item_extras.map((extra, idx) => (
                      <div key={extra.id}>
                        + {extra.extra_name} (${extra.extra_price.toFixed(2)})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="font-semibold text-sm whitespace-nowrap">
                ${(item.price_at_time * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1 pt-3 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{getTypeLabel(order.order_type || 'delivery')}:</span>
            <span>$ 0,00</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>$ {order.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span>Tipo de Entrega: {order.order_type || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span>Método de Pago: {order.payment_method || 'N/A'}</span>
          </div>
          {order.payment_proof_url && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPaymentProof(true)}
              className="w-full mt-2"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Ver Comprobante de Pago
            </Button>
          )}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="p-2 bg-muted rounded-lg text-sm">
            <span className="font-medium">Nota:</span> {order.notes}
          </div>
        )}

        {/* Status Actions */}
        <div className="grid grid-cols-2 gap-2 pt-3">
          <Select value={order.status} onValueChange={(value) => onStatusChange(order.id, value)}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="preparing">En Proceso</SelectItem>
              <SelectItem value="ready">Listo</SelectItem>
              <SelectItem value="delivered">Entregado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          {order.status !== 'cancelled' && (
            <Button variant="destructive" size="sm" onClick={() => onStatusChange(order.id, 'cancelled')}>
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>

      {/* Payment Proof Dialog */}
      <Dialog open={showPaymentProof} onOpenChange={setShowPaymentProof}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Comprobante de Pago - Orden #{orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {order.payment_proof_url ? (
              <div className="space-y-4">
                <img
                  src={order.payment_proof_url}
                  alt="Comprobante de pago"
                  className="w-full h-auto rounded-lg border"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(order.payment_proof_url!, '_blank')}
                  >
                    Abrir en nueva pestaña
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No hay comprobante de pago disponible
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
