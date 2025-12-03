import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Bike, Car, PersonStanding, Truck } from 'lucide-react';
import { useDrivers } from '@/hooks/useDrivers';
import { useAssignDriver } from '@/hooks/useDeliveryTracking';

interface DriverAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderAddress?: string;
  currentDriverId?: string | null;
  onSuccess?: () => void;
}

const getVehicleIcon = (vehicleType: string) => {
  switch (vehicleType) {
    case 'motorcycle':
      return Bike;
    case 'bicycle':
      return Bike;
    case 'car':
      return Car;
    case 'walking':
      return PersonStanding;
    default:
      return Truck;
  }
};

const getVehicleLabel = (vehicleType: string) => {
  switch (vehicleType) {
    case 'motorcycle':
      return 'Motocicleta';
    case 'bicycle':
      return 'Bicicleta';
    case 'car':
      return 'Automóvil';
    case 'walking':
      return 'A pie';
    default:
      return vehicleType;
  }
};

export function DriverAssignmentDialog({
  open,
  onOpenChange,
  orderId,
  orderAddress,
  currentDriverId,
  onSuccess,
}: DriverAssignmentDialogProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>(currentDriverId || '');
  const [isAssigning, setIsAssigning] = useState(false);

  const { drivers, isLoading } = useDrivers();
  const { assignDriver } = useAssignDriver();

  // Filter available drivers
  const availableDrivers = drivers?.filter(
    (d) => d.is_active && (d.status === 'available' || d.id === currentDriverId)
  ) || [];

  const handleAssign = async () => {
    if (!selectedDriverId) {
      toast.error('Selecciona un motorista');
      return;
    }

    setIsAssigning(true);
    try {
      // Note: In a real implementation, you would calculate distance and ETA
      // using the geocode-address and calculate-delivery-distance edge functions
      // For now, we'll use placeholder values

      await assignDriver(
        orderId,
        selectedDriverId,
        undefined, // distance_km - would be calculated
        undefined  // estimated_minutes - would be calculated
      );

      toast.success('Motorista asignado correctamente');
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      toast.error(error.message || 'Error al asignar motorista');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentDriverId ? 'Reasignar Motorista' : 'Asignar Motorista'}
          </DialogTitle>
          <DialogDescription>
            {orderAddress && (
              <span className="text-sm">Dirección: {orderAddress}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : availableDrivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No hay motoristas disponibles</p>
              <p className="text-xs mt-1">
                Los motoristas deben estar activos y en línea
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Seleccionar Motorista</Label>
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un motorista..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.map((driver) => {
                      const VehicleIcon = getVehicleIcon(driver.vehicle_type);
                      return (
                        <SelectItem key={driver.id} value={driver.id}>
                          <div className="flex items-center gap-2">
                            <VehicleIcon className="h-4 w-4" />
                            <span>{driver.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({getVehicleLabel(driver.vehicle_type)})
                            </span>
                            {driver.status === 'available' && (
                              <Badge variant="outline" className="ml-auto text-xs bg-green-50">
                                Disponible
                              </Badge>
                            )}
                            {driver.status === 'busy' && (
                              <Badge variant="outline" className="ml-auto text-xs bg-yellow-50">
                                Ocupado
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedDriverId && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-1">Motorista seleccionado:</p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const driver = drivers?.find((d) => d.id === selectedDriverId);
                      if (!driver) return null;
                      const VehicleIcon = getVehicleIcon(driver.vehicle_type);
                      return (
                        <>
                          {driver.photo_url ? (
                            <img
                              src={driver.photo_url}
                              alt={driver.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <VehicleIcon className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{driver.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {driver.phone} • {getVehicleLabel(driver.vehicle_type)}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  💡 El motorista recibirá la asignación en su app móvil y
                  comenzará a compartir su ubicación en tiempo real.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAssigning}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isAssigning || !selectedDriverId || availableDrivers.length === 0}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Asignando...
              </>
            ) : (
              'Asignar Motorista'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
