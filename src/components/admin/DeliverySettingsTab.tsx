import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, AlertTriangle, Clock, Gift, Settings } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ZoneFreeDeliveryDialog } from './ZoneFreeDeliveryDialog';

const deliverySchema = z
  .object({
    estimated_delivery_time: z
      .string()
      .optional()
      .transform((val) => val?.trim() || ''),
    skip_payment_digital_menu: z.boolean().default(false),
    delivery_price_mode: z.enum(['fixed', 'by_zone']).default('fixed'),
    fixed_delivery_price: z.number().min(0).default(0),
    free_delivery_enabled: z.boolean().default(false),
    global_free_delivery_min_amount: z.union([z.number().min(0.01), z.null()]).optional(),
  })
  .refine(
    (data) => {
      // If free delivery is enabled, require a minimum amount greater than 0
      if (data.free_delivery_enabled && (data.global_free_delivery_min_amount === null || data.global_free_delivery_min_amount === undefined || data.global_free_delivery_min_amount <= 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Debes especificar el monto mínimo para delivery gratis',
      path: ['global_free_delivery_min_amount'],
    },
  );

type DeliveryFormData = z.infer<typeof deliverySchema>;

interface DeliveryZone {
  id: string;
  zone_name: string;
  delivery_price: number;
  display_order: number | null;
  free_delivery_enabled: boolean;
  free_delivery_min_amount: number | null;
}

interface DeliverySettingsTabProps {
  storeId: string;
  initialData?: Partial<DeliveryFormData>;
}

const COMMON_DELIVERY_TIMES = ['15-30 min', '30-45 min', '45-60 min', '1-2 horas'];

export const DeliverySettingsTab = ({ storeId, initialData }: DeliverySettingsTabProps) => {
  // All hooks must be called unconditionally at the top level
  const { reloadStore } = useStore();
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [newZone, setNewZone] = useState({ zone_name: '', delivery_price: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<{ id: string; name: string } | null>(null);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [showTimeSuggestions, setShowTimeSuggestions] = useState(false);
  const [freeDeliveryDialogOpen, setFreeDeliveryDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      estimated_delivery_time: initialData?.estimated_delivery_time || '',
      skip_payment_digital_menu: initialData?.skip_payment_digital_menu || false,
      delivery_price_mode: (initialData?.delivery_price_mode as 'fixed' | 'by_zone') || 'fixed',
      fixed_delivery_price: initialData?.fixed_delivery_price || 0,
      free_delivery_enabled: initialData?.free_delivery_enabled || false,
      global_free_delivery_min_amount: initialData?.global_free_delivery_min_amount ?? null,
    },
  });

  const deliveryPriceMode = watch('delivery_price_mode');
  const freeDeliveryEnabled = watch('free_delivery_enabled');

  // Update form values when initialData changes (when store data loads)
  useEffect(() => {
    if (initialData) {
      setValue('estimated_delivery_time', initialData.estimated_delivery_time || '');
      setValue('skip_payment_digital_menu', initialData.skip_payment_digital_menu || false);
      setValue('delivery_price_mode', (initialData.delivery_price_mode as 'fixed' | 'by_zone') || 'fixed');
      setValue('fixed_delivery_price', initialData.fixed_delivery_price || 0);
      setValue('free_delivery_enabled', initialData.free_delivery_enabled ?? false);
      setValue('global_free_delivery_min_amount', initialData.global_free_delivery_min_amount ?? null);
    }
  }, [initialData, setValue]);

  useEffect(() => {
    if (deliveryPriceMode === 'by_zone') {
      fetchZones();
    }
  }, [deliveryPriceMode]);

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('store_id', storeId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      toast.error('Error al cargar zonas de entrega');
    }
  };

  const onSubmit = async (data: DeliveryFormData) => {
    setLoading(true);
    try {
      const updateData = {
        estimated_delivery_time: data.estimated_delivery_time || null,
        skip_payment_digital_menu: data.skip_payment_digital_menu,
        delivery_price_mode: data.delivery_price_mode,
        fixed_delivery_price: data.fixed_delivery_price,
        free_delivery_enabled: data.free_delivery_enabled,
        global_free_delivery_min_amount: data.global_free_delivery_min_amount,
      };

      const { error } = await supabase
        .from('stores')
        .update(updateData)
        .eq('id', storeId);

      if (error) throw error;

      // Reload store context to get fresh data
      await reloadStore();

      toast.success('Configuración de entrega actualizada');
    } catch (error) {
      console.error('Error saving delivery settings:', error);
      toast.error('Error al actualizar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = async () => {
    const trimmedZoneName = newZone.zone_name.trim();

    if (!trimmedZoneName || !newZone.delivery_price) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    // Check for duplicate zone names (case-insensitive)
    const isDuplicate = zones.some((zone) => zone.zone_name.toLowerCase() === trimmedZoneName.toLowerCase());

    if (isDuplicate) {
      toast.error(`La zona "${trimmedZoneName}" ya existe. Por favor usa un nombre diferente.`);
      return;
    }

    try {
      const { error } = await supabase.from('delivery_zones').insert([
        {
          store_id: storeId,
          zone_name: trimmedZoneName,
          delivery_price: parseFloat(newZone.delivery_price),
          display_order: zones.length,
        },
      ]);

      if (error) throw error;
      toast.success('Zona agregada');
      setNewZone({ zone_name: '', delivery_price: '' });
      fetchZones();
    } catch (error) {
      toast.error('Error al agregar zona');
    }
  };

  const checkActiveOrders = async (zoneName: string): Promise<number> => {
    try {
      // Check for active orders (pending, confirmed, preparing, ready) with this delivery zone
      const { data, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: false })
        .eq('store_id', storeId)
        .eq('order_type', 'delivery')
        .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
        .ilike('delivery_address', `%${zoneName}%`);

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      return 0;
    }
  };

  const handleDeleteZoneClick = async (zoneId: string, zoneName: string) => {
    // Check if there are active orders for this zone
    const count = await checkActiveOrders(zoneName);
    setActiveOrdersCount(count);
    setZoneToDelete({ id: zoneId, name: zoneName });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteZone = async () => {
    if (!zoneToDelete) return;

    try {
      const { error } = await supabase.from('delivery_zones').delete().eq('id', zoneToDelete.id);

      if (error) throw error;

      if (activeOrdersCount > 0) {
        toast.success(`Zona eliminada. Nota: ${activeOrdersCount} orden(es) activa(s) tenían esta zona asignada.`);
      } else {
        toast.success('Zona eliminada correctamente');
      }

      fetchZones();
    } catch (error) {
      toast.error('Error al eliminar zona');
    } finally {
      setDeleteDialogOpen(false);
      setZoneToDelete(null);
      setActiveOrdersCount(0);
    }
  };

  const handleConfigureZoneFreeDelivery = (zone: DeliveryZone) => {
    setSelectedZone(zone);
    setFreeDeliveryDialogOpen(true);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
      <Card className="border-0 shadow-none md:border md:shadow-sm">
        <CardContent className="px-4 md:px-6 pt-4 md:pt-6 space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="estimated_delivery_time" className="text-sm md:text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Tiempo estimado de envío
            </Label>
            <div className="relative">
              <Input
                id="estimated_delivery_time"
                {...register('estimated_delivery_time')}
                placeholder="Ej: 30-45 min"
                className={`h-11 md:h-10 text-base md:text-sm ${
                  errors.estimated_delivery_time ? 'border-red-500' : ''
                }`}
                onFocus={() => setShowTimeSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTimeSuggestions(false), 200)}
              />

              {/* Suggestions dropdown */}
              {showTimeSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg">
                  <div className="p-2 text-xs font-medium text-muted-foreground border-b">Tiempos sugeridos:</div>
                  {COMMON_DELIVERY_TIMES.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        setValue('estimated_delivery_time', time);
                        setShowTimeSuggestions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {errors.estimated_delivery_time && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.estimated_delivery_time.message}
              </p>
            )}

            <p className="text-xs md:text-sm text-muted-foreground">
              Esta opción se muestra en la página de orden. Formato: "30-45 min", "1-2 horas"
            </p>
          </div>

          {/* <div className="space-y-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="skip_payment_digital_menu" className="text-sm md:text-base">
                  Skip payment for Order in Store
                </Label>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Enable to skip payment section when order type is "Order in Store"
                </p>
                <p className="text-xs md:text-xs text-muted-foreground">
                  When enabled, orders placed as "Order in Store" (digital menu) will skip the
                  payment section and be marked as paid automatically.
                </p>
              </div>
              <Switch
                id="skip_payment_digital_menu"
                checked={skipPaymentDigitalMenu}
                onCheckedChange={(checked) => setValue("skip_payment_digital_menu", checked)}
                className="self-start md:self-auto"
              />
            </div>
          </div> */}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_price_mode" className="text-sm md:text-base">
                Modo de precio de entrega
              </Label>
              <Select
                value={deliveryPriceMode}
                onValueChange={(value: 'fixed' | 'by_zone') => setValue('delivery_price_mode', value)}
              >
                <SelectTrigger className="h-11 md:h-10 text-base md:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Precio Fijo</SelectItem>
                  <SelectItem value="by_zone">Precio por Zona de envío</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs md:text-sm text-muted-foreground">
                Seleccione el modo de entrega para ver más opciones.
              </p>
            </div>

            {deliveryPriceMode === 'fixed' && (
              <div className="space-y-2">
                <Label htmlFor="fixed_delivery_price" className="text-sm md:text-base">
                  Precio de entrega fijo
                </Label>
                <Input
                  id="fixed_delivery_price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('fixed_delivery_price', { valueAsNumber: true })}
                  className="h-11 md:h-10 text-base md:text-sm"
                />
              </div>
            )}

            {deliveryPriceMode === 'by_zone' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm md:text-base font-medium mb-2">Precio por Zona de envío</h4>
                  <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                    Definir precio de entrega por Barrios.
                  </p>

                  <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs md:text-sm">Barrio</TableHead>
                          <TableHead className="text-xs md:text-sm">Precio</TableHead>
                          {freeDeliveryEnabled && <TableHead className="text-xs md:text-sm">Delivery Gratis</TableHead>}
                          <TableHead className="text-right text-xs md:text-sm">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {zones.map((zone) => (
                          <TableRow key={zone.id}>
                            <TableCell className="font-medium text-xs md:text-sm">{zone.zone_name}</TableCell>
                            <TableCell className="text-xs md:text-sm">${zone.delivery_price.toFixed(2)}</TableCell>
                            {freeDeliveryEnabled && (
                              <TableCell className="text-xs md:text-sm">
                                {zone.free_delivery_enabled ? (
                                  <span className="text-green-600 dark:text-green-400">
                                    {zone.free_delivery_min_amount
                                      ? `$${zone.free_delivery_min_amount.toFixed(2)}+`
                                      : 'Global'}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">No incluida</span>
                                )}
                              </TableCell>
                            )}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                {freeDeliveryEnabled && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleConfigureZoneFreeDelivery(zone)}
                                    className="h-9 w-9 md:h-8 md:w-8"
                                    title="Configurar delivery gratis"
                                  >
                                    <Settings className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteZoneClick(zone.id, zone.zone_name)}
                                  className="h-9 w-9 md:h-8 md:w-8"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell>
                            <Input
                              placeholder="Nombre del barrio"
                              value={newZone.zone_name}
                              onChange={(e) => setNewZone({ ...newZone, zone_name: e.target.value })}
                              className="h-11 md:h-10 text-base md:text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={newZone.delivery_price}
                              onChange={(e) => setNewZone({ ...newZone, delivery_price: e.target.value })}
                              className="h-11 md:h-10 text-base md:text-sm"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              onClick={handleAddZone}
                              size="sm"
                              className="h-11 md:h-10 text-base md:text-sm"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Añadir
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Free Delivery Settings */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="free_delivery_enabled" className="text-sm md:text-base flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Delivery Gratis
                </Label>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Ofrece delivery gratis a partir de un monto mínimo de pedido
                </p>
              </div>
              <Switch
                id="free_delivery_enabled"
                checked={freeDeliveryEnabled}
                onCheckedChange={(checked) => setValue('free_delivery_enabled', checked)}
                className="self-start md:self-auto"
              />
            </div>

            {freeDeliveryEnabled && (
              <div className="space-y-2 pl-0 md:pl-6">
                <Label htmlFor="global_free_delivery_min_amount" className="text-sm md:text-base">
                  Monto mínimo para delivery gratis
                </Label>
                <Input
                  id="global_free_delivery_min_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('global_free_delivery_min_amount', {
                    setValueAs: (v) => {
                      // Handle empty or invalid values
                      if (v === '' || v === null || v === undefined) return null;
                      const num = Number(v);
                      return isNaN(num) ? null : num;
                    }
                  })}
                  placeholder="Ej: 20.00"
                  className="h-11 md:h-10 text-base md:text-sm"
                />
                {errors.global_free_delivery_min_amount && (
                  <p className="text-xs text-destructive">{errors.global_free_delivery_min_amount.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Los clientes obtendrán delivery gratis cuando su pedido supere este monto
                </p>
                {deliveryPriceMode === 'by_zone' && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    💡 Puedes configurar montos personalizados para cada zona de entrega más abajo
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={loading}
        className="w-full md:w-auto h-11 md:h-10 text-base md:text-sm"
      >
        {loading ? 'Guardando...' : 'Guardar Cambios'}
      </Button>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {activeOrdersCount > 0 && <AlertTriangle className="w-5 h-5 text-orange-500" />}
              {activeOrdersCount > 0 ? '¡Atención! Órdenes activas encontradas' : 'Confirmar eliminación'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {activeOrdersCount > 0 ? (
                <>
                  <p className="font-medium text-orange-600 dark:text-orange-400">
                    Se encontraron {activeOrdersCount} orden(es) activa(s) que incluyen la zona "{zoneToDelete?.name}".
                  </p>
                  <p>Estas órdenes están en estado pendiente, confirmado, preparando o listo para entrega.</p>
                  <p className="font-medium">
                    ¿Estás seguro de que deseas eliminar esta zona? Las órdenes existentes no se verán afectadas, pero
                    no podrás usar esta zona para nuevas órdenes.
                  </p>
                </>
              ) : (
                <p>
                  ¿Estás seguro de que deseas eliminar la zona "{zoneToDelete?.name}"? Esta acción no se puede deshacer.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteZone}
              className={activeOrdersCount > 0 ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              {activeOrdersCount > 0 ? 'Eliminar de todas formas' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Free Delivery Configuration Dialog */}
      <ZoneFreeDeliveryDialog
        zone={selectedZone}
        open={freeDeliveryDialogOpen}
        onOpenChange={setFreeDeliveryDialogOpen}
        onSaved={fetchZones}
        globalMinAmount={watch('global_free_delivery_min_amount')}
      />
    </form>
  );
};
