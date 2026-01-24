import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import posthog from 'posthog-js';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Package,
  CheckCircle2,
  Navigation,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { H2, H3, Body, Caption } from '@/components/ui/typography';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { useUpdateDeliveryStatus } from '@/hooks/useDeliveryTracking';
import { SignatureCapture } from '@/components/driver/SignatureCapture';
import { PhotoCapture } from '@/components/driver/PhotoCapture';
import { formatCurrency } from '@/lib/analytics';

export default function ActiveDelivery() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [driverId] = useState(() => localStorage.getItem('driver_id'));

  const [currentStep, setCurrentStep] = useState<'details' | 'photo' | 'signature' | 'notes'>(
    'details'
  );
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const { updateStatus } = useUpdateDeliveryStatus();

  // Enable GPS tracking
  const { isTracking } = useDriverLocation({
    driverId: driverId || '',
    enabled: true,
  });

  // Get delivery details
  const { data: delivery, isLoading } = useQuery({
    queryKey: ['delivery-assignment', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return null;

      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          orders (
            id,
            customer_name,
            customer_phone,
            delivery_address,
            delivery_lat,
            delivery_lng,
            total_amount,
            order_items (
              quantity,
              item_name,
              price_at_time
            )
          )
        `)
        .eq('id', assignmentId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'picked_up' | 'in_transit' | 'delivered') => {
      if (!assignmentId) throw new Error('No assignment ID');

      await updateStatus(
        assignmentId,
        status,
        photo || undefined,
        signature || undefined,
        notes || undefined
      );
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['driver-deliveries', driverId] });

      // Track delivery status events
      try {
        if (delivery?.orders) {
          const eventProperties = {
            assignment_id: assignmentId,
            order_id: delivery.orders.id,
            driver_id: driverId,
            new_status: status,
            has_photo: !!photo,
            has_signature: !!signature,
            has_notes: !!notes,
            timestamp: new Date().toISOString(),
          };

          if (status === 'picked_up') {
            posthog.capture('delivery_picked_up', eventProperties);
          } else if (status === 'in_transit') {
            posthog.capture('delivery_in_transit', eventProperties);
          } else if (status === 'delivered') {
            posthog.capture('delivery_completed', {
              ...eventProperties,
              total_amount: delivery.orders.total_amount,
            });
          }
        }
      } catch (error) {
        console.error('[PostHog] Error tracking delivery status:', error);
      }

      if (status === 'delivered') {
        toast.success('¡Entrega completada!');
        navigate('/driver/dashboard');
      } else {
        toast.success('Estado actualizado');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al actualizar estado');
    },
  });

  // Handle status updates
  const handlePickedUp = () => {
    updateStatusMutation.mutate('picked_up');
  };

  const handleInTransit = () => {
    updateStatusMutation.mutate('in_transit');
  };

  const handleCompleteDelivery = () => {
    if (!photo) {
      toast.error('Debes capturar una foto de comprobación');
      setCurrentStep('photo');
      return;
    }

    if (!signature) {
      toast.error('Debes obtener la firma del cliente');
      setCurrentStep('signature');
      return;
    }

    updateStatusMutation.mutate('delivered');
  };

  // Open navigation app
  const openNavigation = () => {
    if (!delivery?.orders) return;

    let url = '';

    // If we have coordinates, use them
    if (delivery.orders.delivery_lat && delivery.orders.delivery_lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${delivery.orders.delivery_lat},${delivery.orders.delivery_lng}`;
    }
    // Otherwise, use the address
    else if (delivery.orders.delivery_address) {
      const encodedAddress = encodeURIComponent(delivery.orders.delivery_address);
      url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    } else {
      toast.error('No hay dirección disponible');
      return;
    }

    window.open(url, '_blank');
  };

  if (!driverId) {
    navigate('/driver/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-48 mb-4" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <Body>Entrega no encontrada</Body>
            <Button className="mt-4" onClick={() => navigate('/driver/dashboard')}>
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const order = delivery.orders;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10">
        <div className="container max-w-2xl flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/driver/dashboard')}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <H2 className="text-lg text-primary-foreground">Entrega en Proceso</H2>
            <Caption className="text-primary-foreground/80">
              {isTracking ? (
                <span className="flex items-center gap-1">
                  <Navigation className="h-3 w-3 animate-pulse" />
                  GPS activo
                </span>
              ) : (
                'Activando GPS...'
              )}
            </Caption>
          </div>
          <Badge variant="secondary">{delivery.status}</Badge>
        </div>
      </div>

      <div className="container max-w-2xl py-6 space-y-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{order.customer_name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`tel:${order.customer_phone}`)}
              >
                <Phone className="h-4 w-4 mr-2" />
                Llamar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <Caption className="font-medium">Dirección de entrega:</Caption>
                <Body size="small">{order.delivery_address}</Body>
              </div>
            </div>

            {delivery.estimated_minutes && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <Caption>Tiempo estimado: ~{delivery.estimated_minutes} min</Caption>
              </div>
            )}

            <Button className="w-full" onClick={openNavigation}>
              <Navigation className="h-4 w-4 mr-2" />
              Abrir en Google Maps
            </Button>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos ({order.order_items?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.order_items?.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-start">
                  <Body size="small">
                    {item.quantity}x {item.item_name}
                  </Body>
                  <Caption>{formatCurrency(item.price_at_time * item.quantity)}</Caption>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <Body size="small">Total:</Body>
                <Body size="small">{formatCurrency(order.total_amount)}</Body>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {delivery.status === 'assigned' && (
          <Button
            className="w-full"
            size="lg"
            onClick={handlePickedUp}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Marcar como Recogido
              </>
            )}
          </Button>
        )}

        {delivery.status === 'picked_up' && (
          <Button
            className="w-full"
            size="lg"
            onClick={handleInTransit}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Navigation className="h-5 w-5 mr-2" />
                Estoy en Camino
              </>
            )}
          </Button>
        )}

        {delivery.status === 'in_transit' && (
          <>
            {/* Photo Capture */}
            {currentStep === 'photo' || !photo ? (
              <PhotoCapture
                onSave={(photoUrl) => {
                  setPhoto(photoUrl);
                  setCurrentStep('signature');
                }}
              />
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <Body size="small">Foto capturada</Body>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep('photo')}
                    >
                      Cambiar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Signature Capture */}
            {photo && (currentStep === 'signature' || !signature) && (
              <SignatureCapture
                onSave={(signatureUrl) => {
                  setSignature(signatureUrl);
                  setCurrentStep('notes');
                }}
              />
            )}

            {signature && currentStep !== 'signature' && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <Body size="small">Firma capturada</Body>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep('signature')}
                    >
                      Cambiar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes (Optional) */}
            {photo && signature && currentStep === 'notes' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notas (Opcional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Observaciones de la entrega</Label>
                      <Textarea
                        placeholder="Ej: Entregado en portería, cliente ausente, etc."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleCompleteDelivery}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Completando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          Completar Entrega
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
