import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Minus, X, ShoppingCart, User, MapPin, CreditCard } from "lucide-react";
import posthog from "posthog-js";

import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { useAdminCart } from "@/hooks/useAdminCart";
import { useFormatPrice } from "@/lib/priceFormatter";
import { findOrCreateCustomer } from "@/services/customerService";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { ProductExtrasDialog } from "@/components/catalog/ProductExtrasDialog";

interface AdminOrderCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (orderId: string) => void;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category_id: string | null;
}

interface DeliveryZone {
  id: string;
  zone_name: string;
  delivery_price: number;
}

// Form schema
const step1Schema = z.object({
  customer_email: z.string().email("Email inválido"),
  customer_name: z.string().min(2, "Nombre requerido"),
  customer_phone: z.string().min(10, "Teléfono inválido"),
  order_type: z.enum(["delivery", "pickup", "dine_in"]),
});

const step2DeliverySchema = z.object({
  delivery_address: z.string().min(5, "Dirección requerida"),
  delivery_zone: z.string().min(1, "Selecciona una zona"),
});

type FormData = z.infer<typeof step1Schema> & {
  delivery_address?: string;
  delivery_zone?: string;
  notes?: string;
  payment_method?: string;
};

export const AdminOrderCreate = ({ open, onOpenChange, onSuccess }: AdminOrderCreateProps) => {
  const navigate = useNavigate();
  const { store } = useStore();
  const formatPrice = useFormatPrice();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Cart management
  const { items, addItem, removeItem, updateQuantity, clearCart, totalPrice } = useAdminCart();

  // Menu items and customers
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Product extras dialog
  const [showExtrasDialog, setShowExtrasDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(
      currentStep === 1
        ? step1Schema
        : currentStep === 2 && orderType === "delivery"
        ? step2DeliverySchema
        : z.object({})
    ),
    defaultValues: {
      customer_email: "",
      customer_name: "",
      customer_phone: "",
      order_type: "delivery",
      delivery_address: "",
      delivery_zone: "",
    },
  });

  const orderType = form.watch("order_type");
  const selectedZone = form.watch("delivery_zone");

  // Load menu items
  useEffect(() => {
    if (open && store?.id) {
      loadMenuItems();
      loadCustomers();
      loadDeliveryZones();
    }
  }, [open, store?.id]);

  // Update delivery price
  useEffect(() => {
    if (orderType === "delivery" && selectedZone) {
      const zone = deliveryZones.find(z => z.zone_name === selectedZone);
      setDeliveryPrice(zone?.delivery_price || 0);
    } else {
      setDeliveryPrice(0);
    }
  }, [selectedZone, orderType, deliveryZones]);

  const loadMenuItems = async () => {
    if (!store?.id) return;

    const { data, error } = await supabase
      .from("menu_items")
      .select("id, name, price, image_url, category_id")
      .eq("store_id", store.id)
      .eq("is_available", true)
      .order("name");

    if (!error && data) {
      setMenuItems(data);
    }
  };

  const loadCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("id, name, email, phone")
      .order("name")
      .limit(50);

    if (data) {
      setCustomers(data);
    }
  };

  const loadDeliveryZones = async () => {
    if (!store?.id) return;

    const { data } = await supabase
      .from("delivery_zones")
      .select("id, zone_name, delivery_price")
      .eq("store_id", store.id)
      .order("display_order");

    if (data) {
      setDeliveryZones(data);
    }
  };

  const handleAddProduct = (item: MenuItem) => {
    setSelectedProduct(item);
    setShowExtrasDialog(true);
  };

  const handleConfirmWithExtras = (extras: Array<{ id: string; name: string; price: number }>) => {
    if (!selectedProduct) return;

    addItem({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      image_url: selectedProduct.image_url,
      extras,
      categoryId: selectedProduct.category_id,
    });

    toast.success(`${selectedProduct.name} agregado`);
    setSelectedProduct(null);
  };

  const handleNext = async () => {
    // Only validate if we need form validation for this step
    if (currentStep === 1 || (currentStep === 2 && orderType === "delivery")) {
      const isValid = await form.trigger();
      if (!isValid) return;
    }

    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Only validate delivery zone for delivery orders
      if (orderType === "delivery" && !form.getValues("delivery_zone")) {
        toast.error("Selecciona una zona de entrega");
        return;
      }
      // For pickup and dine_in, just proceed to next step
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (items.length === 0) {
        toast.error("Agrega al menos un producto");
        return;
      }
      setCurrentStep(4);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!store?.id) {
      toast.error("Error: tienda no identificada");
      return;
    }

    if (items.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error("Selecciona un método de pago");
      return;
    }

    setCreating(true);

    try {
      const formData = form.getValues();

      // Find or create customer
      const customerResult = await findOrCreateCustomer({
        name: formData.customer_name,
        email: formData.customer_email,
        phone: formData.customer_phone,
        country: "venezuela",
      });

      if (!customerResult) {
        toast.error("Error al crear/encontrar cliente");
        setCreating(false);
        return;
      }

      // Prepare items for RPC
      const orderItems = items.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price,
        item_name: item.name,
        extras: item.extras || [],
      }));

      const grandTotal = totalPrice + deliveryPrice;

      // Call RPC to create order
      const { data, error } = await supabase.rpc("admin_create_order", {
        p_store_id: store.id,
        p_customer_id: customerResult.customerId,
        p_customer_name: formData.customer_name,
        p_customer_email: formData.customer_email,
        p_customer_phone: formData.customer_phone,
        p_order_type: formData.order_type,
        p_delivery_address: formData.order_type === "delivery" ? formData.delivery_address : null,
        p_notes: notes || null,
        p_payment_method: selectedPaymentMethod,
        p_total_amount: grandTotal,
        p_delivery_price: deliveryPrice,
        p_items: orderItems,
      });

      if (error) throw error;

      const result = data[0];

      if (!result.success) {
        throw new Error(result.error_message || "Error al crear pedido");
      }

      // Track in PostHog
      try {
        posthog.capture("admin_order_created", {
          store_id: store.id,
          order_id: result.order_id,
          order_total: grandTotal,
          items_count: items.length,
          payment_method: selectedPaymentMethod,
          order_type: formData.order_type,
        });
      } catch (e) {
        console.error("[PostHog] Error tracking admin_order_created:", e);
      }

      toast.success(`Pedido #${result.order_number} creado exitosamente`);

      // Clear and close
      clearCart();
      form.reset();
      setCurrentStep(1);
      setSelectedPaymentMethod(null);
      setNotes("");
      onOpenChange(false);

      // Call success callback
      if (onSuccess) {
        onSuccess(result.order_id);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear pedido");
    } finally {
      setCreating(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Información del Cliente";
      case 2:
        return orderType === "delivery" ? "Información de Entrega" : orderType === "pickup" ? "Recoger en Tienda" : "Servicio en Mesa";
      case 3:
        return "Agregar Productos";
      case 4:
        return "Método de Pago y Confirmación";
      default:
        return "";
    }
  };

  const grandTotal = totalPrice + deliveryPrice;

  return (
    <>
      <ProductExtrasDialog
        open={showExtrasDialog}
        onOpenChange={setShowExtrasDialog}
        productId={selectedProduct?.id || ""}
        productName={selectedProduct?.name || ""}
        productPrice={selectedProduct?.price || 0}
        onConfirm={handleConfirmWithExtras}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">Crear Pedido Manual</DialogTitle>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((step) => (
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
            </div>
            <Progress value={progress} className="h-1 mt-3" />
          </DialogHeader>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              {currentStep === 1 && <User className="w-5 h-5" />}
              {currentStep === 2 && <MapPin className="w-5 h-5" />}
              {currentStep === 3 && <ShoppingCart className="w-5 h-5" />}
              {currentStep === 4 && <CreditCard className="w-5 h-5" />}
              {getStepTitle()}
            </h3>

            <Form {...form}>
              <form className="space-y-6">
                {/* Step 1: Customer Info */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="order_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Pedido</FormLabel>
                          <div className="grid grid-cols-3 gap-3">
                            <Button
                              type="button"
                              variant={field.value === "delivery" ? "default" : "outline"}
                              onClick={() => field.onChange("delivery")}
                              className="h-12"
                            >
                              Entrega a Domicilio
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === "pickup" ? "default" : "outline"}
                              onClick={() => field.onChange("pickup")}
                              className="h-12"
                            >
                              Recoger en Tienda
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === "dine_in" ? "default" : "outline"}
                              onClick={() => field.onChange("dine_in")}
                              className="h-12"
                            >
                              Servicio en Mesa
                            </Button>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email del Cliente</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="cliente@ejemplo.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Juan Pérez" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+58 414 123-4567" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Delivery Info */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    {orderType === "delivery" ? (
                      <>
                        <FormField
                          control={form.control}
                          name="delivery_address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Dirección de Entrega</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Av. Principal, Casa 123" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="delivery_zone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zona de Entrega</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una zona" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {deliveryZones.map((zone) => (
                                    <SelectItem key={zone.id} value={zone.zone_name}>
                                      {zone.zone_name} - {formatPrice(zone.delivery_price)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    ) : orderType === "pickup" ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">El cliente recogerá el pedido en la tienda</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {store?.address || "Dirección de la tienda"}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Pedido para servicio en mesa</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          El cliente consumirá en el restaurante
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Add Products */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    {/* Current Cart */}
                    {items.length > 0 && (
                      <Card>
                        <CardContent className="p-4 space-y-3">
                          <h4 className="font-semibold text-sm">Productos en el Pedido</h4>
                          {items.map((item) => (
                            <div
                              key={item.cartItemId}
                              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                            >
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                {item.extras && item.extras.length > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    + {item.extras.map(e => e.name).join(", ")}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.cartItemId!, item.quantity - 1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">{item.quantity}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.cartItemId!, item.quantity + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="font-semibold text-sm w-20 text-right">
                                {formatPrice(
                                  (item.price + (item.extras?.reduce((s, e) => s + e.price, 0) || 0)) *
                                    item.quantity
                                )}
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => removeItem(item.cartItemId!)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Separator />
                          <div className="flex justify-between font-semibold">
                            <span>Subtotal:</span>
                            <span>{formatPrice(totalPrice)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Available Products */}
                    <div>
                      <h4 className="font-semibold mb-4">Productos Disponibles</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
                        {menuItems.map((item) => (
                          <Card
                            key={item.id}
                            className="cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                            onClick={() => handleAddProduct(item)}
                          >
                            <CardContent className="p-4">
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-full h-32 object-cover rounded-lg mb-3"
                                />
                              )}
                              <p className="font-medium text-base mb-1 line-clamp-2">{item.name}</p>
                              <p className="text-primary font-bold text-lg">{formatPrice(item.price)}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Payment & Summary */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <PaymentMethodSelector
                      selectedMethod={selectedPaymentMethod}
                      onMethodChange={setSelectedPaymentMethod}
                      required
                    />

                    <div>
                      <FormLabel>Notas Adicionales</FormLabel>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Instrucciones especiales (opcional)"
                        rows={3}
                        className="mt-2"
                      />
                    </div>

                    {/* Order Summary */}
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <h4 className="font-semibold">Resumen del Pedido</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal ({items.length} productos):</span>
                            <span>{formatPrice(totalPrice)}</span>
                          </div>
                          {orderType === "delivery" && deliveryPrice > 0 && (
                            <div className="flex justify-between">
                              <span>Costo de entrega:</span>
                              <span>{formatPrice(deliveryPrice)}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-primary">{formatPrice(grandTotal)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </form>
            </Form>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || creating}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Atrás
            </Button>
            <Button onClick={handleNext} className="flex-1" disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : currentStep === totalSteps ? (
                "Crear Pedido"
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
