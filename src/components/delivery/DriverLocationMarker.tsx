import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { Bike, Car, PersonStanding, Truck } from 'lucide-react';

interface DriverLocation {
  lat: number;
  lng: number;
}

interface DriverInfo {
  name: string;
  vehicle_type: 'motorcycle' | 'bicycle' | 'car' | 'walking';
  phone?: string;
  photo_url?: string;
}

interface DriverLocationMarkerProps {
  location: DriverLocation;
  driver: DriverInfo;
  showPopup?: boolean;
  autoCenter?: boolean;
}

// Create custom driver icon
const createDriverIcon = (vehicleType: string, color: string = '#3b82f6') => {
  const iconSvg = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3" opacity="0.9"/>
      <circle cx="20" cy="20" r="8" fill="white"/>
    </svg>
  `;

  return L.divIcon({
    html: `
      <div style="position: relative; width: 40px; height: 40px;">
        ${iconSvg}
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: ${color};
          font-size: 16px;
        ">
          ${getVehicleEmoji(vehicleType)}
        </div>
      </div>
    `,
    className: 'driver-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

const getVehicleEmoji = (vehicleType: string) => {
  switch (vehicleType) {
    case 'motorcycle':
      return '🏍️';
    case 'bicycle':
      return '🚴';
    case 'car':
      return '🚗';
    case 'walking':
      return '🚶';
    default:
      return '📍';
  }
};

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

export function DriverLocationMarker({
  location,
  driver,
  showPopup = true,
  autoCenter = false,
}: DriverLocationMarkerProps) {
  const map = useMap();
  const VehicleIcon = getVehicleIcon(driver.vehicle_type);

  useEffect(() => {
    if (autoCenter && location.lat && location.lng) {
      map.setView([location.lat, location.lng], map.getZoom(), {
        animate: true,
        duration: 1,
      });
    }
  }, [location.lat, location.lng, autoCenter, map]);

  if (!location.lat || !location.lng) {
    return null;
  }

  const driverIcon = createDriverIcon(driver.vehicle_type, '#10b981');

  return (
    <Marker position={[location.lat, location.lng]} icon={driverIcon}>
      {showPopup && (
        <Popup>
          <div className="p-2 min-w-[200px]">
            <div className="flex items-center gap-3 mb-2">
              {driver.photo_url ? (
                <img
                  src={driver.photo_url}
                  alt={driver.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl">{getVehicleEmoji(driver.vehicle_type)}</span>
                </div>
              )}
              <div>
                <p className="font-semibold">{driver.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <VehicleIcon className="h-3 w-3" />
                  <span className="capitalize">{driver.vehicle_type}</span>
                </div>
              </div>
            </div>
            {driver.phone && (
              <a
                href={`tel:${driver.phone}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                📞 {driver.phone}
              </a>
            )}
            <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
              <p>📍 Ubicación en tiempo real</p>
            </div>
          </div>
        </Popup>
      )}
    </Marker>
  );
}
