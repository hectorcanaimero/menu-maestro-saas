import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useStoreTheme } from '@/hooks/useStoreTheme';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Clock,
  Package,
  Truck,
  Home,
} from 'lucide-react';
import { useOrderTracking, requestNotificationPermission } from '@/hooks/useOrderTracking';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import {
  calculateEstimatedDelivery,
  getStatusLabel,
  getStatusVariant,
  getProgressPercentage,
} from '@/lib/orderTracking';
import { formatCurrency } from '@/lib/analytics';
import { H1, H2, H3, H4, Body, Caption } from '@/components/ui/typography';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { DeliveryMap } from '@/components/delivery/DeliveryMap';
import { DriverLocationMarker } from '@/components/delivery/DriverLocationMarker';
import { DriverInfoCard } from '@/components/delivery/DriverInfoCard';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

export default function TrackOrder() {
  const { orderId } = useParams<{ orderId: string }>();
  const { order, isLoading, error } = useOrderTracking(orderId || '');

  // Get delivery tracking data
  const {
    assignment,
    driver,
    driverLocation,
    estimatedMinutesRemaining,
    isLoading: isLoadingDelivery,
  } = useDeliveryTracking(orderId);

  // Apply store theme colors
  useStoreTheme();

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-3xl py-8 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-96" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <H3>Pedido No Encontrado</H3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Body>No pudimos encontrar el pedido que estás buscando.</Body>
            <Link to="/my-orders">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ver Mis Pedidos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const estimatedTime = order.created_at && order.order_type 
    ? calculateEstimatedDelivery({ created_at: order.created_at, items: order.order_items || [], order_type: order.order_type, status: order.status })
    : null;
  const progress = getProgressPercentage(order.status);
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/my-orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <H1 className="text-2xl sm:text-3xl">Seguimiento de Pedido</H1>
            <Caption className="text-muted-foreground">
              Pedido #{order.id.substring(0, 8)}
            </Caption>
          </div>
        </div>

        {/* Order Status Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <H3>Estado del Pedido</H3>
                <Caption className="text-muted-foreground mt-1">
                  {format(new Date(order.created_at), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
                    locale: es,
                  })}
                </Caption>
              </div>
              <Badge variant={getStatusVariant(order.status)} className="text-sm px-3 py-1">
                {getStatusLabel(order.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            {!isCancelled && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Timeline */}
            <OrderTimeline currentStatus={order.status} />
          </CardContent>
        </Card>

        {/* Delivery Map and Driver Info - Only for delivery orders with assigned driver */}
        {order.order_type === 'delivery' && driver && driverLocation && (
          <>
            {/* Driver Info Card */}
            <DriverInfoCard
              driver={{
                id: driver.id,
                name: driver.name,
                phone: driver.phone,
                photo_url: driver.photo_url,
                vehicle_type: driver.vehicle_type as any,
                status: 'busy',
              }}
              deliveryStatus={
                assignment
                  ? {
                      status: assignment.status,
                      estimated_minutes: assignment.estimated_minutes ?? undefined,
                      actual_minutes: assignment.actual_minutes ?? undefined,
                    }
                  : undefined
              }
              estimatedMinutesRemaining={estimatedMinutesRemaining ?? undefined}
              showContactButton={true}
            />

            {/* Delivery Map */}
            <Card>
              <CardHeader>
                <H3>Ubicación en Tiempo Real</H3>
                <Caption className="text-muted-foreground">
                  Sigue el recorrido de tu pedido en el mapa
                </Caption>
              </CardHeader>
              <CardContent>
                <DeliveryMap
                  center={{
                    lat: driverLocation.latitude,
                    lng: driverLocation.longitude,
                  }}
                  zoom={15}
                  height="400px"
                >
                  {/* Driver Location Marker */}
                  <DriverLocationMarker
                    location={{
                      lat: driverLocation.latitude,
                      lng: driverLocation.longitude,
                    }}
                    driver={{
                      name: driver.name,
                      vehicle_type: driver.vehicle_type as any,
                      phone: driver.phone,
                      photo_url: driver.photo_url,
                    }}
                    showPopup={true}
                    autoCenter={false}
                  />

                  {/* Delivery Address Marker */}
                  {order.delivery_lat && order.delivery_lng && (
                    <Marker
                      position={[order.delivery_lat, order.delivery_lng]}
                      icon={L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                      })}
                    >
                      <Popup>
                        <div className="p-2">
                          <p className="font-semibold">📍 Dirección de entrega</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.delivery_address}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </DeliveryMap>
              </CardContent>
            </Card>
          </>
        )}

        {/* Estimated Delivery Time - Only show if not delivered/cancelled */}
        {!isDelivered && !isCancelled && (
          <Card>
            <CardHeader>
              <H3>Tiempo Estimado</H3>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <H2 className="text-2xl sm:text-3xl text-primary">
                    {formatDistanceToNow(estimatedTime, { locale: es })}
                  </H2>
                  <Caption className="text-muted-foreground mt-1">
                    Llegada aproximada: {format(estimatedTime, 'HH:mm', { locale: es })}
                  </Caption>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        <Card>
          <CardHeader>
            <H3>Detalles del Pedido</H3>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Type */}
            <div className="flex items-center gap-3">
              {order.order_type === 'delivery' ? (
                <Truck className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Home className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Body size="small" className="font-medium">
                  {order.order_type === 'delivery' ? 'Entrega a domicilio' : 'Recoger en tienda'}
                </Body>
                {order.delivery_address && (
                  <Caption className="text-muted-foreground">{order.delivery_address}</Caption>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="border-t pt-4 space-y-3">
              <H4>Productos</H4>
              {order.order_items?.map((item: { quantity: number; item_name: string; price_at_time: number; order_item_extras?: Array<{ extra_name: string }> }, index: number) => (
                <div key={index} className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <Body size="small" className="font-medium">
                      {item.quantity}x {item.item_name}
                    </Body>
                    {item.order_item_extras && item.order_item_extras.length > 0 && (
                      <Caption className="text-muted-foreground">
                        + {item.order_item_extras.map((e) => e.extra_name).join(', ')}
                      </Caption>
                    )}
                  </div>
                  <Body size="small" className="font-medium">
                    {formatCurrency(item.price_at_time * item.quantity)}
                  </Body>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between items-center">
                <H4>Total</H4>
                <H3>{formatCurrency(Number(order.total_amount))}</H3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <H3>Información de Contacto</H3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Caption>{order.customer_phone}</Caption>
            </div>
            {order.customer_email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Caption>{order.customer_email}</Caption>
              </div>
            )}
            {order.delivery_address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <Caption>{order.delivery_address}</Caption>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <Body size="small" className="text-center text-muted-foreground">
              ¿Tienes alguna pregunta sobre tu pedido?{' '}
              <a href={`tel:${order.customer_phone}`} className="text-primary hover:underline">
                Contáctanos
              </a>
            </Body>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
