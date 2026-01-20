import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useStore } from '@/contexts/StoreContext';
import { useStoreTheme } from '@/hooks/useStoreTheme';
import { useCartTotals } from '@/hooks/useCartTotals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Loader2, MapPin, User, Mail, Phone, CreditCard, FileText, Hash, Ticket } from 'lucide-react';
import { useFormatPrice } from '@/lib/priceFormatter';
import { DualPrice } from '@/components/catalog/DualPrice';
import { findOrCreateCustomer } from '@/services/customerService';
import { completeOrder } from '@/services/orderService';
import { redirectToWhatsApp } from '@/lib/whatsappMessageGenerator';
import { useOrderTypeLabels } from '@/hooks/useOrderTypeLabels';
import posthog from 'posthog-js';

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
  order_type: 'delivery' | 'pickup';
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
  const { getLabel } = useOrderTypeLabels();

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
      toast.error('No se encontraron datos del pedido');
      navigate('/checkout');
    }
  }, [location.state, navigate]);

  const handleEdit = () => {
    navigate('/checkout');
  };

  const handleConfirm = async () => {
    if (!orderData || !store?.id) {
      toast.error('Datos incompletos');
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
        store,
      );

      // Track order_placed event in PostHog
      // DO NOT send PII (emails, phones, addresses) to PostHog
      try {
        if (store?.id) {
          posthog.capture('order_placed', {
            store_id: store.id,
            order_id: result.orderId,
            total: grandTotal,
            items_count: items.length,
            order_type: orderData.order_type,
            payment_method: orderData.payment_method || null,
          });
        }
      } catch (error) {
        console.error('[PostHog] Error tracking order_placed:', error);
      }

      // Handle WhatsApp redirect if configured
      if (result.shouldRedirectToWhatsApp && result.whatsappNumber && result.whatsappMessage) {
        toast.success('¡Pedido realizado! Redirigiendo a WhatsApp...');
        clearCart();

        setTimeout(() => {
          redirectToWhatsApp(result.whatsappNumber!, result.whatsappMessage!);
          // Navigate back to home after WhatsApp redirect
          setTimeout(() => {
            navigate('/');
          }, 500);
        }, 1500);
        return;
      }

      // Success! Clear cart and redirect
      toast.success('¡Pedido realizado con éxito!');
      clearCart();
      navigate('/');
    } catch (error) {
      toast.error('Error al crear el pedido');
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
    return getLabel(orderData.order_type);
  };

  return (
    <div className="min-h-screen bg-background py-4 md:py-8">
      <div className="container mx-auto px-3 md:px-4 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/checkout')} className="mb-4 md:mb-6 -ml-2" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Confirmar Pedido</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Revisa los detalles de tu pedido antes de confirmar
          </p>
        </div>

        <div className="grid gap-4 md:gap-6">
          {/* Order Type */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center justify-between text-base md:text-lg">
                <span>Tipo de Orden</span>
                <Badge variant="secondary" className="text-xs md:text-sm">
                  {getOrderTypeLabel()}
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center justify-between text-base md:text-lg">
                <span>Información del Cliente</span>
                <Button variant="ghost" size="sm" onClick={handleEdit} className="h-8 px-2 md:px-3">
                  <Edit className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                  <span className="hidden md:inline">Editar</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex items-start gap-2 md:gap-3">
                <User className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium text-sm md:text-base break-words">{orderData.customer_name}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-2 md:gap-3">
                <Mail className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-sm md:text-base break-all">{orderData.customer_email}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-2 md:gap-3">
                <Phone className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium text-sm md:text-base">{orderData.customer_phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          {orderData.order_type === 'delivery' && orderData.delivery_address && (
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Información de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <p className="font-medium text-sm md:text-base break-words">{orderData.delivery_address}</p>
                {orderData.address_number && (
                  <p className="text-xs md:text-sm text-muted-foreground">Número: {orderData.address_number}</p>
                )}
                {orderData.address_complement && (
                  <p className="text-xs md:text-sm text-muted-foreground break-words">
                    Complemento: {orderData.address_complement}
                  </p>
                )}
                {orderData.address_neighborhood && (
                  <p className="text-xs md:text-sm text-muted-foreground">Barrio: {orderData.address_neighborhood}</p>
                )}
                {orderData.address_zipcode && (
                  <p className="text-xs md:text-sm text-muted-foreground">Código Postal: {orderData.address_zipcode}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          {orderData.payment_method && (
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <CreditCard className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Método de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="font-medium text-sm md:text-base">{orderData.payment_method}</p>
                {orderData.payment_proof_url && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    Comprobante adjunto
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}

          {/* Applied Coupon */}
          {orderData.coupon_code && couponDiscount > 0 && (
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Ticket className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Cupón Aplicado
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-xs md:text-base px-2 md:px-3 py-0.5 md:py-1">
                    {orderData.coupon_code}
                  </Badge>
                  <div className="text-green-600 font-semibold text-sm md:text-base">
                    -<DualPrice price={couponDiscount} size="sm" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {orderData.notes && (
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <FileText className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  Notas Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs md:text-sm text-muted-foreground break-words">{orderData.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="text-base md:text-lg">Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 pt-0">
              {items.map((item) => (
                <div key={item.cartItemId || item.id} className="pb-3 md:pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex justify-between items-start gap-2 md:gap-3">
                    <div className="flex gap-2 md:gap-3 flex-1 min-w-0">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 md:w-16 md:h-16 object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm md:text-base line-clamp-2">{item.name}</h4>
                        <p className="text-xs md:text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                        {item.extras && item.extras.length > 0 && (
                          <div className="mt-1 md:mt-2 text-xs md:text-sm text-muted-foreground space-y-0.5 md:space-y-1">
                            {item.extras.map((extra, idx) => (
                              <div key={idx} className="flex justify-between items-start gap-1">
                                <span className="line-clamp-1">+ {extra.name}</span>
                                <span className="flex-shrink-0">
                                  <DualPrice price={extra.price} size="sm" />
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-sm md:text-base">
                        <DualPrice
                          price={
                            (item.price + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)) * item.quantity
                          }
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="space-y-1.5 md:space-y-2">
                {totalSavings > 0 && (
                  <>
                    <div className="flex justify-between text-xs md:text-sm items-start gap-2">
                      <span className="text-muted-foreground">Subtotal original:</span>
                      <div className="line-through text-muted-foreground text-right flex-shrink-0">
                        <DualPrice price={originalTotal} size="sm" />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm items-start gap-2">
                      <span className="text-green-600">Descuento:</span>
                      <div className="text-green-600 text-right flex-shrink-0">
                        -<DualPrice price={totalSavings} size="sm" />
                      </div>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-xs md:text-sm items-start gap-2">
                  <span>Subtotal:</span>
                  <div className="text-right flex-shrink-0">
                    <DualPrice price={discountedTotal} size="sm" />
                  </div>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-xs md:text-sm items-start gap-2">
                    <span className="text-green-600 line-clamp-1">Cupón ({orderData.coupon_code}):</span>
                    <div className="text-green-600 text-right flex-shrink-0">
                      -<DualPrice price={couponDiscount} size="sm" />
                    </div>
                  </div>
                )}
                {orderData?.order_type === 'delivery' && deliveryPrice > 0 && (
                  <div className="flex justify-between text-xs md:text-sm items-start gap-2">
                    <span>Costo de entrega:</span>
                    <div className="text-right flex-shrink-0">
                      <DualPrice price={deliveryPrice} size="sm" />
                    </div>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-start text-base md:text-lg font-bold gap-2">
                  <span>Total:</span>
                  <div className="text-primary text-right flex-shrink-0">
                    <DualPrice price={grandTotal} size="lg" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pb-4">
            <Button variant="outline" onClick={handleEdit} className="flex-1 h-11 md:h-12" size="lg">
              <Edit className="w-4 h-4 mr-2" />
              <span className="text-sm md:text-base py-3">Editar Pedido</span>
            </Button>
            <Button onClick={handleConfirm} disabled={loading} className="flex-1 h-11 md:h-12" size="lg">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="text-sm md:text-base">Procesando...</span>
                </>
              ) : (
                <span className="text-sm md:text-base py-3">Confirmar Pedido</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmOrder;
