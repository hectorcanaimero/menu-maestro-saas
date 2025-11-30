import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStoreTheme } from "@/hooks/useStoreTheme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, MapPin } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  quantity: number;
  price_at_time: number;
  item_name: string;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  customer_name: string;
  delivery_address: string | null;
  notes: string | null;
  created_at: string | null;
  order_items: OrderItem[];
}

const MyOrders = () => {
  const navigate = useNavigate();

  // Apply store theme colors
  useStoreTheme();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndFetchOrders();
  }, []);

  const checkAuthAndFetchOrders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Debes iniciar sesión");
      navigate("/auth");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error al cargar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      pending: { label: "Pendiente", variant: "secondary" },
      confirmed: { label: "Confirmado", variant: "default" },
      preparing: { label: "Preparando", variant: "default" },
      ready: { label: "Listo", variant: "default" },
      delivered: { label: "Entregado", variant: "default" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Inicio
        </Button>

        <h1 className="text-3xl font-bold mb-8">Mis Pedidos</h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground mb-2">
                No tienes pedidos aún
              </p>
              <Button onClick={() => navigate("/")}>Ver Menú</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Pedido #{order.id.slice(0, 8)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : 'N/A'}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Platillos:</h4>
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.quantity}x {item.item_name}
                          </span>
                          <span className="font-medium">
                            ${(item.price_at_time * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-primary">
                        ${order.total_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {order.delivery_address && (
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Dirección:</span>{" "}
                        {order.delivery_address}
                      </p>
                    </div>
                  )}

                  {order.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Notas:</span> {order.notes}
                      </p>
                    </div>
                  )}

                  {/* Track Order Button */}
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <div className="pt-2">
                      <Link to={`/track/${order.id}`}>
                        <Button variant="outline" className="w-full">
                          <MapPin className="h-4 w-4 mr-2" />
                          Rastrear Pedido
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;