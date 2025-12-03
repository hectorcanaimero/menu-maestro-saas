import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { useStoreTheme } from "@/hooks/useStoreTheme";
import { useCartTotals } from "@/hooks/useCartTotals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Edit, Loader2, MapPin, User, Mail, Phone, CreditCard, FileText, Hash, Ticket } from "lucide-react";
import { useFormatPrice } from "@/lib/priceFormatter";
import { findOrCreateCustomer } from "@/services/customerService";
import { completeOrder } from "@/services/orderService";
import { redirectToWhatsApp } from "@/lib/whatsappMessageGenerator";
import posthog from "posthog-js";

interface OrderData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_zipcode?: string;
  table_number?: string;
  notes?: string;
  payment_method?: string;
  order_type: "delivery" | "pickup";
  payment_proof_url?: string;
  country?: string;
  delivery_price?: number;
  coupon_code?: string;
  coupon_discount?: number;
  coupon_id?: string;
}

const ConfirmOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, clearCart } = useCart();
  const { store } = useStore();
  const { originalTotal, discountedTotal, totalSavings } = useCartTotals(items);
  const formatPrice = useFormatPrice();

  // Apply store theme colors
  useStoreTheme();

  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  // Calculate grand total including delivery and coupon discount
  const deliveryPrice = orderData?.delivery_price || 0;
  const couponDiscount = orderData?.coupon_discount || 0;
  const grandTotal = discountedTotal + deliveryPrice - couponDiscount;

  useEffect(() => {
    // Get order data from navigation state (more secure than sessionStorage)
    const stateOrderData = location.state?.orderData;

    if (stateOrderData) {
      setOrderData(stateOrderData);
    } else {
      // If no data, redirect back to checkout
      toast.error("No se encontraron datos del pedido");
      navigate("/checkout");
    }
  }, [location.state, navigate]);

  const handleEdit = () => {
    navigate("/checkout");
  };

  const handleConfirm = async () => {
    if (!orderData || !store?.id) {
      toast.error("Datos incompletos");
      return;
    }

    setLoading(true);
    try {
      // Find or create customer
      const customerResult = await findOrCreateCustomer({
        name: orderData.customer_name,
        email: orderData.customer_email,
        phone: orderData.customer_phone,
        country: orderData.country,
      });

      if (!customerResult) {
        setLoading(false);
        return;
      }

      // Complete order (create order, items, extras, prepare WhatsApp)
      const result = await completeOrder(
        orderData,
        customerResult.customerId,
        items,
        grandTotal,
        deliveryPrice,
        couponDiscount,
        store
      );

      // Track order_placed event in PostHog
      // DO NOT send PII (emails, phones, addresses) to PostHog
      try {
        posthog.capture('order_placed', {
          store_id: store.id,
          order_id: result.orderId,
          order_number: result.orderNumber,
          order_type: orderData.order_type,
          order_total: grandTotal,
          items_count: items.length,
          total_items: items.reduce((sum, item) => sum + item.quantity, 0),
          delivery_price: deliveryPrice,
          coupon_discount: couponDiscount,
          coupon_code: orderData.coupon_code || null,
          payment_method: orderData.payment_method || null,
          // DO NOT send customer_email, customer_phone, or addresses for privacy
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('[PostHog] Error tracking order_placed:', error);
      }

      // Handle WhatsApp redirect if configured
      if (result.shouldRedirectToWhatsApp && result.whatsappNumber && result.whatsappMessage) {
        toast.success("¡Pedido realizado! Redirigiendo a WhatsApp...");
        clearCart();

        setTimeout(() => {
          redirectToWhatsApp(result.whatsappNumber!, result.whatsappMessage!);
          navigate("/");
        }, 1500);
        return;
      }

      // Success! Clear cart and redirect
      toast.success("¡Pedido realizado con éxito!");
      clearCart();
      navigate("/");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Error al crear el pedido");
    } finally {
      setLoading(false);
    }
  };

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getOrderTypeLabel = () => {
    switch (orderData.order_type) {
      case "delivery":
        return "Entrega a Domicilio";
      case "pickup":
        return "Recoger en Tienda";
      default:
        return orderData.order_type;
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/checkout")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Confirmar Pedido</h1>
          <p className="text-muted-foreground">
            Revisa los detalles de tu pedido antes de confirmar
          </p>
        </div>

        <div className="grid gap-6">
          {/* Order Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tipo de Orden</span>
                <Badge variant="secondary">{getOrderTypeLabel()}</Badge>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Información del Cliente</span>
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{orderData.customer_name}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{orderData.customer_email}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{orderData.customer_phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          {orderData.order_type === "delivery" && orderData.delivery_address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Información de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{orderData.delivery_address}</p>
                {orderData.address_number && (
                  <p className="text-muted-foreground">Número: {orderData.address_number}</p>
                )}
                {orderData.address_complement && (
                  <p className="text-muted-foreground">Complemento: {orderData.address_complement}</p>
                )}
                {orderData.address_neighborhood && (
                  <p className="text-muted-foreground">Barrio: {orderData.address_neighborhood}</p>
                )}
                {orderData.address_zipcode && (
                  <p className="text-muted-foreground">Código Postal: {orderData.address_zipcode}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          {orderData.payment_method && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Método de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{orderData.payment_method}</p>
                {orderData.payment_proof_url && (
                  <Badge variant="outline" className="mt-2">
                    Comprobante adjunto
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}

          {/* Applied Coupon */}
          {orderData.coupon_code && couponDiscount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Cupón Aplicado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {orderData.coupon_code}
                  </Badge>
                  <span className="text-green-600 font-semibold">
                    -{formatPrice(couponDiscount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {orderData.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notas Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{orderData.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.cartItemId || item.id} className="pb-4 border-b last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 flex-1">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity}
                        </p>
                        {item.extras && item.extras.length > 0 && (
                          <div className="mt-2 text-sm text-muted-foreground space-y-1">
                            {item.extras.map((extra, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>+ {extra.name}</span>
                                <span>{formatPrice(extra.price)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatPrice((item.price + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)) * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="space-y-2">
                {totalSavings > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal original:</span>
                        <span className="line-through text-muted-foreground">{formatPrice(originalTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Descuento:</span>
                        <span className="text-green-600">-{formatPrice(totalSavings)}</span>
                      </div>
                    </>
                  )}
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatPrice(discountedTotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Cupón ({orderData.coupon_code}):</span>
                    <span className="text-green-600">-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                {orderData?.order_type === "delivery" && deliveryPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Costo de entrega:</span>
                    <span>{formatPrice(deliveryPrice)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary text-2xl">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex-1"
              size="lg"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Pedido
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar Pedido"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmOrder;
