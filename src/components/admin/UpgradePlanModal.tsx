import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import posthog from 'posthog-js';
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
import { CheckCircle, Upload, Loader2, X, Copy, Check } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type {
  PaymentMethod,
  PagoMovilDetails,
  ZelleDetails,
  BinanceDetails,
  OtrosDetails,
} from '@/types/payment-methods';

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

  // Plan selection states
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  // Payment form states
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load platform payment methods from database
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!open) return;

      setLoadingMethods(true);
      try {
        const { data, error } = await supabase
          .from('platform_payment_methods')
          .select('id, name, description, payment_type, payment_details, is_active')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setPaymentMethods((data as PaymentMethod[]) || []);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudieron cargar los métodos de pago',
        });
      } finally {
        setLoadingMethods(false);
      }
    };

    loadPaymentMethods();
  }, [open, toast]);

  // Fetch available plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
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

      if (!selectedPaymentMethodId) {
        throw new Error('Debes seleccionar un método de pago');
      }

      if (!paymentProofFile && !referenceNumber) {
        throw new Error('Debes proporcionar al menos un comprobante o número de referencia');
      }

      let paymentProofUrl = null;

      // Upload payment proof file to Supabase Storage if provided
      if (paymentProofFile) {
        setUploadingProof(true);
        const fileExt = paymentProofFile.name.split('.').pop();
        const fileName = `upgrade-${store.id}-${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProofFile);

        if (uploadError) {
          throw new Error('Error al subir el comprobante de pago');
        }

        const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(uploadData.path);
        paymentProofUrl = urlData.publicUrl;
        setUploadingProof(false);
      }

      // Get selected payment method name
      const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentMethodId);

      // Get current subscription to link
      const { data: subscriptionData } = await supabase
        .from('store_subscriptions')
        .select('id')
        .eq('store_id', store.id)
        .single();

      const { data, error } = await supabase.from('payment_validations').insert({
        store_id: store.id,
        subscription_id: subscriptionData?.id || null,
        amount: selectedPlan.price_monthly,
        payment_date: paymentDate,
        payment_method: selectedMethod?.name || 'N/A',
        reference_number: referenceNumber || `PLAN_${selectedPlan.name.toUpperCase()}`,
        proof_image_url: paymentProofUrl || null,
        status: 'pending',
        validation_notes: `Upgrade a plan ${selectedPlan.display_name}\n\n${notes || ''}`,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Track subscription_upgraded event
      try {
        const selectedPlan = plans?.find((p) => p.id === selectedPlanId);
        if (store?.id && selectedPlan) {
          posthog.capture('subscription_upgraded', {
            store_id: store.id,
            store_name: store.name,
            new_plan_id: selectedPlanId,
            new_plan_name: selectedPlan.display_name,
            new_plan_price: selectedPlan.price_monthly,
            payment_method: paymentMethods.find((m) => m.id === selectedPaymentMethodId)?.name,
            has_proof_image: !!paymentProofFile,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('[PostHog] Error tracking subscription_upgraded:', error);
      }

      toast({
        title: 'Solicitud enviada',
        description: 'Tu solicitud de upgrade está siendo procesada. Te notificaremos cuando sea aprobada.',
      });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['payment-validations'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error al enviar solicitud',
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    },
  });

  const resetForm = () => {
    setSelectedPlanId('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setSelectedPaymentMethodId('');
    setReferenceNumber('');
    setPaymentProofFile(null);
    setNotes('');
    setCopiedField(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (images only)
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Solo se permiten archivos de imagen',
        });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'El archivo no debe superar 5MB',
        });
        return;
      }
      setPaymentProofFile(file);
    }
  };

  const handleCopyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: 'Copiado',
      description: 'Información copiada al portapapeles',
    });
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
              {/* Payment Method Selection */}
              <div>
                <Label className="text-base font-semibold">
                  Método de Pago <span className="text-red-500">*</span>
                </Label>
                {loadingMethods ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <Alert className="mt-2">
                    <AlertDescription>
                      No hay métodos de pago configurados. Por favor, contacta al administrador.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-3 mt-3">
                    {paymentMethods.map((method) => (
                      <Card
                        key={method.id}
                        className={`cursor-pointer transition-all ${
                          selectedPaymentMethodId === method.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedPaymentMethodId(method.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{method.name}</h4>
                              {method.description && (
                                <p className="text-sm text-muted-foreground mt-1">{method.description}</p>
                              )}
                            </div>
                            {selectedPaymentMethodId === method.id && (
                              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Details (shown when method is selected) */}
              {(() => {
                const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentMethodId);
                if (!selectedMethod || !selectedMethod.payment_details) return null;

                return (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-semibold text-sm">Datos para realizar el pago:</h4>

                      {selectedMethod.payment_type === 'pago_movil' && (() => {
                        const details = selectedMethod.payment_details as PagoMovilDetails;
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Banco:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium">{details.bank_code}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyToClipboard(details.bank_code, 'bank_code')}
                                >
                                  {copiedField === 'bank_code' ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Cédula:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium">{details.cedula}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyToClipboard(details.cedula, 'cedula')}
                                >
                                  {copiedField === 'cedula' ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Teléfono:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium">{details.phone}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyToClipboard(details.phone, 'phone')}
                                >
                                  {copiedField === 'phone' ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {selectedMethod.payment_type === 'zelle' && (() => {
                        const details = selectedMethod.payment_details as ZelleDetails;
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Email:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium">{details.email}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyToClipboard(details.email, 'zelle_email')}
                                >
                                  {copiedField === 'zelle_email' ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Titular:</span>
                              <span className="font-mono font-medium">{details.holder_name}</span>
                            </div>
                          </div>
                        );
                      })()}

                      {selectedMethod.payment_type === 'binance' && (() => {
                        const details = selectedMethod.payment_details as BinanceDetails;
                        return (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Binance Pay ID:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium">{details.key}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyToClipboard(details.key, 'binance_key')}
                              >
                                {copiedField === 'binance_key' ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })()}

                      {selectedMethod.payment_type === 'otros' && (() => {
                        const details = selectedMethod.payment_details as OtrosDetails;
                        return (
                          <div className="space-y-2">
                            {details.name && (
                              <div>
                                <span className="text-sm text-muted-foreground">Nombre:</span>
                                <p className="font-medium">{details.name}</p>
                              </div>
                            )}
                            {details.description && (
                              <div>
                                <span className="text-sm text-muted-foreground">Descripción:</span>
                                <p className="text-sm">{details.description}</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Payment Date */}
              <div>
                <Label htmlFor="payment-date">
                  Fecha de Pago <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="mt-2"
                />
              </div>

              {/* Reference Number */}
              <div>
                <Label htmlFor="reference-number">
                  Número de Referencia <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="reference-number"
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Ej: 123456789"
                  className="mt-2"
                />
              </div>

              {/* Proof Upload */}
              <div>
                <Label htmlFor="proof-upload">
                  Comprobante de Pago <span className="text-red-500">*</span>
                </Label>
                <div className="mt-2">
                  <input
                    id="proof-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('proof-upload')?.click()}
                    disabled={uploadingProof}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {paymentProofFile ? 'Cambiar imagen' : 'Seleccionar imagen'}
                  </Button>
                  {paymentProofFile && (
                    <div className="mt-2 p-3 border rounded-lg flex items-center justify-between bg-muted/50">
                      <span className="text-sm flex-1 truncate">{paymentProofFile.name}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setPaymentProofFile(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Formatos aceptados: JPG, PNG, JPEG. Tamaño máximo: 5MB
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">
                  Notas Adicionales <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Información adicional sobre el pago..."
                  rows={2}
                  className="mt-2"
                />
              </div>

              {/* Payment Instructions */}
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Proceso de validación:</strong>
                  <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>Tu comprobante será revisado en 24-48 horas</li>
                    <li>Recibirás un email cuando sea aprobado</li>
                    <li>Tu plan se actualizará automáticamente</li>
                  </ul>
                </AlertDescription>
              </Alert>
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
            disabled={requestUpgradeMutation.isPending || uploadingProof}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedPlanId ||
              requestUpgradeMutation.isPending ||
              uploadingProof ||
              !selectedPaymentMethodId ||
              (!paymentProofFile && !referenceNumber)
            }
          >
            {requestUpgradeMutation.isPending || uploadingProof ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadingProof ? 'Subiendo...' : 'Procesando...'}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar Pago
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
