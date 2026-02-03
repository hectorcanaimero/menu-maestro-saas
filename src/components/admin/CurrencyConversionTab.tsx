import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, RefreshCw, TrendingUp, Calendar } from 'lucide-react';
import { updateExchangeRates, getLatestExchangeRate } from '@/lib/bcv-fetcher';
import { Alert, AlertDescription } from '@/components/ui/alert';

const currencyConversionSchema = z.object({
  enable_currency_conversion: z.boolean(),
  use_manual_exchange_rate: z.boolean(),
  manual_usd_ves_rate: z.number().min(0).nullable(),
  manual_eur_ves_rate: z.number().min(0).nullable(),
  active_currency: z.enum(['original', 'VES']),
  hide_original_price: z.boolean(),
});

type CurrencyConversionForm = z.infer<typeof currencyConversionSchema>;

interface CurrencyConversionTabProps {
  storeId: string;
  initialData: {
    enable_currency_conversion: boolean | null;
    use_manual_exchange_rate: boolean | null;
    manual_usd_ves_rate: number | null;
    manual_eur_ves_rate: number | null;
    active_currency: string | null;
    hide_original_price: boolean | null;
  };
}

export function CurrencyConversionTab({ storeId, initialData }: CurrencyConversionTabProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bcvRates, setBcvRates] = useState<{
    usd?: { rate: number; lastUpdate: string };
    eur?: { rate: number; lastUpdate: string };
  }>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CurrencyConversionForm>({
    resolver: zodResolver(currencyConversionSchema),
    defaultValues: {
      enable_currency_conversion: initialData.enable_currency_conversion ?? false,
      use_manual_exchange_rate: initialData.use_manual_exchange_rate ?? false,
      manual_usd_ves_rate: initialData.manual_usd_ves_rate,
      manual_eur_ves_rate: initialData.manual_eur_ves_rate,
      active_currency: (initialData.active_currency as 'original' | 'VES') ?? 'original',
      hide_original_price: initialData.hide_original_price ?? false,
    },
  });

  const enableConversion = watch('enable_currency_conversion');
  const useManual = watch('use_manual_exchange_rate');
  const activeCurrency = watch('active_currency');
  const hideOriginalPrice = watch('hide_original_price');

  // Load BCV rates on mount
  useEffect(() => {
    loadBCVRates();
  }, [storeId]);

  // Sync with initialData changes
  useEffect(() => {
    setValue('enable_currency_conversion', initialData.enable_currency_conversion ?? false);
    setValue('use_manual_exchange_rate', initialData.use_manual_exchange_rate ?? false);
    setValue('manual_usd_ves_rate', initialData.manual_usd_ves_rate);
    setValue('manual_eur_ves_rate', initialData.manual_eur_ves_rate);
    setValue('hide_original_price', initialData.hide_original_price ?? false);
  }, [initialData, setValue]);

  async function loadBCVRates() {
    try {
      const [usdData, eurData] = await Promise.all([
        getLatestExchangeRate('USD', 'VES', storeId),
        getLatestExchangeRate('EUR', 'VES', storeId),
      ]);

      setBcvRates({
        usd: usdData ? { rate: usdData.rate, lastUpdate: usdData.lastUpdate } : undefined,
        eur: eurData ? { rate: eurData.rate, lastUpdate: eurData.lastUpdate } : undefined,
      });
    } catch (error) {
      //
    }
  }

  async function handleRefreshRates() {
    setIsRefreshing(true);
    try {
      const result = await updateExchangeRates(storeId);

      if (result.success) {
        toast.success('Tasas actualizadas desde el BCV', {
          description: `USD: ${result.usdRate?.toFixed(2)} | EUR: ${result.eurRate?.toFixed(2)}`,
        });
        await loadBCVRates();
      } else {
        toast.error('Error al actualizar tasas', {
          description: result.error || 'No se pudieron obtener las tasas del BCV',
        });
      }
    } catch (error) {
      toast.error('Error al actualizar tasas', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsRefreshing(false);
    }
  }

  async function onSubmit(data: CurrencyConversionForm) {
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          enable_currency_conversion: data.enable_currency_conversion,
          use_manual_exchange_rate: data.use_manual_exchange_rate,
          manual_usd_ves_rate: data.manual_usd_ves_rate,
          manual_eur_ves_rate: data.manual_eur_ves_rate,
          active_currency: data.active_currency,
          hide_original_price: data.hide_original_price,
        })
        .eq('id', storeId);

      if (error) throw error;

      toast.success('Configuración de conversión guardada');

      // Reload the page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error('Error al guardar configuración', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString('es-VE', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Main Toggle Card */}
      <Card>
        <CardHeader>
          <CardTitle>Conversión de Moneda</CardTitle>
          <CardDescription>Activa la conversión automática de precios en USD o EUR a bolívares (VES)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable_currency_conversion" className="text-base">
                Activar conversión a VES
              </Label>
              <p className="text-sm text-muted-foreground">
                Los precios se mostrarán en bolívares usando la tasa de cambio
              </p>
            </div>
            <Switch
              id="enable_currency_conversion"
              checked={enableConversion}
              onCheckedChange={(checked) => setValue('enable_currency_conversion', checked)}
            />
          </div>

          {enableConversion && (
            <>
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Los precios se mostrarán en ambas monedas: original (USD/EUR) arriba y VES abajo. Selecciona cuál usar
                  para el checkout.
                </AlertDescription>
              </Alert>

              <div className="border-t pt-4 space-y-4">
                <div>
                  <Label className="text-base">Moneda activa para checkout</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Selecciona qué moneda se usará para los cálculos de pedidos y pagos
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setValue('active_currency', 'original')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        activeCurrency === 'original'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">Moneda Original</div>
                      <div className="text-sm text-muted-foreground">USD o EUR</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('active_currency', 'VES')}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        activeCurrency === 'VES' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">Bolívares</div>
                      <div className="text-sm text-muted-foreground">VES</div>
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="hide_original_price" className="text-base">
                        Ocultar precio original (USD/EUR)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Solo muestra el precio en bolívares (VES) a los clientes, oculta el precio en USD/EUR
                      </p>
                    </div>
                    <Switch
                      id="hide_original_price"
                      checked={hideOriginalPrice}
                      onCheckedChange={(checked) => setValue('hide_original_price', checked)}
                    />
                  </div>

                  {hideOriginalPrice && (
                    <Alert className="mt-3">
                      <AlertDescription>
                        Los clientes solo verán el precio en bolívares (VES) en grande. El precio original no se mostrará.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* BCV Rates Card */}
      {enableConversion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tasas del BCV</CardTitle>
                <CardDescription>
                  Tasas oficiales del Banco Central de Venezuela • Actualización automática cada hora
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleRefreshRates} disabled={isRefreshing}>
                {isRefreshing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualizar tasas
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* USD → VES */}
              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">USD → VES</span>
                  {bcvRates.usd && <span className="text-2xl font-bold">{bcvRates.usd.rate.toFixed(2)}</span>}
                </div>
                {bcvRates.usd ? (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    {formatDate(bcvRates.usd.lastUpdate)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No disponible</p>
                )}
              </div>

              {/* EUR → VES */}
              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">EUR → VES</span>
                  {bcvRates.eur && <span className="text-2xl font-bold">{bcvRates.eur.rate.toFixed(2)}</span>}
                </div>
                {bcvRates.eur ? (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    {formatDate(bcvRates.eur.lastUpdate)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No disponible</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Rates Card */}
      {enableConversion && (
        <Card>
          <CardHeader>
            <CardTitle>Tasas Manuales</CardTitle>
            <CardDescription>Configura tus propias tasas de cambio (ignora las tasas del BCV)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="use_manual_exchange_rate" className="text-base">
                  Usar tasas manuales
                </Label>
                <p className="text-sm text-muted-foreground">
                  Sobrescribe las tasas automáticas del BCV con tus propios valores
                </p>
              </div>
              <Switch
                id="use_manual_exchange_rate"
                checked={useManual}
                onCheckedChange={(checked) => setValue('use_manual_exchange_rate', checked)}
              />
            </div>

            {useManual && (
              <div className="grid gap-4 md:grid-cols-2 pt-4">
                {/* USD Manual Rate */}
                <div className="space-y-2">
                  <Label htmlFor="manual_usd_ves_rate">Tasa USD → VES</Label>
                  <Input
                    id="manual_usd_ves_rate"
                    type="number"
                    step="0.01"
                    placeholder="Ej: 260.00"
                    {...register('manual_usd_ves_rate', { valueAsNumber: true })}
                  />
                  {errors.manual_usd_ves_rate && (
                    <p className="text-sm text-destructive">{errors.manual_usd_ves_rate.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Valor actual: {bcvRates.usd ? bcvRates.usd.rate.toFixed(2) : 'N/A'}
                  </p>
                </div>

                {/* EUR Manual Rate */}
                <div className="space-y-2">
                  <Label htmlFor="manual_eur_ves_rate">Tasa EUR → VES</Label>
                  <Input
                    id="manual_eur_ves_rate"
                    type="number"
                    step="0.01"
                    placeholder="Ej: 310.00"
                    {...register('manual_eur_ves_rate', { valueAsNumber: true })}
                  />
                  {errors.manual_eur_ves_rate && (
                    <p className="text-sm text-destructive">{errors.manual_eur_ves_rate.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Valor actual: {bcvRates.eur ? bcvRates.eur.rate.toFixed(2) : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar configuración'
          )}
        </Button>
      </div>
    </form>
  );
}
