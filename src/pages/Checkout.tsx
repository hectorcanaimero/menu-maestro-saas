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

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { store } = useStore();
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState<"brazil" | "venezuela">("brazil");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    delivery_address: "",
    notes: "",
  });

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
            delivery_address: formData.delivery_address,
            notes: formData.notes,
            payment_proof_url: paymentProofUrl,
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

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

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
                <div key={item.id} className="flex justify-between items-start pb-4 border-b">
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
                  <p className="font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
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