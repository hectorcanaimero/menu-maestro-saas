import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

const designSettingsSchema = z.object({
  primary_color: z.string().optional(),
  price_color: z.string().optional(),
});

type DesignSettingsForm = z.infer<typeof designSettingsSchema>;

interface DesignSettingsTabProps {
  storeId: string;
  initialData: {
    logo_url?: string | null;
    primary_color?: string | null;
    price_color?: string | null;
  };
}

export const DesignSettingsTab = ({ storeId, initialData }: DesignSettingsTabProps) => {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initialData.logo_url || "");
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DesignSettingsForm>({
    resolver: zodResolver(designSettingsSchema),
    defaultValues: {
      primary_color: initialData.primary_color || "#000000",
      price_color: initialData.price_color || "#000000",
    },
  });

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona una imagen válida");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${storeId}-logo-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to menu-images bucket
      const { error: uploadError, data } = await supabase.storage
        .from("menu-images")
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("menu-images")
        .getPublicUrl(filePath);

      // Update store with logo URL
      const { error: updateError } = await supabase
        .from("stores")
        .update({ logo_url: publicUrl })
        .eq("id", storeId);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      toast.success("Logo subido correctamente");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error("Error al subir el logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const { error } = await supabase
        .from("stores")
        .update({ logo_url: null })
        .eq("id", storeId);

      if (error) throw error;

      setLogoUrl("");
      toast.success("Logo eliminado correctamente");
    } catch (error: any) {
      console.error("Error removing logo:", error);
      toast.error("Error al eliminar el logo");
    }
  };

  const onSubmit = async (data: DesignSettingsForm) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("stores")
        .update({
          // Store colors as custom fields - we'll need to add these to the schema
          updated_at: new Date().toISOString(),
        })
        .eq("id", storeId);

      if (error) throw error;

      // For now, store colors in localStorage until we add them to the database
      if (data.primary_color) {
        localStorage.setItem(`store-${storeId}-primary-color`, data.primary_color);
      }
      if (data.price_color) {
        localStorage.setItem(`store-${storeId}-price-color`, data.price_color);
      }

      toast.success("Configuración de diseño guardada correctamente");
    } catch (error: any) {
      console.error("Error saving design settings:", error);
      toast.error("Error al guardar la configuración de diseño");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diseño</CardTitle>
        <CardDescription>
          En esta sección puede configurar algunas opciones de diseño.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo</Label>
            {logoUrl ? (
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-32 h-32 object-contain border rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2"
                    onClick={handleRemoveLogo}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Label
                  htmlFor="logo-upload"
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{uploading ? "Subiendo..." : "Subir logo"}</span>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Sube el logo de tu negocio (máximo 2MB, formato JPG, PNG o WEBP)
            </p>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Opciones de diseño</h3>
            
            {/* Primary Color */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="primary_color">Color principal</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="primary_color"
                  type="color"
                  {...register("primary_color")}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  {...register("primary_color")}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Define el color principal de tu tienda
              </p>
              {errors.primary_color && (
                <p className="text-sm text-destructive">{errors.primary_color.message}</p>
              )}
            </div>

            {/* Price Color */}
            <div className="space-y-2">
              <Label htmlFor="price_color">Color del precio</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="price_color"
                  type="color"
                  {...register("price_color")}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  {...register("price_color")}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Define el color de los precios en tu catálogo
              </p>
              {errors.price_color && (
                <p className="text-sm text-destructive">{errors.price_color.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar cambios
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
