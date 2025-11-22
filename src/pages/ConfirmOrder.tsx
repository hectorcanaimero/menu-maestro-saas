import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Edit, Loader2, MapPin, User, Mail, Phone, CreditCard, FileText, Hash } from "lucide-react";
import { generateWhatsAppMessage, redirectToWhatsApp } from "@/lib/whatsappMessageGenerator";

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
  order_type: "delivery" | "pickup" | "digital_menu";
  payment_proof_url?: string;
  country?: string;
}

const ConfirmOrder = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { store } = useStore();
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    // Load order data from sessionStorage
    const savedData = sessionStorage.getItem("pendingOrder");
    if (savedData) {
      setOrderData(JSON.parse(savedData));
    } else {
      // If no data, redirect back to checkout
      toast.error("No se encontraron datos del pedido");
      navigate("/checkout");
    }
  }, [navigate]);

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
      const { data: { session } } = await supabase.auth.getSession();

      // First, create or update customer
      let customerId: string;
      
      // Try to find existing customer by email (unique identifier)
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id, name, phone, country")
        .eq("email", orderData.customer_email)
        .maybeSingle();

      if (existingCustomer) {
        // Customer exists - update their information if changed
        const needsUpdate = 
          existingCustomer.name !== orderData.customer_name ||
          existingCustomer.phone !== orderData.customer_phone ||
          existingCustomer.country !== (orderData.country || "brazil");

        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from("customers")
            .update({
              name: orderData.customer_name,
              phone: orderData.customer_phone || null,
              country: orderData.country || "brazil",
            })
            .eq("id", existingCustomer.id);

          if (updateError) {
            console.error("Error updating customer:", updateError);
            toast.error("Error al actualizar información del cliente");
            setLoading(false);
            return;
          }
          
          toast.info("Información del cliente actualizada");
        }
        
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            name: orderData.customer_name,
            email: orderData.customer_email,
            phone: orderData.customer_phone || null,
            country: orderData.country || "brazil",
          })
          .select("id")
          .single();

        if (customerError) {
          console.error("Error creating customer:", customerError);
          
          // Check if it's a duplicate email error
          if (customerError.code === "23505") {
            toast.error("Este email ya está registrado con información diferente");
          } else {
            toast.error("Error al registrar cliente");
          }
          
          setLoading(false);
          return;
        }
        
        customerId = newCustomer.id;
      }

      // Build full address
      let fullAddress = null;
      if (orderData.order_type === "delivery") {
        const addressParts = [orderData.delivery_address || ""];
        if (!store?.remove_address_number && orderData.address_number) {
          addressParts.push(orderData.address_number);
        }
        if (orderData.address_complement) {
          addressParts.push(orderData.address_complement);
        }
        if (orderData.address_neighborhood) {
          addressParts.push(orderData.address_neighborhood);
        }
        if (!store?.remove_zipcode && orderData.address_zipcode) {
          addressParts.push(orderData.address_zipcode);
        }
        fullAddress = addressParts.filter(Boolean).join(", ");
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            store_id: store.id,
            user_id: session?.user?.id || null,
            customer_id: customerId,
            total_amount: totalPrice,
            customer_name: orderData.customer_name,
            customer_email: orderData.customer_email,
            customer_phone: orderData.customer_phone,
            delivery_address: fullAddress,
            notes: orderData.order_type === "digital_menu" && orderData.table_number 
              ? `Mesa: ${orderData.table_number}${orderData.notes ? `\n${orderData.notes}` : ''}` 
              : orderData.notes || null,
            payment_proof_url: orderData.payment_proof_url || null,
            payment_method: orderData.payment_method || null,
            order_type: orderData.order_type,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price,
        item_name: item.name,
      }));

      const { data: createdItems, error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)
        .select();

      if (itemsError) throw itemsError;

      // Create order item extras
      if (createdItems) {
        const itemExtras = createdItems.flatMap((orderItem, index) => {
          const cartItem = items[index];
          if (!cartItem.extras || cartItem.extras.length === 0) return [];
          
          return cartItem.extras.map((extra) => ({
            order_item_id: orderItem.id,
            extra_name: extra.name,
            extra_price: extra.price,
          }));
        });

        if (itemExtras.length > 0) {
          const { error: extrasError } = await supabase
            .from("order_item_extras")
            .insert(itemExtras);

          if (extrasError) {
            console.error("Error saving extras:", extrasError);
          }
        }
      }

      // Generate WhatsApp message
      if (store.phone && (store.order_product_template || store.order_message_template_delivery)) {
        const whatsappMessage = generateWhatsAppMessage(
          {
            orderNumber: order.id.substring(0, 8).toUpperCase(),
            items: items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              extras: item.extras,
            })),
            totalAmount: totalPrice,
            customerName: orderData.customer_name,
            customerEmail: orderData.customer_email,
            customerPhone: orderData.customer_phone,
            deliveryAddress: fullAddress || "",
            notes: orderData.notes || "",
            paymentMethod: orderData.payment_method || "",
            currency: store.currency || "USD",
            decimalPlaces: store.decimal_places || 2,
            decimalSeparator: store.decimal_separator || ".",
            thousandsSeparator: store.thousands_separator || ",",
          },
          {
            orderProductTemplate: store.order_product_template || "{product-qty} {product-name}",
            orderMessageTemplateDelivery: store.order_message_template_delivery || "Pedido #{order-number}\n\n{order-products}\n\nTotal: {order-total}",
            orderMessageTemplatePickup: store.order_message_template_pickup || "Pedido #{order-number}\n\n{order-products}\n\nTotal: {order-total}",
            orderMessageTemplateDigitalMenu: store.order_message_template_digital_menu || "Pedido #{order-number}\n\n{order-products}\n\nTotal: {order-total}",
          },
          orderData.order_type
        );

        // Redirect to WhatsApp if enabled
        if (store.redirect_to_whatsapp) {
          toast.success("¡Pedido realizado! Redirigiendo a WhatsApp...");
          clearCart();
          sessionStorage.removeItem("pendingOrder");
          
          setTimeout(() => {
            redirectToWhatsApp(store.phone!, whatsappMessage);
            navigate("/");
          }, 1500);
          return;
        } else {
          toast.success("¡Pedido realizado con éxito!", {
            action: {
              label: "Enviar por WhatsApp",
              onClick: () => redirectToWhatsApp(store.phone!, whatsappMessage),
            },
            duration: 10000,
          });
        }
      } else {
        toast.success("¡Pedido realizado con éxito!");
      }

      clearCart();
      sessionStorage.removeItem("pendingOrder");
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
      case "digital_menu":
        return "Servicio en Tienda";
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

          {/* Table Number for Digital Menu */}
          {orderData.order_type === "digital_menu" && orderData.table_number && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Número de Mesa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{orderData.table_number}</p>
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
                                <span>${extra.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${((item.price + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <Separator />
              
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary text-2xl">${totalPrice.toFixed(2)}</span>
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
