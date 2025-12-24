import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Eye,
  FileImage,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Truck,
  Store,
  Utensils,
  Bike,
  UserPlus,
} from 'lucide-react';
import { DriverAssignmentDialog } from './DriverAssignmentDialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useModuleAccess } from '@/hooks/useSubscription';

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
  assigned_driver_id?: string | null;
}

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onViewDetails: (order: Order) => void;
  onDriverAssigned?: () => void;
}

export const OrderCard = ({ order, onStatusChange, onViewDetails, onDriverAssigned }: OrderCardProps) => {
  const [showDriverDialog, setShowDriverDialog] = useState(false);
  const { data: hasDeliveryModule, isLoading: checkingModule } = useModuleAccess('delivery');
  // Only show driver assignment features if delivery module is explicitly enabled
  const showDriverFeatures = hasDeliveryModule === true;

  // Debug log (can be removed later)
  console.log('OrderCard - Delivery Module Check:', {
    orderId: order.id.slice(0, 8),
    hasDeliveryModule,
    checkingModule,
    showDriverFeatures,
    isDelivery: order.order_type === 'delivery',
  });

  // Get delivery assignment info
  const { data: deliveryAssignment } = useQuery({
    queryKey: ['delivery-assignment-by-order', order.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(
          `
          *,
          driver:drivers (
            id,
            name,
            phone,
            vehicle_type,
            photo_url
          )
        `,
        )
        .eq('order_id', order.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: order.order_type === 'delivery',
  });

  const getOrderTypeConfig = (type: string) => {
    const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
      delivery: {
        label: 'Entrega',
        icon: Truck,
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-300',
      },
      pickup: {
        label: 'Recoger',
        icon: Store,
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-300',
      },
      dine_in: {
        label: 'Servicio en Mesa',
        icon: Utensils,
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300',
      },
      digital_menu: {
        label: 'En Tienda',
        icon: Utensils,
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300',
      },
    };
    return typeConfig[type] || typeConfig.pickup;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      preparing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    };
    return colors[status] || colors.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      ready: 'Listo',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const orderTypeConfig = getOrderTypeConfig(order.order_type || 'pickup');
  const OrderTypeIcon = orderTypeConfig.icon;
  const isDelivery = order.order_type === 'delivery';
  const hasDriver = !!(deliveryAssignment && deliveryAssignment.driver);

  return (
    <>
      <Card
        className={`overflow-hidden hover:shadow-md transition-shadow ${
          isDelivery ? 'border-l-4 border-l-orange-500' : ''
        }`}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-mono font-bold">#{order.id.slice(0, 8)}</span>
                <Badge variant="outline" className={`text-xs flex items-center gap-1 ${orderTypeConfig.color}`}>
                  <OrderTypeIcon className="w-3 h-3" />
                  {orderTypeConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
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

          {/* Driver Info (if assigned) */}
          {isDelivery && hasDriver && (
            <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                {deliveryAssignment.driver.photo_url ? (
                  <img
                    src={deliveryAssignment.driver.photo_url}
                    alt={deliveryAssignment.driver.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bike className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400">
                    {deliveryAssignment.driver.name}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">Motorista asignado</p>
                </div>
                {showDriverFeatures && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowDriverDialog(true)}>
                    Cambiar
                  </Button>
                )}
              </div>
            </div>
          )}

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
            <Select value={order.status} onValueChange={(value) => onStatusChange(order.id, value)}>
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
            <Button variant="outline" size="sm" onClick={() => onViewDetails(order)} className="h-9">
              <Eye className="w-3 h-3 mr-1" />
              Detalles
            </Button>
          </div>

          {/* Assign Driver Button (for delivery orders without driver) */}
          {isDelivery && !hasDriver && showDriverFeatures && (
            <Button variant="default" size="sm" className="w-full h-9" onClick={() => setShowDriverDialog(true)}>
              <UserPlus className="w-3 h-3 mr-2" />
              Asignar Motorista
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Driver Assignment Dialog */}
      {isDelivery && showDriverFeatures && (
        <DriverAssignmentDialog
          open={showDriverDialog}
          onOpenChange={setShowDriverDialog}
          orderId={order.id}
          orderAddress={order.delivery_address || undefined}
          currentDriverId={deliveryAssignment?.driver_id}
          onSuccess={() => {
            if (onDriverAssigned) {
              onDriverAssigned();
            }
          }}
        />
      )}
    </>
  );
};
