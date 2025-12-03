import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bike, Car, PersonStanding, Phone, Truck } from 'lucide-react';

interface DriverInfo {
  id: string;
  name: string;
  phone?: string;
  photo_url?: string;
  vehicle_type: 'motorcycle' | 'bicycle' | 'car' | 'walking';
  license_plate?: string;
  status: 'available' | 'busy' | 'offline';
}

interface DeliveryStatus {
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  estimated_minutes?: number;
  actual_minutes?: number;
}

interface DriverInfoCardProps {
  driver: DriverInfo;
  deliveryStatus?: DeliveryStatus;
  estimatedMinutesRemaining?: number;
  showContactButton?: boolean;
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

const getStatusBadge = (status: string) => {
  const statusConfig = {
    assigned: { label: 'Asignado', variant: 'secondary' as const },
    picked_up: { label: 'Recogido', variant: 'default' as const },
    in_transit: { label: 'En camino', variant: 'default' as const },
    delivered: { label: 'Entregado', variant: 'default' as const },
    cancelled: { label: 'Cancelado', variant: 'destructive' as const },
  };

  const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getDeliveryMessage = (status: string, estimatedMinutes?: number) => {
  switch (status) {
    case 'assigned':
      return 'El motorista ha sido asignado a tu pedido';
    case 'picked_up':
      return 'Tu pedido ha sido recogido y está en preparación para la entrega';
    case 'in_transit':
      return estimatedMinutes
        ? `Tu pedido llegará en aproximadamente ${estimatedMinutes} minutos`
        : 'Tu pedido está en camino';
    case 'delivered':
      return 'Tu pedido ha sido entregado';
    case 'cancelled':
      return 'La entrega ha sido cancelada';
    default:
      return 'Esperando actualización del estado';
  }
};

export function DriverInfoCard({
  driver,
  deliveryStatus,
  estimatedMinutesRemaining,
  showContactButton = true,
}: DriverInfoCardProps) {
  const VehicleIcon = getVehicleIcon(driver.vehicle_type);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Tu Motorista</span>
          {deliveryStatus && getStatusBadge(deliveryStatus.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Driver Info */}
        <div className="flex items-center gap-4">
          {driver.photo_url ? (
            <img
              src={driver.photo_url}
              alt={driver.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
              <VehicleIcon className="h-8 w-8 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{driver.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <VehicleIcon className="h-4 w-4" />
              <span>{getVehicleLabel(driver.vehicle_type)}</span>
              {driver.license_plate && (
                <>
                  <span>•</span>
                  <span className="font-mono">{driver.license_plate}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Status Message */}
        {deliveryStatus && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm">
              {getDeliveryMessage(deliveryStatus.status, estimatedMinutesRemaining)}
            </p>
          </div>
        )}

        {/* ETA Display */}
        {deliveryStatus?.status === 'in_transit' && estimatedMinutesRemaining !== undefined && (
          <div className="flex items-center justify-center p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {estimatedMinutesRemaining}
              </p>
              <p className="text-sm text-muted-foreground">minutos estimados</p>
            </div>
          </div>
        )}

        {/* Contact Button */}
        {showContactButton && driver.phone && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(`tel:${driver.phone}`, '_self')}
          >
            <Phone className="h-4 w-4 mr-2" />
            Contactar Motorista
          </Button>
        )}

        {/* WhatsApp Button */}
        {showContactButton && driver.phone && (
          <Button
            variant="default"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => {
              const cleanPhone = driver.phone?.replace(/\D/g, '');
              window.open(`https://wa.me/${cleanPhone}`, '_blank');
            }}
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Contactar por WhatsApp
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
