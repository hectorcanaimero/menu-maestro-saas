import { Polyline, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import polyline from '@mapbox/polyline';

interface RoutePolylineProps {
  encodedPolyline?: string;
  color?: string;
  weight?: number;
  opacity?: number;
  fitBounds?: boolean;
}

export function RoutePolyline({
  encodedPolyline,
  color = '#3b82f6',
  weight = 4,
  opacity = 0.7,
  fitBounds = true,
}: RoutePolylineProps) {
  const map = useMap();

  // Decode polyline string to lat/lng coordinates
  const positions = encodedPolyline
    ? polyline.decode(encodedPolyline).map(([lat, lng]) => [lat, lng] as [number, number])
    : [];

  useEffect(() => {
    if (fitBounds && positions.length > 0) {
      // Fit map bounds to show entire route
      const bounds = positions.reduce(
        (acc, pos) => acc.extend(pos),
        new L.LatLngBounds(positions[0], positions[0])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, fitBounds, map]);

  if (positions.length === 0) {
    return null;
  }

  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color,
        weight,
        opacity,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  );
}
