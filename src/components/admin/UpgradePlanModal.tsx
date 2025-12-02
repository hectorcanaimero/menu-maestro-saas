import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Upload, Loader2 } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  limits: {
    max_products: number;
    max_categories: number;
    max_orders_per_month: number;
    max_ai_credits_per_month: number;
  };
  features: string[];
  sort_order: number;
}

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanId?: string;
}

export function UpgradePlanModal({ open, onOpenChange, currentPlanId }: UpgradePlanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { store } = useStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Fetch available plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data as Plan[];
    },
    enabled: open,
  });

  // Request upgrade mutation
  const requestUpgradeMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id || !selectedPlanId) {
        throw new Error('Información incompleta');
      }

      const selectedPlan = plans?.find((p) => p.id === selectedPlanId);
      if (!selectedPlan) {
        throw new Error('Plan no encontrado');
      }

      const { data, error } = await supabase.from('payment_validations').insert({
        store_id: store.id,
        plan_id: selectedPlanId,
        amount: parseFloat(amount) || selectedPlan.price_monthly,
        proof_url: proofUrl || null,
        notes: notes || null,
        status: 'pending',
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Solicitud enviada',
        description: 'Tu solicitud de upgrade está siendo procesada. Te notificaremos cuando sea aprobada.',
      });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al enviar solicitud',
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setSelectedPlanId('');
    setAmount('');
    setProofUrl('');
    setNotes('');
  };

  const handleSubmit = () => {
    if (!selectedPlanId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selecciona un plan',
      });
      return;
    }

    requestUpgradeMutation.mutate();
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans?.find((p) => p.id === planId);
    if (plan) {
      setAmount(plan.price_monthly.toString());
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const availablePlans = plans?.filter((p) => {
    if (!currentPlanId) return p.name !== 'trial';
    const currentPlan = plans.find((plan) => plan.id === currentPlanId);
    return currentPlan ? p.sort_order > currentPlan.sort_order : true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Upgrade de Plan</DialogTitle>
          <DialogDescription>
            Selecciona el plan que deseas y envía el comprobante de pago para aprobación
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Selection */}
          <div>
            <Label>Selecciona un plan</Label>
            <div className="grid gap-3 mt-2">
              {availablePlans?.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`
                    p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${selectedPlanId === plan.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{plan.display_name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${plan.price_monthly}</p>
                      <p className="text-xs text-muted-foreground">/mes</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                    <div>
                      <span className="text-muted-foreground">Productos:</span>{' '}
                      <span className="font-medium">
                        {plan.limits.max_products === -1 ? 'Ilimitado' : plan.limits.max_products}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Categorías:</span>{' '}
                      <span className="font-medium">
                        {plan.limits.max_categories === -1 ? 'Ilimitado' : plan.limits.max_categories}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Órdenes/mes:</span>{' '}
                      <span className="font-medium">
                        {plan.limits.max_orders_per_month === -1 ? 'Ilimitado' : plan.limits.max_orders_per_month}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Créditos AI/mes:</span>{' '}
                      <span className="font-medium">{plan.limits.max_ai_credits_per_month}</span>
                    </div>
                  </div>

                  {plan.features && plan.features.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {plan.features.slice(0, 3).map((feature, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {feature}
                        </Badge>
                      ))}
                      {plan.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{plan.features.length - 3} más
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedPlanId && (
            <>
              {/* Amount */}
              <div>
                <Label htmlFor="amount">Monto pagado (USD) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="29.00"
                  className="mt-2"
                />
              </div>

              {/* Proof URL */}
              <div>
                <Label htmlFor="proof-url">
                  URL del comprobante de pago
                  <span className="text-muted-foreground ml-1">(opcional)</span>
                </Label>
                <div className="mt-2">
                  <Input
                    id="proof-url"
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Upload className="h-3 w-3" />
                    Sube tu comprobante a Google Drive, Dropbox, etc. y pega el enlace aquí
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">
                  Notas adicionales
                  <span className="text-muted-foreground ml-1">(opcional)</span>
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Información adicional sobre el pago..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              {/* Payment Instructions */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Instrucciones de Pago</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>1. Realiza el pago del monto correspondiente al plan seleccionado</li>
                  <li>2. Guarda el comprobante de pago</li>
                  <li>3. Sube el comprobante a un servicio en la nube y pega el enlace</li>
                  <li>4. Envía la solicitud y espera la aprobación (24-48 horas)</li>
                </ul>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPlanId || requestUpgradeMutation.isPending}
          >
            {requestUpgradeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Solicitud'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
