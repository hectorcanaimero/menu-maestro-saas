import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Save, Plus, Minus, X } from "lucide-react";
import posthog from "posthog-js";

import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { useFormatPrice } from "@/lib/priceFormatter";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { ProductExtrasDialog } from "@/components/catalog/ProductExtrasDialog";

interface AdminOrderEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
  onSuccess?: () => void;
}

interface OrderItem {
  id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  price_at_time: number;
  order_item_extras: Array<{
    id: string;
    extra_name: string;
    extra_price: number;
  }>;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_address: string | null;
  notes: string | null;
  payment_method: string | null;
  status: string;
  order_type: string | null;
  total_amount: number;
  delivery_price: number | null;
  order_items: OrderItem[];
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

interface CartItem {
  menu_item_id: string;
  item_name: string;
  quantity: number;
  price_at_time: number;
  extras: Array<{ name: string; price: number }>;
  cartItemId: string;
}

const formSchema = z.object({
  customer_name: z.string().min(2, "Nombre requerido"),
  customer_email: z.string().email("Email inválido"),
  customer_phone: z.string().min(10, "Teléfono inválido"),
  delivery_address: z.string().optional(),
  notes: z.string().optional(),
  status: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export const AdminOrderEdit = ({ open, onOpenChange, orderId, onSuccess }: AdminOrderEditProps) => {
  const { store } = useStore();
  const formatPrice = useFormatPrice();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [canEdit, setCanEdit] = useState(true);
  const [editReason, setEditReason] = useState("");

  const [items, setItems] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showExtrasDialog, setShowExtrasDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      delivery_address: "",
      notes: "",
      status: "pending",
    },
  });

  useEffect(() => {
    if (open && orderId) {
      loadOrder();
      loadMenuItems();
    }
  }, [open, orderId]);

  const loadOrder = async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      // Check if can edit
      const { data: canEditData } = await supabase.rpc("admin_can_edit_order", {
        p_order_id: orderId,
      });

      if (canEditData && canEditData.length > 0) {
        const result = canEditData[0];
        setCanEdit(result.can_edit);
        setEditReason(result.reason || "");

        if (!result.can_edit) {
          toast.error(result.reason);
        }
      }

      // Load order
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            item_name,
            quantity,
            price_at_time,
            order_item_extras (
              id,
              extra_name,
              extra_price
            )
          )
        `)
        .eq("id", orderId)
        .single();

      if (error) throw error;

      setOrder(data);
      setSelectedPaymentMethod(data.payment_method);

      // Populate form
      form.reset({
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone || "",
        delivery_address: data.delivery_address || "",
        notes: data.notes || "",
        status: data.status,
      });

      // Convert order items to cart items
      const cartItems: CartItem[] = data.order_items.map((item: OrderItem, index: number) => ({
        menu_item_id: item.menu_item_id,
        item_name: item.item_name,
        quantity: item.quantity,
        price_at_time: item.price_at_time,
        extras: item.order_item_extras.map(extra => ({
          name: extra.extra_name,
          price: extra.extra_price,
        })),
        cartItemId: `${item.menu_item_id}_${index}`,
      }));

      setItems(cartItems);
    } catch (error) {
      console.error("Error loading order:", error);
      toast.error("Error al cargar pedido");
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    if (!store?.id) return;

    const { data } = await supabase
      .from("menu_items")
      .select("id, name, price, image_url")
      .eq("store_id", store.id)
      .eq("is_available", true)
      .order("name");

    if (data) {
      setMenuItems(data);
    }
  };

  const handleAddProduct = (item: MenuItem) => {
    setSelectedProduct(item);
    setShowExtrasDialog(true);
  };

  const handleConfirmWithExtras = (extras: Array<{ id: string; name: string; price: number }>) => {
    if (!selectedProduct) return;

    const newItem: CartItem = {
      menu_item_id: selectedProduct.id,
      item_name: selectedProduct.name,
      quantity: 1,
      price_at_time: selectedProduct.price,
      extras: extras.map(e => ({ name: e.name, price: e.price })),
      cartItemId: `${selectedProduct.id}_${Date.now()}`,
    };

    setItems([...items, newItem]);
    toast.success(`${selectedProduct.name} agregado`);
    setSelectedProduct(null);
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(items.filter(item => item.cartItemId !== cartItemId));
    } else {
      setItems(items.map(item =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      ));
    }
  };

  const removeItem = (cartItemId: string) => {
    setItems(items.filter(item => item.cartItemId !== cartItemId));
  };

  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => {
      const extrasTotal = item.extras.reduce((s, e) => s + e.price, 0);
      return sum + (item.price_at_time + extrasTotal) * item.quantity;
    }, 0);

    const deliveryPrice = order?.delivery_price || 0;
    return itemsTotal + deliveryPrice;
  };

  const handleSubmit = async (data: FormData) => {
    if (!orderId || !store?.id) return;

    if (!canEdit) {
      toast.error(editReason || "Este pedido no puede ser editado");
      return;
    }

    setSaving(true);

    try {
      // Prepare items for RPC
      const orderItems = items.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price_at_time: item.price_at_time,
        item_name: item.item_name,
        extras: item.extras,
      }));

      // Call RPC to update order
      const { data: result, error } = await supabase.rpc("admin_update_order", {
        p_order_id: orderId,
        p_customer_name: data.customer_name,
        p_customer_email: data.customer_email,
        p_customer_phone: data.customer_phone,
        p_delivery_address: data.delivery_address || null,
        p_notes: data.notes || null,
        p_payment_method: selectedPaymentMethod,
        p_status: data.status,
        p_items: orderItems,
        p_recalculate_total: true,
      });

      if (error) throw error;

      const updateResult = result[0];

      if (!updateResult.success) {
        throw new Error(updateResult.error_message || "Error al actualizar pedido");
      }

      // Track in PostHog
      try {
        posthog.capture("admin_order_edited", {
          store_id: store.id,
          order_id: orderId,
          fields_changed: ["items", "customer", "payment"],
          new_total: updateResult.new_total,
        });
      } catch (e) {
        console.error("[PostHog] Error tracking admin_order_edited:", e);
      }

      toast.success("Pedido actualizado exitosamente");
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar pedido");
    } finally {
      setSaving(false);
    }
  };

  const totalPrice = items.reduce((sum, item) => {
    const extrasTotal = item.extras.reduce((s, e) => s + e.price, 0);
    return sum + (item.price_at_time + extrasTotal) * item.quantity;
  }, 0);

  const grandTotal = calculateTotal();

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
            <DialogTitle className="flex items-center justify-between">
              <span>Editar Pedido #{order?.id.slice(0, 8).toUpperCase()}</span>
              {!canEdit && (
                <Badge variant="destructive">No editable</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Información del Cliente</h3>

                  <FormField
                    control={form.control}
                    name="customer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!canEdit} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" disabled={!canEdit} />
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
                          <Input {...field} disabled={!canEdit} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {order?.order_type === "delivery" && (
                    <FormField
                      control={form.control}
                      name="delivery_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección de Entrega</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!canEdit} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <Separator />

                {/* Order Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Productos del Pedido</h3>
                    {canEdit && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowExtrasDialog(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Producto
                      </Button>
                    )}
                  </div>

                  {items.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No hay productos en este pedido</p>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <Card key={item.cartItemId}>
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.item_name}</p>
                              {item.extras.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  + {item.extras.map(e => e.name).join(", ")}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(item.price_at_time)} c/u
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                disabled={!canEdit}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                disabled={!canEdit}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>

                            <p className="font-semibold text-sm w-20 text-right">
                              {formatPrice(
                                (item.price_at_time + item.extras.reduce((s, e) => s + e.price, 0)) *
                                  item.quantity
                              )}
                            </p>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => removeItem(item.cartItemId)}
                              disabled={!canEdit}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}

                      <Separator />

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatPrice(totalPrice)}</span>
                        </div>
                        {order?.order_type === "delivery" && order.delivery_price > 0 && (
                          <div className="flex justify-between">
                            <span>Costo de entrega:</span>
                            <span>{formatPrice(order.delivery_price)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span className="text-primary">{formatPrice(grandTotal)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show available products for adding */}
                  {canEdit && menuItems.length > 0 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-primary">
                        Ver productos disponibles
                      </summary>
                      <div className="grid grid-cols-3 gap-3 mt-3 max-h-60 overflow-y-auto">
                        {menuItems.map((item) => (
                          <Card
                            key={item.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleAddProduct(item)}
                          >
                            <CardContent className="p-2">
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-full h-16 object-cover rounded mb-1"
                                />
                              )}
                              <p className="font-medium text-xs truncate">{item.name}</p>
                              <p className="text-primary font-semibold text-xs">{formatPrice(item.price)}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </details>
                  )}
                </div>

                <Separator />

                {/* Payment and Status */}
                <div className="space-y-4">
                  <PaymentMethodSelector
                    selectedMethod={selectedPaymentMethod}
                    onMethodChange={setSelectedPaymentMethod}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado del Pedido</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!canEdit}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="confirmed">Confirmado</SelectItem>
                            <SelectItem value="preparing">Preparando</SelectItem>
                            <SelectItem value="ready">Listo</SelectItem>
                            <SelectItem value="delivered">Entregado</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} disabled={!canEdit} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={saving || !canEdit}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
