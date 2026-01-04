import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';

const designSettingsSchema = z.object({
  primary_color: z.string().optional(),
  price_color: z.string().optional(),
  delivery_label: z.string().min(1, 'Requerido').optional(),
  pickup_label: z.string().min(1, 'Requerido').optional(),
  digital_menu_label: z.string().min(1, 'Requerido').optional(),
});

type DesignSettingsForm = z.infer<typeof designSettingsSchema>;

interface DesignSettingsTabProps {
  storeId: string;
  initialData: {
    logo_url?: string | null;
    banner_url?: string | null;
    primary_color?: string | null;
    price_color?: string | null;
    delivery_label?: string | null;
    pickup_label?: string | null;
    digital_menu_label?: string | null;
  };
}

export const DesignSettingsTab = ({ storeId, initialData }: DesignSettingsTabProps) => {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initialData.logo_url || '');
  const [bannerUrl, setBannerUrl] = useState(initialData.banner_url || '');

  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
    setValue,
  } = useForm<DesignSettingsForm>({
    resolver: zodResolver(designSettingsSchema),
    defaultValues: {
      primary_color: initialData.primary_color || '#000000',
      price_color: initialData.price_color || '#000000',
      delivery_label: initialData.delivery_label || 'Delivery',
      pickup_label: initialData.pickup_label || 'Pick-up',
      digital_menu_label: initialData.digital_menu_label || 'Mesa',
    },
  });

  // Watch color values for synchronization
  const primaryColor = watch('primary_color');
  const priceColor = watch('price_color');

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${storeId}-logo-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to menu-images bucket
      const { error: uploadError, data } = await supabase.storage.from('menu-images').upload(filePath, file, {
        upsert: true,
      });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('menu-images').getPublicUrl(filePath);

      // Update store with logo URL
      const { error: updateError } = await supabase.from('stores').update({ logo_url: publicUrl }).eq('id', storeId);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      toast.success('Logo subido correctamente');
    } catch (error: unknown) {
      toast.error('Error al subir el logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const { error } = await supabase.from('stores').update({ logo_url: null }).eq('id', storeId);

      if (error) throw error;

      setLogoUrl('');
      toast.success('Logo eliminado correctamente');
    } catch (error: unknown) {
      toast.error('Error al eliminar el logo');
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 5MB for banner)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    setUploadingBanner(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${storeId}-banner-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to menu-images bucket
      const { error: uploadError, data } = await supabase.storage.from('menu-images').upload(filePath, file, {
        upsert: true,
      });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('menu-images').getPublicUrl(filePath);

      // Update store with banner URL
      const { error: updateError } = await supabase.from('stores').update({ banner_url: publicUrl }).eq('id', storeId);

      if (updateError) throw updateError;

      setBannerUrl(publicUrl);
      toast.success('Banner subido correctamente');
    } catch (error: unknown) {
      toast.error('Error al subir el banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleRemoveBanner = async () => {
    try {
      const { error } = await supabase.from('stores').update({ banner_url: null }).eq('id', storeId);

      if (error) throw error;

      setBannerUrl('');
      toast.success('Banner eliminado correctamente');
    } catch (error: unknown) {
      toast.error('Error al eliminar el banner');
    }
  };

  const onSubmit = async (data: DesignSettingsForm) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          primary_color: data.primary_color,
          price_color: data.price_color,
          delivery_label: data.delivery_label || 'Delivery',
          pickup_label: data.pickup_label || 'Pick-up',
          digital_menu_label: data.digital_menu_label || 'Mesa',
          updated_at: new Date().toISOString(),
        })
        .eq('id', storeId);

      if (error) throw error;

      toast.success('Configuración de diseño guardada correctamente');
      window.location.reload();
    } catch (error: unknown) {
      toast.error('Error al guardar la configuración de diseño');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-0 shadow-none md:border md:shadow-sm">
      <CardHeader className="px-4 md:px-6">
        <CardTitle className="text-xl md:text-2xl">Diseño</CardTitle>
        <CardDescription className="text-sm">
          En esta sección puede configurar algunas opciones de diseño.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="text-sm md:text-base">Logo</Label>
            {logoUrl ? (
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img src={logoUrl} alt="Logo" className="w-32 h-32 object-contain border rounded-lg" />
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
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{uploading ? 'Subiendo...' : 'Subir logo'}</span>
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
            <p className="text-xs md:text-sm text-muted-foreground">
              Sube el logo de tu negocio (máximo 2MB, formato JPG, PNG o WEBP)
            </p>
          </div>

          {/* Banner Upload */}
          {/* <div className="space-y-2 border-t pt-4 md:pt-6">
            <Label className="text-sm md:text-base">Banner / Imagen de Portada</Label>
            {bannerUrl ? (
              <div className="flex items-start gap-4">
                <div className="relative w-full max-w-2xl">
                  <img
                    src={bannerUrl}
                    alt="Banner"
                    className="w-full h-48 object-cover border rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveBanner}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Label
                  htmlFor="banner-upload"
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                >
                  {uploadingBanner ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{uploadingBanner ? "Subiendo..." : "Subir banner"}</span>
                </Label>
                <Input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerUpload}
                  disabled={uploadingBanner}
                />
              </div>
            )}
            <p className="text-xs md:text-sm text-muted-foreground">
              Sube una imagen de portada para tu catálogo (máximo 5MB, formato JPG, PNG o WEBP). Recomendado: 1920x600px
            </p>
          </div> */}

          <div className="border-t pt-4 md:pt-6">
            <h3 className="text-base md:text-lg font-medium mb-4">Opciones de diseño</h3>

            {/* Primary Color */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="primary_color" className="text-sm md:text-base">
                Color principal
              </Label>
              <div className="flex items-center gap-2 md:gap-4">
                <Input
                  id="primary_color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setValue('primary_color', e.target.value, { shouldValidate: true })}
                  className="w-16 h-11 md:w-20 md:h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setValue('primary_color', e.target.value, { shouldValidate: true })}
                  placeholder="#000000"
                  className="flex-1 h-11 md:h-10 text-base md:text-sm"
                />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">Define el color principal de tu tienda</p>
              {errors.primary_color && (
                <p className="text-xs md:text-sm text-destructive">{errors.primary_color.message}</p>
              )}
            </div>

            {/* Price Color */}
            <div className="space-y-2">
              <Label htmlFor="price_color" className="text-sm md:text-base">
                Color del precio
              </Label>
              <div className="flex items-center gap-2 md:gap-4">
                <Input
                  id="price_color"
                  type="color"
                  value={priceColor}
                  onChange={(e) => setValue('price_color', e.target.value, { shouldValidate: true })}
                  className="w-16 h-11 md:w-20 md:h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={priceColor}
                  onChange={(e) => setValue('price_color', e.target.value, { shouldValidate: true })}
                  placeholder="#000000"
                  className="flex-1 h-11 md:h-10 text-base md:text-sm"
                />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">Define el color de los precios en tu catálogo</p>
              {errors.price_color && (
                <p className="text-xs md:text-sm text-destructive">{errors.price_color.message}</p>
              )}
            </div>
          </div>

          {/* Custom Labels Section */}
          <div className="border-t pt-4 md:pt-6 space-y-4">
            <div>
              <h3 className="text-base md:text-lg font-medium mb-2">Etiquetas Personalizadas</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-4">
                Personaliza los nombres de los tipos de pedido que se mostrarán en toda la plataforma
              </p>
            </div>

            {/* Delivery Label */}
            <div className="space-y-2">
              <Label htmlFor="delivery_label" className="text-sm md:text-base">
                Etiqueta para "Delivery"
              </Label>
              <Input
                id="delivery_label"
                {...register('delivery_label')}
                placeholder="Delivery"
                className="h-11 md:h-10 text-base md:text-sm"
              />
              <p className="text-xs md:text-sm text-muted-foreground">
                Por ejemplo: "Domicilio", "Envío a casa", etc. (Valor por defecto: "Delivery")
              </p>
              {errors.delivery_label && (
                <p className="text-xs md:text-sm text-destructive">{errors.delivery_label.message}</p>
              )}
            </div>

            {/* Pickup Label */}
            <div className="space-y-2">
              <Label htmlFor="pickup_label" className="text-sm md:text-base">
                Etiqueta para "Pick-up"
              </Label>
              <Input
                id="pickup_label"
                {...register('pickup_label')}
                placeholder="Pick-up"
                className="h-11 md:h-10 text-base md:text-sm"
              />
              <p className="text-xs md:text-sm text-muted-foreground">
                Por ejemplo: "Retirar en tienda", "Para llevar", etc. (Valor por defecto: "Pick-up")
              </p>
              {errors.pickup_label && (
                <p className="text-xs md:text-sm text-destructive">{errors.pickup_label.message}</p>
              )}
            </div>

            {/* Digital Menu Label */}
            <div className="space-y-2">
              <Label htmlFor="digital_menu_label" className="text-sm md:text-base">
                Etiqueta para "Mesa" (Menú Digital)
              </Label>
              <Input
                id="digital_menu_label"
                {...register('digital_menu_label')}
                placeholder="Mesa"
                className="h-11 md:h-10 text-base md:text-sm"
              />
              <p className="text-xs md:text-sm text-muted-foreground">
                Por ejemplo: "Consumir aquí", "En el local", etc. (Valor por defecto: "Mesa")
              </p>
              {errors.digital_menu_label && (
                <p className="text-xs md:text-sm text-destructive">{errors.digital_menu_label.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full md:w-auto h-11 md:h-10 text-base md:text-sm">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar cambios
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
