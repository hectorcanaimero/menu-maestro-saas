import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { ArrowLeft, Upload, X } from "lucide-react";
import InputMask from "react-input-mask";
import { generateWhatsAppMessage, redirectToWhatsApp } from "@/lib/whatsappMessageGenerator";

interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
}

// Create validation schema
const createCheckoutSchema = (
  orderType: "delivery" | "pickup" | "digital_menu",
  removeZipcode: boolean,
  removeAddressNumber: boolean,
  requirePaymentMethod: boolean
) => {
  return z.object({
    customer_name: z
      .string()
      .trim()
      .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
      .max(100, { message: "El nombre no puede exceder 100 caracteres" }),
    customer_email: z
      .string()
      .trim()
      .email({ message: "Debe ser un email válido" })
      .max(255, { message: "El email no puede exceder 255 caracteres" }),
    customer_phone: z
      .string()
      .trim()
      .min(10, { message: "El teléfono debe tener al menos 10 dígitos" })
      .max(20, { message: "El teléfono no puede exceder 20 caracteres" }),
    delivery_address: orderType === "delivery"
      ? z
          .string()
          .trim()
          .min(5, { message: "La dirección debe tener al menos 5 caracteres" })
          .max(200, { message: "La dirección no puede exceder 200 caracteres" })
      : z.string().optional(),
    address_number: orderType === "delivery" && !removeAddressNumber
      ? z
          .string()
          .trim()
          .min(1, { message: "El número es requerido" })
          .max(20, { message: "El número no puede exceder 20 caracteres" })
      : z.string().optional(),
    address_complement: z
      .string()
      .trim()
      .max(100, { message: "El complemento no puede exceder 100 caracteres" })
      .optional(),
    address_neighborhood: z
      .string()
      .trim()
      .max(100, { message: "El barrio no puede exceder 100 caracteres" })
      .optional(),
    address_zipcode: orderType === "delivery" && !removeZipcode
      ? z
          .string()
          .trim()
          .min(4, { message: "El código postal debe tener al menos 4 caracteres" })
          .max(20, { message: "El código postal no puede exceder 20 caracteres" })
      : z.string().optional(),
    table_number: orderType === "digital_menu"
      ? z
          .string()
          .trim()
          .min(1, { message: "El número de mesa es requerido" })
          .max(10, { message: "El número de mesa no puede exceder 10 caracteres" })
      : z.string().optional(),
    notes: z
      .string()
      .trim()
      .max(500, { message: "Las notas no pueden exceder 500 caracteres" })
      .optional(),
    payment_method: requirePaymentMethod
      ? z.string().min(1, { message: "Debes seleccionar un método de pago" })
      : z.string().optional(),
  });
};

type CheckoutFormData = z.infer<ReturnType<typeof createCheckoutSchema>>;

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { store } = useStore();
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState<"brazil" | "venezuela">("brazil");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [orderType, setOrderType] = useState<"delivery" | "pickup" | "digital_menu">("delivery");

  // Create form with validation
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(
      createCheckoutSchema(
        orderType,
        store?.remove_zipcode || false,
        store?.remove_address_number || false,
        paymentMethods.length > 0
      )
    ),
    defaultValues: {
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      delivery_address: "",
      address_number: "",
      address_complement: "",
      address_neighborhood: "",
      address_zipcode: "",
      table_number: "",
      notes: "",
      payment_method: "",
    },
    mode: "onChange",
  });

  // Update form validation when orderType or store settings change
  useEffect(() => {
    form.clearErrors();
  }, [orderType, store?.remove_zipcode, store?.remove_address_number, form]);

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
          form.setValue("payment_method", data[0].name);
        }
      }
    };

    loadPaymentMethods();
  }, [store?.id, form]);

  const handleSubmit = async (data: CheckoutFormData) => {
    if (!store?.id) {
      toast.error("No se pudo identificar la tienda");
      return;
    }

    // Validate minimum order price
    if (store.minimum_order_price && totalPrice < store.minimum_order_price) {
      toast.error(`El pedido mínimo es $${store.minimum_order_price.toFixed(2)}`);
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
      
      // Build delivery address string for delivery orders
      let fullAddress = null;
      if (orderType === "delivery") {
        const addressParts = [data.delivery_address || ""];
        if (!store?.remove_address_number && data.address_number) {
          addressParts.push(data.address_number);
        }
        if (data.address_complement) {
          addressParts.push(data.address_complement);
        }
        if (data.address_neighborhood) {
          addressParts.push(data.address_neighborhood);
        }
        if (!store?.remove_zipcode && data.address_zipcode) {
          addressParts.push(data.address_zipcode);
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
            total_amount: totalPrice,
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            customer_phone: data.customer_phone,
            delivery_address: fullAddress,
            notes: orderType === "digital_menu" && data.table_number 
              ? `Mesa: ${data.table_number}${data.notes ? `\n${data.notes}` : ''}` 
              : data.notes || null,
            payment_proof_url: paymentProofUrl,
            payment_method: data.payment_method || null,
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
            customerName: data.customer_name,
            customerEmail: data.customer_email,
            customerPhone: data.customer_phone,
            deliveryAddress: fullAddress || "",
            notes: data.notes || "",
            paymentMethod: data.payment_method || "",
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
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel htmlFor="order-type">Tipo de Orden *</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="customer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: Juan Pérez" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="Ej: juan@email.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel htmlFor="country">País *</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="customer_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono *</FormLabel>
                        <FormControl>
                          <InputMask
                            mask={phoneMask}
                            value={field.value}
                            onChange={field.onChange}
                          >
                            {/* @ts-ignore */}
                            {(inputProps: any) => (
                              <Input
                                {...inputProps}
                                type="tel"
                                placeholder={country === "brazil" ? "+55 (00) 00000-0000" : "+58 (000) 000-0000"}
                              />
                            )}
                          </InputMask>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {orderType === "delivery" && (
                    <>
                      <FormField
                        control={form.control}
                        name="delivery_address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Calle/Avenida/Pasaje *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej: Av. Principal" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!store?.remove_address_number && (
                        <FormField
                          control={form.control}
                          name="address_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ej: 123" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="address_complement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complemento</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej: Apto 4B, Casa 5, etc." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address_neighborhood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Barrio/Vecindario</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej: Centro" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!store?.remove_zipcode && (
                        <FormField
                          control={form.control}
                          name="address_zipcode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código Postal *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ej: 12345-678" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}

                  {orderType === "digital_menu" && (
                    <FormField
                      control={form.control}
                      name="table_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Mesa *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="Ej: 1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas Adicionales</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} placeholder="Instrucciones especiales..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {paymentMethods.length > 0 && (
                    <FormField
                      control={form.control}
                      name="payment_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Método de Pago *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un método de pago" />
                              </SelectTrigger>
                            </FormControl>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {store?.require_payment_proof && (
                    <div className="space-y-2">
                      <FormLabel htmlFor="payment-proof">
                        Comprobante de Pago * 
                        <span className="text-xs text-muted-foreground ml-2">(Obligatorio)</span>
                      </FormLabel>
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
                          Adjunta tu comprobante de pago (JPG, PNG, WEBP, PDF). Tamaño máximo: 5MB
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
              </Form>
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
