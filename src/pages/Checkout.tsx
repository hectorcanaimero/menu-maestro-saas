import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { useStoreTheme } from "@/hooks/useStoreTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Upload, X, Check } from "lucide-react";
import InputMask from "react-input-mask";

interface PaymentMethod {
  id: string;
  name: string;
  description: string | null;
}

interface DeliveryZone {
  id: string;
  zone_name: string;
  delivery_price: number;
}

// Create validation schema for each step
const createStepSchema = (
  step: number,
  orderType: "delivery" | "pickup" | "digital_menu",
  removeZipcode: boolean,
  removeAddressNumber: boolean,
  requirePaymentMethod: boolean
) => {
  if (step === 1) {
    // Step 1: Order type + Customer info
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
    });
  } else if (step === 2) {
    // Step 2: Delivery/pickup/table info
    if (orderType === "delivery") {
      const schema: any = {
        delivery_address: z
          .string()
          .trim()
          .min(5, { message: "La dirección debe tener al menos 5 caracteres" })
          .max(200, { message: "La dirección no puede exceder 200 caracteres" }),
        address_complement: z.string().optional(),
        address_neighborhood: z
          .string()
          .min(1, { message: "Debes seleccionar un barrio" }),
      };
      
      if (!removeAddressNumber) {
        schema.address_number = z
          .string()
          .trim()
          .min(1, { message: "El número es requerido" })
          .max(20, { message: "El número no puede exceder 20 caracteres" });
      }
      
      if (!removeZipcode) {
        schema.address_zipcode = z
          .string()
          .trim()
          .min(4, { message: "El código postal debe tener al menos 4 caracteres" })
          .max(20, { message: "El código postal no puede exceder 20 caracteres" });
      }
      
      return z.object(schema);
    } else if (orderType === "digital_menu") {
      return z.object({
        table_number: z
          .string()
          .trim()
          .min(1, { message: "El número de mesa es requerido" })
          .max(10, { message: "El número de mesa no puede exceder 10 caracteres" }),
      });
    }
  } else if (step === 3) {
    // Step 3: Payment + notes
    const schema: any = {
      notes: z
        .string()
        .trim()
        .max(500, { message: "Las notas no pueden exceder 500 caracteres" })
        .optional(),
    };
    
    if (requirePaymentMethod) {
      schema.payment_method = z.string().min(1, { message: "Debes seleccionar un método de pago" });
    }
    
    return z.object(schema);
  }
  
  return z.object({});
};

type CheckoutFormData = {
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
};

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice } = useCart();
  const { store } = useStore();

  // Apply store theme colors
  useStoreTheme();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState<"brazil" | "venezuela">("brazil");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [orderType, setOrderType] = useState<"delivery" | "pickup" | "digital_menu">("delivery");

  const totalSteps = orderType === "pickup" ? 3 : 3; // Same steps for all types
  const progress = (currentStep / totalSteps) * 100;

  // Create form with validation
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(
      createStepSchema(
        currentStep,
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
        if (data.length === 1) {
          form.setValue("payment_method", data[0].name);
        }
      }
    };

    const loadDeliveryZones = async () => {
      if (!store?.id) return;

      const { data, error } = await supabase
        .from("delivery_zones")
        .select("id, zone_name, delivery_price")
        .eq("store_id", store.id)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error loading delivery zones:", error);
      } else if (data) {
        setDeliveryZones(data);
      }
    };

    loadPaymentMethods();
    loadDeliveryZones();
  }, [store?.id, form]);

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/");
    }
  };

  const handleSubmit = async () => {
    if (!store?.id) {
      toast.error("No se pudo identificar la tienda");
      return;
    }

    // Validate minimum order price
    if (store.minimum_order_price && totalPrice < store.minimum_order_price) {
      toast.error(`El pedido mínimo es $${store.minimum_order_price.toFixed(2)}`);
      return;
    }

    // Validate payment proof if required (only for delivery and pickup)
    if (store.require_payment_proof && (orderType === "delivery" || orderType === "pickup") && !paymentProofFile) {
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

        const { data: urlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(uploadData.path);
        
        paymentProofUrl = urlData.publicUrl;
      }

      const formData = form.getValues();
      
      // Save order data to sessionStorage and navigate to confirmation
      const orderData = {
        ...formData,
        order_type: orderType,
        payment_proof_url: paymentProofUrl,
        country: country,
      };
      
      sessionStorage.setItem("pendingOrder", JSON.stringify(orderData));
      navigate("/confirm-order");
    } catch (error) {
      console.error("Error preparing order:", error);
      toast.error("Error al preparar el pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo debe ser menor a 5MB");
        return;
      }
      
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

  const getStepTitle = () => {
    if (currentStep === 1) return "Información del Cliente";
    if (currentStep === 2) {
      if (orderType === "delivery") return "Información de Entrega";
      if (orderType === "digital_menu") return "Información de Mesa";
      return "Confirmar Tipo de Orden";
    }
    return "Método de Pago";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step < currentStep
                      ? "bg-primary text-primary-foreground"
                      : step === currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step < currentStep ? <Check className="w-4 h-4" /> : step}
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">{getStepTitle()}</h2>

        <Form {...form}>
          <form className="space-y-6">
            {/* Step 1: Customer Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* Order Type */}
                <div className="space-y-3">
                  <FormLabel>Tipo de Orden *</FormLabel>
                  <div className="grid grid-cols-3 gap-3">
                    {store?.operating_modes?.includes("delivery") && (
                      <Button
                        type="button"
                        variant={orderType === "delivery" ? "default" : "outline"}
                        className="h-auto py-4"
                        onClick={() => setOrderType("delivery")}
                      >
                        Entrega
                      </Button>
                    )}
                    {store?.operating_modes?.includes("pickup") && (
                      <Button
                        type="button"
                        variant={orderType === "pickup" ? "default" : "outline"}
                        className="h-auto py-4"
                        onClick={() => setOrderType("pickup")}
                      >
                        Pickup
                      </Button>
                    )}
                    {store?.operating_modes?.includes("digital_menu") && (
                      <Button
                        type="button"
                        variant={orderType === "digital_menu" ? "default" : "outline"}
                        className="h-auto py-4"
                        onClick={() => setOrderType("digital_menu")}
                      >
                        Servicio en Tienda
                      </Button>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Tu nombre completo" />
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
                        <Input {...field} type="email" placeholder="tu@email.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>País *</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={country === "brazil" ? "default" : "outline"}
                      onClick={() => setCountry("brazil")}
                    >
                      Brasil
                    </Button>
                    <Button
                      type="button"
                      variant={country === "venezuela" ? "default" : "outline"}
                      onClick={() => setCountry("venezuela")}
                    >
                      Venezuela
                    </Button>
                  </div>
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
              </div>
            )}

            {/* Step 2: Delivery/Table Info */}
            {currentStep === 2 && (
              <div className="space-y-4">
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
                              <Input {...field} placeholder="123" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="address_neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Barrio *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona tu barrio" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {deliveryZones.map((zone) => (
                                <SelectItem key={zone.id} value={zone.zone_name}>
                                  {zone.zone_name} - ${zone.delivery_price.toFixed(2)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address_complement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Apto 4B, Casa 5, etc." />
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
                              <Input {...field} placeholder="12345-678" />
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
                          <Input {...field} type="number" placeholder="1" className="text-2xl text-center py-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {orderType === "pickup" && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Podrás recoger tu pedido en la tienda
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {store?.address || "Dirección disponible en la confirmación"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {paymentMethods.length > 0 && (
                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Pago *</FormLabel>
                        <div className="space-y-2">
                          {paymentMethods.map((method) => (
                            <Button
                              key={method.id}
                              type="button"
                              variant={field.value === method.name ? "default" : "outline"}
                              className="w-full h-auto py-4 justify-start"
                              onClick={() => field.onChange(method.name)}
                            >
                              <div className="text-left">
                                <div className="font-semibold">{method.name}</div>
                                {method.description && (
                                  <div className="text-xs opacity-80 mt-1">
                                    {method.description}
                                  </div>
                                )}
                              </div>
                            </Button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {store?.require_payment_proof && (orderType === "delivery" || orderType === "pickup") && (
                  <div className="space-y-2">
                    <FormLabel>
                      Comprobante de Pago *
                    </FormLabel>
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                      required
                    />
                    {paymentProofFile && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
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
                      Formatos: JPG, PNG, WEBP, PDF. Máximo 5MB
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cupón</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Si tienes un cupón de descuento, añádelo aquí" />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Si tienes un cupón de descuento, añádelo aquí.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Order Summary */}
                <div className="bg-muted p-4 rounded-lg space-y-3 mt-6">
                  <h3 className="font-semibold">Resumen del Pedido</h3>
                  <div className="space-y-2">
                    {items.slice(0, 3).map((item) => (
                      <div key={item.cartItemId || item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="text-price font-medium">${((item.price + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{items.length - 3} artículos más</p>
                    )}
                  </div>
                  <div className="pt-3 border-t flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-price text-lg">${totalPrice.toFixed(2)}</span>
                  </div>
                  {store?.minimum_order_price && totalPrice < store.minimum_order_price && (
                    <Badge variant="destructive" className="w-full justify-center">
                      Pedido mínimo: ${store.minimum_order_price.toFixed(2)}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>

      {/* Footer with Next Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="container mx-auto max-w-2xl">
          <Button
            onClick={handleNext}
            disabled={loading || (store?.minimum_order_price ? totalPrice < store.minimum_order_price : false)}
            className="w-full h-14 text-lg"
            size="lg"
          >
            {loading ? (
              "Procesando..."
            ) : currentStep === totalSteps ? (
              "Revisar Pedido"
            ) : (
              <>
                Siguiente
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
