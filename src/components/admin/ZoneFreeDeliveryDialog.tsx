import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeliveryZone {
  id: string;
  zone_name: string;
  delivery_price: number;
  free_delivery_enabled: boolean;
  free_delivery_min_amount: number | null;
}

interface ZoneFreeDeliveryDialogProps {
  zone: DeliveryZone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  globalMinAmount: number | null;
}

export const ZoneFreeDeliveryDialog = ({
  zone,
  open,
  onOpenChange,
  onSaved,
  globalMinAmount,
}: ZoneFreeDeliveryDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(true);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  useEffect(() => {
    if (zone) {
      setFreeDeliveryEnabled(zone.free_delivery_enabled);
      setUseCustomAmount(zone.free_delivery_min_amount !== null);
      setCustomAmount(zone.free_delivery_min_amount?.toString() || '');
    }
  }, [zone]);

  const handleSave = async () => {
    if (!zone) return;

    setLoading(true);
    try {
      const updateData: {
        free_delivery_enabled: boolean;
        free_delivery_min_amount: number | null;
      } = {
        free_delivery_enabled: freeDeliveryEnabled,
        free_delivery_min_amount: null,
      };

      if (useCustomAmount && customAmount) {
        updateData.free_delivery_min_amount = parseFloat(customAmount);
      }

      const { error } = await supabase
        .from('delivery_zones')
        .update(updateData)
        .eq('id', zone.id);

      if (error) throw error;

      toast.success('Configuración de zona actualizada');
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating zone:', error);
      toast.error('Error al actualizar zona');
    } finally {
      setLoading(false);
    }
  };

  if (!zone) return null;

  const effectiveAmount = useCustomAmount && customAmount
    ? parseFloat(customAmount)
    : globalMinAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar Delivery Gratis - {zone.zone_name}</DialogTitle>
          <DialogDescription>
            Personaliza la configuración de delivery gratis para esta zona específica
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Enable/Disable Free Delivery for this zone */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label>Incluir en delivery gratis</Label>
              <p className="text-xs text-muted-foreground">
                {freeDeliveryEnabled
                  ? 'Esta zona está incluida en la promoción de delivery gratis'
                  : 'Esta zona NO tiene delivery gratis'}
              </p>
            </div>
            <Switch
              checked={freeDeliveryEnabled}
              onCheckedChange={setFreeDeliveryEnabled}
            />
          </div>

          {freeDeliveryEnabled && (
            <>
              {/* Use Custom Amount Toggle */}
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label>Monto personalizado</Label>
                  <p className="text-xs text-muted-foreground">
                    {useCustomAmount
                      ? 'Usar un monto específico para esta zona'
                      : `Usar monto global (${globalMinAmount ? `$${globalMinAmount.toFixed(2)}` : 'no configurado'})`}
                  </p>
                </div>
                <Switch
                  checked={useCustomAmount}
                  onCheckedChange={setUseCustomAmount}
                />
              </div>

              {/* Custom Amount Input */}
              {useCustomAmount && (
                <div className="space-y-2">
                  <Label htmlFor="custom_amount">Monto mínimo para esta zona</Label>
                  <Input
                    id="custom_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Ej: 35.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Los clientes en {zone.zone_name} obtendrán delivery gratis al superar este monto
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Resumen
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {effectiveAmount
                    ? `Delivery gratis en ${zone.zone_name} con pedidos desde $${effectiveAmount.toFixed(2)}`
                    : 'Configura un monto para activar delivery gratis en esta zona'}
                </p>
              </div>
            </>
          )}

          {!freeDeliveryEnabled && (
            <div className="rounded-md bg-orange-50 dark:bg-orange-950 p-3 border border-orange-200 dark:border-orange-800">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Zona excluida
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                Los pedidos a {zone.zone_name} siempre pagarán ${zone.delivery_price.toFixed(2)} de delivery
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
