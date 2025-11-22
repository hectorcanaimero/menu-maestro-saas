import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BusinessHoursTab } from "@/components/admin/BusinessHoursTab";
import { PaymentSettingsTab } from "@/components/admin/PaymentSettingsTab";
import { OrderSettingsTab } from "@/components/admin/OrderSettingsTab";
import { DeliverySettingsTab } from "@/components/admin/DeliverySettingsTab";
import { AdvancedSettingsTab } from "@/components/admin/AdvancedSettingsTab";
import { DesignSettingsTab } from "@/components/admin/DesignSettingsTab";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const storeSettingsSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  phone: z
    .string()
    .trim()
    .regex(/^\+(?:58|55)\d{10,11}$/, "Formato: +58 (Venezuela) o +55 (Brasil) seguido de 10-11 dígitos"),
  email: z.string().trim().email("Email inválido").max(255),
  operating_modes: z
    .array(z.enum(["delivery", "pickup", "digital_menu"]))
    .min(1, "Selecciona al menos un modo de funcionamiento"),
});

type StoreSettingsForm = z.infer<typeof storeSettingsSchema>;

const StoreSettings = () => {
  const navigate = useNavigate();
  const { store } = useStore();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StoreSettingsForm>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      operating_modes: [],
    },
  });

  const operatingModes = watch("operating_modes");

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (store) {
      setValue("name", store.name);
      setValue("phone", store.phone || "");
      setValue("email", store.email || "");
      setValue("operating_modes", store.operating_modes || ["delivery"]);
    }
  }, [store, setValue]);

  const onSubmit = async (data: StoreSettingsForm) => {
    if (!store) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("stores")
        .update({
          name: data.name,
          phone: data.phone,
          email: data.email,
          operating_modes: data.operating_modes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", store.id);

      if (error) throw error;

      toast.success("Configuración guardada correctamente");
      window.location.reload();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user || !store) {
    return (
      <AdminLayout userEmail="">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout userEmail={user.email || ""}>
      <div>
        <h1 className="text-3xl font-bold mb-6">Configuración de Tienda</h1>

        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="design">Diseño</TabsTrigger>
            <TabsTrigger value="delivery">Entrega</TabsTrigger>
            <TabsTrigger value="hours">Horario</TabsTrigger>
            <TabsTrigger value="order">Orden</TabsTrigger>
            <TabsTrigger value="payment">Pago</TabsTrigger>
            <TabsTrigger value="advanced">Avanzado</TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Empresa</CardTitle>
                <CardDescription>En esta sección puede configurar todos los ajustes de la empresa.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre de la empresa</Label>
                    <Input id="name" {...register("name")} placeholder="Mi Restaurante" />
                    <p className="text-sm text-muted-foreground">
                      El nombre de la empresa se puede usar en mensajes personalizados u otras partes del sitio.
                    </p>
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">WhatsApp</Label>
                    <Input id="phone" {...register("phone")} placeholder="+5511999999999" />
                    <p className="text-sm text-muted-foreground">
                      Este teléfono se puede utilizar en mensajes personalizados u otras partes del sitio. Formato: +58
                      (Venezuela) o +55 (Brasil).
                    </p>
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register("email")} placeholder="contacto@mirestaurante.com" />
                    <p className="text-sm text-muted-foreground">
                      Este correo electrónico se puede utilizar en mensajes personalizados u otras partes del sitio.
                    </p>
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Modo de funcionamiento</Label>
                    <div className="space-y-3">
                      {[
                        { value: "delivery", label: "Delivery" },
                        { value: "pickup", label: "Entrega en tienda" },
                        { value: "digital_menu", label: "Menú Digital" },
                      ].map((mode) => (
                        <div key={mode.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={mode.value}
                            checked={operatingModes?.includes(mode.value as any)}
                            onCheckedChange={(checked) => {
                              const current = operatingModes || [];
                              if (checked) {
                                setValue("operating_modes", [...current, mode.value as any]);
                              } else {
                                setValue(
                                  "operating_modes",
                                  current.filter((m) => m !== mode.value),
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={mode.value}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {mode.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Selecciona los modos en que funciona tu negocio (puedes seleccionar varios).
                    </p>
                    {errors.operating_modes && (
                      <p className="text-sm text-destructive">{errors.operating_modes.message}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Guardar cambios
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="design" className="mt-6">
            <DesignSettingsTab
              storeId={store.id}
              initialData={{
                logo_url: store.logo_url,
                banner_url: (store as any).banner_url,
                primary_color: (store as any).primary_color,
                price_color: (store as any).price_color,
              }}
            />
          </TabsContent>

          <TabsContent value="hours" className="mt-6">
            <BusinessHoursTab storeId={store.id} forceStatus={store.force_status} />
          </TabsContent>

          <TabsContent value="payment" className="mt-6">
            <PaymentSettingsTab
              storeId={store.id}
              initialData={{
                currency: store.currency,
                decimal_places: store.decimal_places,
                decimal_separator: store.decimal_separator,
                thousands_separator: store.thousands_separator,
                accept_cash: store.accept_cash,
                require_payment_proof: store.require_payment_proof,
              }}
            />
          </TabsContent>

          <TabsContent value="order" className="mt-6">
            <OrderSettingsTab
              storeId={store.id}
              initialData={{
                minimum_order_price: store.minimum_order_price,
                redirect_to_whatsapp: store.redirect_to_whatsapp,
                order_product_template: store.order_product_template,
                order_message_template_delivery: store.order_message_template_delivery,
                order_message_template_pickup: store.order_message_template_pickup,
                order_message_template_digital_menu: store.order_message_template_digital_menu,
              }}
            />
          </TabsContent>

          <TabsContent value="delivery" className="mt-6">
            <DeliverySettingsTab
              storeId={store.id}
              initialData={{
                estimated_delivery_time: store.estimated_delivery_time,
                skip_payment_digital_menu: store.skip_payment_digital_menu,
                delivery_price_mode: (store.delivery_price_mode as "fixed" | "by_zone") || "fixed",
                fixed_delivery_price: store.fixed_delivery_price,
              }}
            />
          </TabsContent>

          <TabsContent value="advanced" className="mt-6">
            <AdvancedSettingsTab
              storeId={store.id}
              initialData={{
                remove_zipcode: store.remove_zipcode,
                remove_address_number: store.remove_address_number,
                enable_audio_notifications: store.enable_audio_notifications,
                notification_volume: store.notification_volume,
                notification_repeat_count: store.notification_repeat_count,
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default StoreSettings;
