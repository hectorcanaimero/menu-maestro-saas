import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { BusinessHoursTab } from '@/components/admin/BusinessHoursTab';
import { PaymentSettingsTab } from '@/components/admin/PaymentSettingsTab';
import { CurrencyConversionTab } from '@/components/admin/CurrencyConversionTab';
import { OrderSettingsTab } from '@/components/admin/OrderSettingsTab';
import { DeliverySettingsTab } from '@/components/admin/DeliverySettingsTab';
import { AdvancedSettingsTab } from '@/components/admin/AdvancedSettingsTab';
import { DesignSettingsTab } from '@/components/admin/DesignSettingsTab';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const CURRENCIES = [
  { value: 'USD', label: 'Dólar Estadounidense (USD)' },
  { value: 'VES', label: 'Bolívar Venezolano (VES)' },
  { value: 'BRL', label: 'Real Brasileño (BRL)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'COP', label: 'Peso Colombiano (COP)' },
  { value: 'ARS', label: 'Peso Argentino (ARS)' },
  { value: 'MXN', label: 'Peso Mexicano (MXN)' },
];

const storeSettingsSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  phone: z
    .string()
    .trim()
    .regex(/^\+(?:58|55)\d{10,11}$/, 'Formato: +58 (Venezuela) o +55 (Brasil) seguido de 10-11 dígitos'),
  email: z.string().trim().email('Email inválido').max(255),
  currency: z.enum(['USD', 'VES', 'BRL', 'EUR', 'COP', 'ARS', 'MXN']).optional(),
  operating_modes: z
    .array(z.enum(['delivery', 'pickup', 'digital_menu']))
    .min(1, 'Selecciona al menos un modo de funcionamiento'),
  is_food_business: z.boolean().optional(),
  catalog_mode: z.boolean().optional(),
});

type StoreSettingsForm = z.infer<typeof storeSettingsSchema>;

const StoreSettings = () => {
  const navigate = useNavigate();
  const { store } = useStore();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
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
      is_food_business: true,
      catalog_mode: false,
    },
  });

  const operatingModes = watch('operating_modes');

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (store) {
      setValue('name', store.name);
      setValue('phone', store.phone || '');
      setValue('email', store.email || '');
      setValue('currency', (store as any).currency || 'USD');
      setValue('operating_modes', store.operating_modes || ['delivery']);
      setValue('is_food_business', (store as any).is_food_business ?? true);
      setValue('catalog_mode', (store as any).catalog_mode ?? false);
    }
  }, [store, setValue]);

  const onSubmit = async (data: StoreSettingsForm) => {
    if (!store) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: data.name,
          phone: data.phone,
          email: data.email,
          currency: data.currency,
          operating_modes: data.operating_modes,
          is_food_business: data.is_food_business,
          catalog_mode: data.catalog_mode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', store.id);

      if (error) throw error;

      toast.success('Configuración guardada correctamente');
      window.location.reload();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user || !store) {
    return (
      <AdminLayout userEmail="">
        {/* <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div> */}
        <div className="space-y-6">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout userEmail={user.email}>
      <div className="space-y-4 md:space-y-6">
        <div className="pb-2 border-b md:border-0">
          <h1 className="text-2xl md:text-3xl font-bold">Configuración de Tienda</h1>
        </div>
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="inline-flex w-full overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-lg bg-muted p-1 text-muted-foreground md:grid md:grid-cols-7 scrollbar-hide">
            <TabsTrigger value="company" className="min-w-[100px] md:min-w-0">
              Empresa
            </TabsTrigger>
            <TabsTrigger value="design" className="min-w-[100px] md:min-w-0">
              Diseño
            </TabsTrigger>
            <TabsTrigger value="delivery" className="min-w-[100px] md:min-w-0">
              Entrega
            </TabsTrigger>
            <TabsTrigger value="hours" className="min-w-[100px] md:min-w-0">
              Horario
            </TabsTrigger>
            <TabsTrigger value="order" className="min-w-[100px] md:min-w-0">
              Orden
            </TabsTrigger>
            <TabsTrigger value="payment" className="min-w-[100px] md:min-w-0">
              Pago
            </TabsTrigger>
            <TabsTrigger value="conversion" className="min-w-[100px] md:min-w-0">
              Conversión
            </TabsTrigger>
            <TabsTrigger value="advanced" className="min-w-[100px] md:min-w-0">
              Avanzado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="mt-4 md:mt-6">
            <Card className="border-0 shadow-none md:border md:shadow-sm">
              <CardHeader className="px-4 md:px-6">
                <CardTitle className="text-xl md:text-2xl">Información de la Empresa</CardTitle>
                <CardDescription className="text-sm">
                  En esta sección puede configurar todos los ajustes de la empresa.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm md:text-base">
                      Nombre de la empresa
                    </Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Mi Restaurante"
                      className="h-11 md:h-10 text-base md:text-sm"
                    />
                    <p className="text-xs md:text-sm text-muted-foreground">
                      El nombre de la empresa se puede usar en mensajes personalizados u otras partes del sitio.
                    </p>
                    {errors.name && <p className="text-xs md:text-sm text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm md:text-base">
                      WhatsApp
                    </Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="+5511999999999"
                      type="tel"
                      className="h-11 md:h-10 text-base md:text-sm"
                    />
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Este teléfono se puede utilizar en mensajes personalizados u otras partes del sitio. Formato: +58
                      (Venezuela) o +55 (Brasil).
                    </p>
                    {errors.phone && <p className="text-xs md:text-sm text-destructive">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm md:text-base">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="contacto@mirestaurante.com"
                      className="h-11 md:h-10 text-base md:text-sm"
                    />
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Este correo electrónico se puede utilizar en mensajes personalizados u otras partes del sitio.
                    </p>
                    {errors.email && <p className="text-xs md:text-sm text-destructive">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm md:text-base">
                      Moneda
                    </Label>
                    <Select value={watch('currency')} onValueChange={(value) => setValue('currency', value as any)}>
                      <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
                        <SelectValue placeholder="Selecciona una moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Moneda utilizada para mostrar los precios en tu tienda.
                    </p>
                    {errors.currency && (
                      <p className="text-xs md:text-sm text-destructive">{errors.currency.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm md:text-base">Modo de funcionamiento</Label>
                    <div className="space-y-3 md:space-y-2">
                      {[
                        { value: 'delivery', label: 'Delivery' },
                        { value: 'pickup', label: 'Entrega en tienda' },
                        // { value: 'digital_menu', label: 'Menú Digital' },
                      ].map((mode) => (
                        <div key={mode.value} className="flex items-center space-x-3 py-1">
                          <Checkbox
                            id={mode.value}
                            checked={operatingModes?.includes(mode.value as any)}
                            onCheckedChange={(checked) => {
                              const current = operatingModes || [];
                              if (checked) {
                                setValue('operating_modes', [...current, mode.value as any]);
                              } else {
                                setValue(
                                  'operating_modes',
                                  current.filter((m) => m !== mode.value),
                                );
                              }
                            }}
                            className="h-5 w-5 md:h-4 md:w-4"
                          />
                          <label
                            htmlFor={mode.value}
                            className="text-sm md:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {mode.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Selecciona los modos en que funciona tu negocio (puedes seleccionar varios).
                    </p>
                    {errors.operating_modes && (
                      <p className="text-xs md:text-sm text-destructive">{errors.operating_modes.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="is_food_business" className="text-sm md:text-base">
                      Tipo de Empresa
                    </Label>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Negocio de Comida</p>
                        <p className="text-xs text-muted-foreground">
                          Activa esta opción si tu negocio es de comida. Esto mostrará características específicas como el menú de cocina.
                        </p>
                      </div>
                      <Switch
                        id="is_food_business"
                        checked={watch('is_food_business') ?? true}
                        onCheckedChange={(checked) => setValue('is_food_business', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="catalog_mode" className="text-sm md:text-base">
                      Modo Catálogo
                    </Label>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Solo Visualización de Productos</p>
                        <p className="text-xs text-muted-foreground">
                          Muestra tus productos como catálogo sin funcionalidad de compra. Incluye botón de WhatsApp para consultas. Gratuito con límite de visitas mensuales.
                        </p>
                      </div>
                      <Switch
                        id="catalog_mode"
                        checked={watch('catalog_mode') ?? false}
                        onCheckedChange={(checked) => setValue('catalog_mode', checked)}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full md:w-auto h-11 md:h-10 text-base md:text-sm"
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Guardar cambios
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="design" className="mt-4 md:mt-6">
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

          <TabsContent value="hours" className="mt-4 md:mt-6">
            <BusinessHoursTab storeId={store.id} forceStatus={store.force_status} />
          </TabsContent>

          <TabsContent value="payment" className="mt-4 md:mt-6">
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

          <TabsContent value="conversion" className="mt-4 md:mt-6">
            <CurrencyConversionTab
              storeId={store.id}
              initialData={{
                enable_currency_conversion: store.enable_currency_conversion,
                use_manual_exchange_rate: store.use_manual_exchange_rate,
                manual_usd_ves_rate: store.manual_usd_ves_rate,
                manual_eur_ves_rate: store.manual_eur_ves_rate,
                active_currency: store.active_currency,
              }}
            />
          </TabsContent>

          <TabsContent value="order" className="mt-4 md:mt-6">
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

          <TabsContent value="delivery" className="mt-4 md:mt-6">
            <DeliverySettingsTab
              storeId={store.id}
              initialData={{
                estimated_delivery_time: store.estimated_delivery_time,
                skip_payment_digital_menu: store.skip_payment_digital_menu,
                delivery_price_mode: (store.delivery_price_mode as 'fixed' | 'by_zone') || 'fixed',
                fixed_delivery_price: store.fixed_delivery_price,
              }}
            />
          </TabsContent>

          <TabsContent value="advanced" className="mt-4 md:mt-6">
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
