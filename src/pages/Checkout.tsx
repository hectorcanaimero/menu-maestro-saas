import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload, X } from "lucide-react";
import InputMask from "react-input-mask";
import { generateWhatsAppMessage, redirectToWhatsApp } from "@/lib/whatsappMessageGenerator";

interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { store } = useStore();
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState<"brazil" | "venezuela">("brazil");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [orderType, setOrderType] = useState<"delivery" | "pickup" | "digital_menu">("delivery");
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    delivery_address: "",
    notes: "",
  });

  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!store?.id) return;

      const { data, error } = await supabase
        .from("payment_methods")
        .select("id, name, description")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error loading payment methods:", error);
      } else if (data) {
        setPaymentMethods(data);
        // Auto-select first method if only one available
        if (data.length === 1) {
          setSelectedPaymentMethod(data[0].name);
        }
      }
    };

    loadPaymentMethods();
  }, [store?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!store?.id) {
      toast.error("No se pudo identificar la tienda");
      return;
    }

    // Validate minimum order price
    if (store.minimum_order_price && totalPrice < store.minimum_order_price) {
      toast.error(`El pedido mínimo es $${store.minimum_order_price.toFixed(2)}`);
      return;
    }

      // Validate delivery address for delivery orders
    if (orderType === "delivery" && !formData.delivery_address.trim()) {
      toast.error("Debes proporcionar una dirección de entrega");
      return;
    }

    // Validate payment method selection
    if (paymentMethods.length > 0 && !selectedPaymentMethod) {
      toast.error("Debes seleccionar un método de pago");
      return;
    }

    // Validate payment proof if required
    if (store.require_payment_proof && !paymentProofFile) {
      toast.error("Debes subir un comprobante de pago");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let paymentProofUrl = null;

      // Upload payment proof if provided
      if (paymentProofFile) {
        const fileExt = paymentProofFile.name.split('.').pop();
        const fileName = `${session?.user?.id || 'anonymous'}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProofFile);

        if (uploadError) {
          console.error('Error uploading payment proof:', uploadError);
          toast.error('Error al subir el comprobante de pago');
          setLoading(false);
          return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(uploadData.path);
        
        paymentProofUrl = urlData.publicUrl;
      }
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            store_id: store.id,
            user_id: session?.user?.id || null,
            total_amount: totalPrice,
            customer_name: formData.customer_name,
            customer_email: formData.customer_email,
            customer_phone: formData.customer_phone,
            delivery_address: orderType === "delivery" ? formData.delivery_address : null,
            notes: formData.notes,
            payment_proof_url: paymentProofUrl,
            payment_method: selectedPaymentMethod || null,
            order_type: orderType,
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
            customerName: formData.customer_name,
            customerEmail: formData.customer_email,
            customerPhone: formData.customer_phone,
            deliveryAddress: formData.delivery_address,
            notes: formData.notes,
            paymentMethod: selectedPaymentMethod,
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
          orderType
        );

        // Redirect to WhatsApp if enabled
        if (store.redirect_to_whatsapp) {
          toast.success("¡Pedido realizado! Redirigiendo a WhatsApp...");
          clearCart();
          
          // Small delay to show the toast
          setTimeout(() => {
            redirectToWhatsApp(store.phone!, whatsappMessage);
            navigate("/");
          }, 1500);
          return;
        } else {
          // Show success with option to send via WhatsApp
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
      navigate("/");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Error al crear el pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo debe ser menor a 5MB");
        return;
      }
      
      // Validate file type (images and PDFs)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Solo se permiten imágenes (JPG, PNG, WEBP) y PDF");
        return;
      }
      
      setPaymentProofFile(file);
    }
  };

  const phoneMask = country === "brazil" ? "+55 (99) 99999-9999" : "+58 (999) 999-9999";

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Menú
        </Button>

        <h1 className="text-3xl font-bold mb-8">Finalizar Pedido</h1>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Información de Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="order-type">Tipo de Orden *</Label>
                  <Select value={orderType} onValueChange={(value: "delivery" | "pickup" | "digital_menu") => setOrderType(value)}>
                    <SelectTrigger id="order-type">
                      <SelectValue placeholder="Selecciona el tipo de orden" />
                    </SelectTrigger>
                    <SelectContent>
                      {store?.operating_modes?.includes("delivery") && (
                        <SelectItem value="delivery">Entrega a Domicilio</SelectItem>
                      )}
                      {store?.operating_modes?.includes("pickup") && (
                        <SelectItem value="pickup">Recoger en Tienda</SelectItem>
                      )}
                      {store?.operating_modes?.includes("digital_menu") && (
                        <SelectItem value="digital_menu">Menú Digital</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {orderType === "delivery" && "Tu pedido será entregado en la dirección que proporciones"}
                    {orderType === "pickup" && "Podrás recoger tu pedido en la tienda"}
                    {orderType === "digital_menu" && "Pedido para consumo en el local"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    value={formData.customer_name}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">País *</Label>
                  <Select value={country} onValueChange={(value: "brazil" | "venezuela") => setCountry(value)}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Selecciona un país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brazil">Brasil</SelectItem>
                      <SelectItem value="venezuela">Venezuela</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <InputMask
                    mask={phoneMask}
                    value={formData.customer_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, customer_phone: e.target.value })
                    }
                  >
                    {/* @ts-ignore */}
                    {(inputProps: any) => (
                      <Input
                        {...inputProps}
                        id="phone"
                        type="tel"
                        required
                      />
                    )}
                  </InputMask>
                </div>

                {orderType === "delivery" && (
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección de Entrega *</Label>
                    <Textarea
                      id="address"
                      value={formData.delivery_address}
                      onChange={(e) =>
                        setFormData({ ...formData, delivery_address: e.target.value })
                      }
                      required
                      rows={3}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas Adicionales</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Instrucciones especiales para la entrega..."
                  />
                </div>

                {paymentMethods.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="payment-method">Método de Pago *</Label>
                    <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                      <SelectTrigger id="payment-method">
                        <SelectValue placeholder="Selecciona un método de pago" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.name}>
                            <div className="flex flex-col">
                              <span>{method.name}</span>
                              {method.description && (
                                <span className="text-xs text-muted-foreground">
                                  {method.description}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {store?.require_payment_proof && (
                  <div className="space-y-2">
                    <Label htmlFor="payment-proof">
                      Comprobante de Pago * 
                      <span className="text-xs text-muted-foreground ml-2">(Requerido)</span>
                    </Label>
                    <div className="space-y-2">
                      <Input
                        id="payment-proof"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                        required
                      />
                      {paymentProofFile && (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <Upload className="w-4 h-4 text-primary" />
                          <span className="text-sm flex-1">{paymentProofFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPaymentProofFile(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Formatos aceptados: JPG, PNG, WEBP, PDF. Tamaño máximo: 5MB
                      </p>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg" 
                  disabled={loading || (store?.minimum_order_price ? totalPrice < store.minimum_order_price : false)}
                >
                  {loading ? "Procesando..." : "Confirmar Pedido"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.cartItemId || item.id} className="pb-4 border-b">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Cantidad: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${((item.price + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {item.extras && item.extras.length > 0 && (
                    <div className="ml-20 mt-2 text-sm text-muted-foreground space-y-1">
                      {item.extras.map((extra, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>+ {extra.name}</span>
                          <span>${extra.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-4 space-y-2">
                {store?.minimum_order_price && totalPrice < store.minimum_order_price && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive font-medium">
                      Pedido mínimo: ${store.minimum_order_price.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Te faltan ${(store.minimum_order_price - totalPrice).toFixed(2)} para alcanzar el mínimo
                    </p>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;