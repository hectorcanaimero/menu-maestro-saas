import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const deliverySchema = z.object({
  estimated_delivery_time: z.string().optional(),
  skip_payment_digital_menu: z.boolean().default(false),
  delivery_price_mode: z.enum(['fixed', 'by_zone']).default('fixed'),
  fixed_delivery_price: z.number().min(0).default(0),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;

interface DeliveryZone {
  id: string;
  zone_name: string;
  delivery_price: number;
  display_order: number;
}

interface DeliverySettingsTabProps {
  storeId: string;
  initialData?: Partial<DeliveryFormData>;
}

export const DeliverySettingsTab = ({ storeId, initialData }: DeliverySettingsTabProps) => {
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [newZone, setNewZone] = useState({ zone_name: '', delivery_price: '' });

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
    },
  });

  const deliveryPriceMode = watch('delivery_price_mode');
  const skipPaymentDigitalMenu = watch('skip_payment_digital_menu');

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
      console.error('Error fetching zones:', error);
      toast.error('Error al cargar zonas de entrega');
    }
  };

  const onSubmit = async (data: DeliveryFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          estimated_delivery_time: data.estimated_delivery_time || null,
          skip_payment_digital_menu: data.skip_payment_digital_menu,
          delivery_price_mode: data.delivery_price_mode,
          fixed_delivery_price: data.fixed_delivery_price,
        })
        .eq('id', storeId);

      if (error) throw error;
      toast.success('Configuración de entrega actualizada');
    } catch (error) {
      console.error('Error updating delivery settings:', error);
      toast.error('Error al actualizar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = async () => {
    if (!newZone.zone_name.trim() || !newZone.delivery_price) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      const { error } = await supabase.from('delivery_zones').insert([
        {
          store_id: storeId,
          zone_name: newZone.zone_name,
          delivery_price: parseFloat(newZone.delivery_price),
          display_order: zones.length,
        },
      ]);

      if (error) throw error;
      toast.success('Zona agregada');
      setNewZone({ zone_name: '', delivery_price: '' });
      fetchZones();
    } catch (error) {
      console.error('Error adding zone:', error);
      toast.error('Error al agregar zona');
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta zona?')) return;

    try {
      const { error } = await supabase.from('delivery_zones').delete().eq('id', zoneId);

      if (error) throw error;
      toast.success('Zona eliminada');
      fetchZones();
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('Error al eliminar zona');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
      <Card className="border-0 shadow-none md:border md:shadow-sm">
        <CardContent className="px-4 md:px-6 pt-4 md:pt-6 space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="estimated_delivery_time" className="text-sm md:text-base">
              Tiempo estimado de envío
            </Label>
            <Input
              id="estimated_delivery_time"
              {...register('estimated_delivery_time')}
              placeholder="Ej: 30-45 minutos"
              className="h-11 md:h-10 text-base md:text-sm"
            />
            <p className="text-xs md:text-sm text-muted-foreground">Esta opción se muestra en la página de orden.</p>
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
                          <TableHead className="text-right text-xs md:text-sm">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {zones.map((zone) => (
                          <TableRow key={zone.id}>
                            <TableCell className="font-medium text-xs md:text-sm">{zone.zone_name}</TableCell>
                            <TableCell className="text-xs md:text-sm">${zone.delivery_price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteZone(zone.id)}
                                className="h-9 w-9 md:h-8 md:w-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading} className="w-full md:w-auto h-11 md:h-10 text-base md:text-sm">
        {loading ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    </form>
  );
};
