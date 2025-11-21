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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const storeSettingsSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  phone: z.string()
    .trim()
    .regex(/^\+(?:58|55)\d{10,11}$/, "Formato: +58 (Venezuela) o +55 (Brasil) seguido de 10-11 dígitos"),
  email: z.string().trim().email("Email inválido").max(255),
  operating_mode: z.enum(["delivery", "pickup", "digital_menu"], {
    errorMap: () => ({ message: "Selecciona un modo de funcionamiento" }),
  }),
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
  });

  const operatingMode = watch("operating_mode");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
      setValue("operating_mode", (store.operating_mode as any) || "delivery");
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
          operating_mode: data.operating_mode,
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

  if (loading || !user) {
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
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Configuración de Tienda</h1>

        <Tabs defaultValue="company" className="w-full">
          <TabsList className="grid w-full grid-cols-1 max-w-md">
            <TabsTrigger value="company">Empresa</TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Empresa</CardTitle>
                <CardDescription>
                  En esta sección puede configurar todos los ajustes de la empresa.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre de la empresa</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Mi Restaurante"
                    />
                    <p className="text-sm text-muted-foreground">
                      El nombre de la empresa se puede usar en mensajes personalizados u otras partes del sitio.
                    </p>
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">WhatsApp</Label>
                    <Input
                      id="phone"
                      {...register("phone")}
                      placeholder="+5511999999999"
                    />
                    <p className="text-sm text-muted-foreground">
                      Este teléfono se puede utilizar en mensajes personalizados u otras partes del sitio. Formato: +58 (Venezuela) o +55 (Brasil).
                    </p>
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="contacto@mirestaurante.com"
                    />
                    <p className="text-sm text-muted-foreground">
                      Este correo electrónico se puede utilizar en mensajes personalizados u otras partes del sitio.
                    </p>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="operating_mode">Modo de funcionamiento</Label>
                    <Select
                      value={operatingMode}
                      onValueChange={(value) => setValue("operating_mode", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un modo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="pickup">Entrega en tienda</SelectItem>
                        <SelectItem value="digital_menu">Menú Digital</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Selecciona cómo funciona tu negocio.
                    </p>
                    {errors.operating_mode && (
                      <p className="text-sm text-destructive">{errors.operating_mode.message}</p>
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
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default StoreSettings;
