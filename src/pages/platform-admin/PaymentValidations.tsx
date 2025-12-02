import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Clock, DollarSign, Store, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PaymentValidation {
  id: string;
  store_id: string;
  plan_id: string;
  amount: number;
  proof_url: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  validated_at: string | null;
  validated_by: string | null;
  rejection_reason: string | null;
  stores: {
    name: string;
    subdomain: string;
    email: string;
  };
  subscription_plans: {
    name: string;
    display_name: string;
    price_monthly: number;
  };
}

function PaymentValidations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<PaymentValidation | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch pending payments
  const { data: pendingPayments, isLoading: loadingPending } = useQuery({
    queryKey: ['payment-validations', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_validations')
        .select(`
          *,
          stores (name, subdomain, email),
          subscription_plans (name, display_name, price_monthly)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PaymentValidation[];
    },
  });

  // Fetch recent validations (approved/rejected)
  const { data: recentValidations, isLoading: loadingRecent } = useQuery({
    queryKey: ['payment-validations', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_validations')
        .select(`
          *,
          stores (name, subdomain, email),
          subscription_plans (name, display_name, price_monthly)
        `)
        .in('status', ['approved', 'rejected'])
        .order('validated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as PaymentValidation[];
    },
  });

  // Approve payment mutation
  const approveMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { data, error } = await supabase.rpc('approve_payment', {
        payment_validation_id: paymentId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Pago aprobado',
        description: 'La suscripción ha sido activada correctamente',
      });
      queryClient.invalidateQueries({ queryKey: ['payment-validations'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al aprobar pago',
        description: error.message,
      });
    },
  });

  // Reject payment mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      const { data, error } = await supabase.rpc('reject_payment', {
        payment_validation_id: paymentId,
        p_rejection_reason: reason,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Pago rechazado',
        description: 'Se ha notificado al cliente sobre el rechazo',
      });
      queryClient.invalidateQueries({ queryKey: ['payment-validations'] });
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedPayment(null);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al rechazar pago',
        description: error.message,
      });
    },
  });

  const handleApprove = (payment: PaymentValidation) => {
    if (confirm(`¿Aprobar pago de $${payment.amount} para ${payment.stores.name}?`)) {
      approveMutation.mutate(payment.id);
    }
  };

  const handleReject = (payment: PaymentValidation) => {
    setSelectedPayment(payment);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (!selectedPayment || !rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debe proporcionar una razón para el rechazo',
      });
      return;
    }

    rejectMutation.mutate({
      paymentId: selectedPayment.id,
      reason: rejectionReason,
    });
  };

  const getStatusBadge = (status: PaymentValidation['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      case 'approved':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" /> Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rechazado</Badge>;
    }
  };

  if (loadingPending || loadingRecent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Validación de Pagos</h1>
        <p className="text-muted-foreground mt-2">
          Aprobar o rechazar solicitudes de pago de suscripciones
        </p>
      </div>

      {/* Pending Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pagos Pendientes ({pendingPayments?.length || 0})
          </CardTitle>
          <CardDescription>
            Solicitudes de pago que requieren validación manual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pendingPayments || pendingPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay pagos pendientes de validación
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <Card key={payment.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <Store className="h-4 w-4" />
                              {payment.stores.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {payment.stores.subdomain}.pideai.com • {payment.stores.email}
                            </p>
                          </div>
                          {getStatusBadge(payment.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Plan solicitado</p>
                            <p className="font-medium">{payment.subscription_plans.display_name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Monto</p>
                            <p className="font-medium flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${payment.amount}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha de solicitud</p>
                            <p className="font-medium flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(payment.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                            </p>
                          </div>
                        </div>

                        {payment.notes && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Notas del cliente</p>
                            <p className="text-sm bg-muted p-2 rounded">{payment.notes}</p>
                          </div>
                        )}

                        {payment.proof_url && (
                          <div>
                            <a
                              href={payment.proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Ver comprobante de pago →
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex md:flex-col gap-2 md:justify-center">
                        <Button
                          onClick={() => handleApprove(payment)}
                          disabled={approveMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprobar
                        </Button>
                        <Button
                          onClick={() => handleReject(payment)}
                          disabled={rejectMutation.isPending}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Validations */}
      <Card>
        <CardHeader>
          <CardTitle>Validaciones Recientes</CardTitle>
          <CardDescription>
            Últimas 10 solicitudes procesadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!recentValidations || recentValidations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay validaciones recientes
            </div>
          ) : (
            <div className="space-y-3">
              {recentValidations.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{payment.stores.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.subscription_plans.display_name} • ${payment.amount}
                    </p>
                    {payment.rejection_reason && (
                      <p className="text-sm text-red-600 mt-1">
                        Razón: {payment.rejection_reason}
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    {getStatusBadge(payment.status)}
                    {payment.validated_at && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.validated_at), 'dd MMM, HH:mm', { locale: es })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Pago</DialogTitle>
            <DialogDescription>
              Proporcione una razón para rechazar este pago. Se notificará al cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Razón del rechazo *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ej: Comprobante ilegible, monto incorrecto, método de pago no válido..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setSelectedPayment(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PaymentValidations;
