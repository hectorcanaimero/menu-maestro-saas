import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle, X, Copy, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import type {
  PaymentMethod,
  PagoMovilDetails,
  ZelleDetails,
  BinanceDetails,
  OtrosDetails,
} from '@/types/payment-methods';
import {
  formatPagoMovilCopyText,
  formatZelleCopyText,
  formatBinanceCopyText,
  formatOtrosCopyText,
} from '@/types/payment-methods';

interface PaymentProofUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
}

export function PaymentProofUpload({ open, onOpenChange, subscriptionId }: PaymentProofUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState<string>('');
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
      } catch (error: any) {
        console.error('Error loading payment methods:', error);
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

  // Upload payment proof mutation
  const uploadProofMutation = useMutation({
    mutationFn: async () => {
      if (!subscriptionId) {
        throw new Error('ID de suscripción no disponible');
      }

      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('El monto debe ser mayor a 0');
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
        const fileName = `${subscriptionId}-${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProofFile);

        if (uploadError) {
          console.error('Error uploading payment proof:', uploadError);
          throw new Error('Error al subir el comprobante de pago');
        }

        const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(uploadData.path);
        paymentProofUrl = urlData.publicUrl;
        setUploadingProof(false);
      }

      // Get selected payment method name
      const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethodId);

      const { data, error } = await supabase.from('payment_validations').insert({
        subscription_id: subscriptionId,
        amount: parseFloat(amount),
        payment_date: paymentDate,
        payment_method: selectedMethod?.name || 'N/A',
        reference_number: referenceNumber || null,
        proof_image_url: paymentProofUrl || null,
        status: 'pending',
        validation_notes: notes || null,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Comprobante enviado',
        description: 'Tu comprobante de pago ha sido enviado para validación. Te notificaremos cuando sea aprobado.',
      });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['payment-validations'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al enviar comprobante',
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setAmount('');
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

  const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethodId);

  const handleSubmit = () => {
    uploadProofMutation.mutate();
  };

  if (loadingMethods) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pagar Suscripción</DialogTitle>
          <DialogDescription>
            Selecciona un método de pago y envía tu comprobante para validación
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Method Selection */}
          <div>
            <Label className="text-base font-semibold">
              Método de Pago <span className="text-red-500">*</span>
            </Label>
            {paymentMethods.length === 0 ? (
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
          {selectedMethod && selectedMethod.payment_details && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-sm">Datos para realizar el pago:</h4>

                {selectedMethod.payment_type === 'pago_movil' && (
                  <div className="space-y-2">
                    {(() => {
                      const details = selectedMethod.payment_details as PagoMovilDetails;
                      return (
                        <>
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
                        </>
                      );
                    })()}
                  </div>
                )}

                {selectedMethod.payment_type === 'zelle' && (
                  <div className="space-y-2">
                    {(() => {
                      const details = selectedMethod.payment_details as ZelleDetails;
                      return (
                        <>
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
                        </>
                      );
                    })()}
                  </div>
                )}

                {selectedMethod.payment_type === 'binance' && (
                  <div className="space-y-2">
                    {(() => {
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
                  </div>
                )}

                {selectedMethod.payment_type === 'otros' && (
                  <div className="space-y-2">
                    {(() => {
                      const details = selectedMethod.payment_details as OtrosDetails;
                      return (
                        <>
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
                        </>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">
                Monto Pagado (USD) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="29.00"
                className="mt-2"
              />
            </div>
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPaymentProofFile(null)}
                  >
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

          {/* Information */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Proceso de validación:</strong>
              <ul className="list-disc ml-4 mt-1 space-y-1">
                <li>Tu comprobante será revisado en 24-48 horas</li>
                <li>Recibirás un email cuando sea aprobado</li>
                <li>Tu suscripción se activará automáticamente</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={uploadProofMutation.isPending || uploadingProof}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              uploadProofMutation.isPending ||
              uploadingProof ||
              !amount ||
              !selectedPaymentMethodId ||
              (!paymentProofFile && !referenceNumber)
            }
          >
            {uploadProofMutation.isPending || uploadingProof ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadingProof ? 'Subiendo...' : 'Enviando...'}
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
