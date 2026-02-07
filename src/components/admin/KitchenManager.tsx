import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import posthog from 'posthog-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChefHat, RefreshCw, Search, Bell, BellOff } from 'lucide-react';
import { KitchenOrderCard } from './KitchenOrderCard';

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

const KitchenManager = () => {
  const { store } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (store?.id) {
      fetchOrders();

      // Set up real-time subscription for new orders
      const channel = supabase
        .channel('kitchen-orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `store_id=eq.${store.id}`,
          },
          () => {
            fetchOrders();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [store?.id]);

  const fetchOrders = async () => {
    if (!store?.id) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items (
            *,
            order_item_extras (*)
          )
        `,
        )
        .eq('store_id', store.id)
        .neq('status', 'delivered')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders((data || []) as Order[]);
      setFilteredOrders((data || []) as Order[]);
    } catch (error) {
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.customer_name.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query) ||
          order.customer_phone?.toLowerCase().includes(query),
      );
    }

    setFilteredOrders(filtered);
  }, [statusFilter, searchQuery, orders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Get the order before updating to track the change
      const order = orders.find((o) => o.id === orderId);

      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);

      if (error) throw error;

      // Track order status change events in PostHog
      try {
        if (store?.id && order) {
          const eventProperties = {
            store_id: store.id,
            store_name: store.name,
            order_id: orderId,
            previous_status: order.status,
            new_status: newStatus,
            order_type: order.order_type,
            total_amount: order.total_amount,
            context: 'kitchen',
            timestamp: new Date().toISOString(),
          };

          // Track specific status events
          switch (newStatus) {
            case 'confirmed':
              posthog.capture('order_confirmed', eventProperties);
              break;
            case 'preparing':
              posthog.capture('order_preparing', eventProperties);
              break;
            case 'ready':
              posthog.capture('order_ready', eventProperties);
              break;
            case 'delivered':
              posthog.capture('order_delivered', eventProperties);
              break;
            case 'cancelled':
              posthog.capture('order_cancelled', {
                ...eventProperties,
                cancellation_reason: 'manual_by_kitchen',
              });
              break;
          }

          // Always track generic status change event
          posthog.capture('order_status_changed', eventProperties);
        }
      } catch (trackingError) {
        console.error('[PostHog] Error tracking order status change:', trackingError);
      }

      toast.success('Estado actualizado');
      fetchOrders();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handlePrintOrder = (order: Order) => {
    // Create a printable version of the order
    const printContent = `
      <html>
        <head>
          <title>Pedido #${order.id.slice(0, 8)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            .order-info { margin: 20px 0; }
            .items { margin: 20px 0; }
            .item { margin: 10px 0; padding: 10px; border-bottom: 1px solid #ccc; }
            .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>${store?.name || 'Restaurante'}</h1>
          <h2>Pedido #${order.id.slice(0, 8)}</h2>
          <div class="order-info">
            <p><strong>Cliente:</strong> ${order.customer_name}</p>
            <p><strong>Teléfono:</strong> ${order.customer_phone || 'N/A'}</p>
            <p><strong>Tipo:</strong> ${
              order.order_type === 'delivery' ? 'Entrega' : order.order_type === 'pickup' ? 'Recoger' : 'Mesa'
            }</p>
            ${order.delivery_address ? `<p><strong>Dirección:</strong> ${order.delivery_address}</p>` : ''}
            <p><strong>Fecha:</strong> ${new Date(order.created_at).toLocaleString('es-ES')}</p>
          </div>
          <div class="items">
            <h3>Productos:</h3>
            ${order.order_items
              .map(
                (item) => `
              <div class="item">
                <p><strong>${item.quantity}x ${item.item_name}</strong> - $${(
                  item.price_at_time * item.quantity
                ).toFixed(2)}</p>
                ${
                  item.order_item_extras?.length > 0
                    ? `
                  <ul>
                    ${item.order_item_extras
                      .map(
                        (extra) => `
                      <li>+ ${extra.extra_name} ($${extra.extra_price.toFixed(2)})</li>
                    `,
                      )
                      .join('')}
                  </ul>
                `
                    : ''
                }
              </div>
            `,
              )
              .join('')}
          </div>
          ${order.notes ? `<p><strong>Notas:</strong> ${order.notes}</p>` : ''}
          <div class="total">
            <p>Total: $${order.total_amount.toFixed(2)}</p>
            <p>Método de Pago: ${order.payment_method || 'N/A'}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handlePrintTicket = (order: Order) => {
    // Create a kitchen ticket (simplified version)
    const printContent = `
      <html>
        <head>
          <title>Comanda #${order.id.slice(0, 8)}</title>
          <style>
            body { font-family: monospace; padding: 10px; font-size: 14px; }
            h2 { text-align: center; margin: 10px 0; }
            .item { margin: 10px 0; }
            .extras { margin-left: 20px; font-size: 12px; }
            hr { border: 1px dashed #000; }
          </style>
        </head>
        <body>
          <h2>COMANDA DE COCINA</h2>
          <p><strong>Orden:</strong> #${order.id.slice(0, 8)}</p>
          <p><strong>Hora:</strong> ${new Date(order.created_at).toLocaleTimeString('es-ES')}</p>
          <p><strong>Tipo:</strong> ${
            order.order_type === 'delivery'
              ? 'ENTREGA'
              : order.order_type === 'pickup'
                ? 'RECOGER'
                : 'MESA ' + (order.delivery_address?.replace('Mesa ', '') || '')
          }</p>
          <hr>
          ${order.order_items
            .map(
              (item) => `
            <div class="item">
              <strong>${item.quantity}x ${item.item_name}</strong>
              ${
                item.order_item_extras?.length > 0
                  ? `
                <div class="extras">
                  ${item.order_item_extras.map((extra) => `+ ${extra.extra_name}`).join('<br>')}
                </div>
              `
                  : ''
              }
            </div>
          `,
            )
            .join('')}
          <hr>
          ${order.notes ? `<p><strong>NOTA:</strong> ${order.notes}</p>` : ''}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando pedidos...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Cocina - Vista de Pedidos
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={notificationsEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            >
              {notificationsEnabled ? (
                <>
                  <Bell className="w-4 h-4 mr-2" /> Notificaciones
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 mr-2" /> Sin notificaciones
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchOrders}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, número de pedido o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="preparing">En Proceso</SelectItem>
              <SelectItem value="ready">Listo</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {orders.length === 0 ? 'No hay pedidos activos' : 'No se encontraron pedidos con los filtros aplicados'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredOrders.map((order, index) => (
              <KitchenOrderCard
                key={order.id}
                order={order}
                orderNumber={orders.length - orders.findIndex((o) => o.id === order.id)}
                onStatusChange={updateOrderStatus}
                onPrintOrder={handlePrintOrder}
                onPrintTicket={handlePrintTicket}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KitchenManager;
