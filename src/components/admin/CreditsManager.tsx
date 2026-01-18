import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Check, ShoppingCart, Upload, CheckCircle, X, Copy } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import type {
  PaymentMethod,
  PagoMovilDetails,
  ZelleDetails,
  BinanceDetails,
  OtrosDetails,
} from '@/types/payment-methods';

interface CreditsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreditPackage {
  credits: number;
  price: number;
  popular?: boolean;
  bonus?: number;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { credits: 10, price: 5 },
  { credits: 25, price: 10, bonus: 5 },
  { credits: 50, price: 18, popular: true, bonus: 10 },
  { credits: 100, price: 30, bonus: 25 },
  { credits: 250, price: 65, bonus: 75 },
];

export function CreditsManager({ open, onOpenChange }: CreditsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { store } = useStore();

  // Package selection states
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [customCredits, setCustomCredits] = useState<string>('');

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

  // Get current AI credits
  const { data: currentCredits } = useQuery({
    queryKey: ['ai-credits', store?.id],
    queryFn: async () => {
      if (!store?.id) return null;

      const { data, error } = await supabase
        .from('store_ai_credits')
        .select('*')
        .eq('store_id', store.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!store?.id && open,
  });

  // Purchase credits mutation
  const purchaseCreditsMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id) {
        throw new Error('Tienda no encontrada');
      }

      const creditsAmount = selectedPackage ? selectedPackage.credits : parseInt(customCredits);
      const price = selectedPackage ? selectedPackage.price : parseFloat(customCredits) * 0.4; // $0.40 per credit for custom

      if (!creditsAmount || creditsAmount <= 0) {
        throw new Error('Selecciona un paquete de créditos o ingresa una cantidad válida');
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
        const fileName = `credits-${store.id}-${Date.now()}.${fileExt}`;

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

      // Create payment validation request for credits purchase
      const { data, error } = await supabase.from('payment_validations').insert({
        store_id: store.id,
        subscription_id: null, // null para compra de créditos (no es renovación de suscripción)
        amount: price,
        payment_date: paymentDate,
        payment_method: selectedMethod?.name || 'N/A',
        reference_number: referenceNumber || `CREDITS_${creditsAmount}`,
        proof_image_url: paymentProofUrl || null,
        status: 'pending',
        validation_notes: `Compra de ${creditsAmount} créditos AI${selectedPackage?.bonus ? ` (+ ${selectedPackage.bonus} bonus)` : ''}\n\n${notes || ''}`,
      }).select().single();

      if (error) throw error;
      return { data, creditsAmount };
    },
    onSuccess: ({ creditsAmount }) => {
      toast({
        title: 'Solicitud enviada',
        description: `Tu solicitud de compra de ${creditsAmount} créditos AI está siendo procesada. Te notificaremos cuando sea aprobada.`,
      });
      queryClient.invalidateQueries({ queryKey: ['ai-credits'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['payment-validations'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error al solicitar créditos',
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    },
  });

  const resetForm = () => {
    setSelectedPackage(null);
    setCustomCredits('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setSelectedPaymentMethodId('');
    setReferenceNumber('');
    setPaymentProofFile(null);
    setNotes('');
    setCopiedField(null);
  };

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setCustomCredits('');
  };

  const handleCustomCreditsChange = (value: string) => {
    setCustomCredits(value);
    setSelectedPackage(null);
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
    purchaseCreditsMutation.mutate();
  };

  const getTotalCredits = () => {
    if (selectedPackage) {
      return selectedPackage.credits + (selectedPackage.bonus || 0);
    }
    return parseInt(customCredits) || 0;
  };

  const getPrice = () => {
    if (selectedPackage) {
      return selectedPackage.price;
    }
    const credits = parseInt(customCredits);
    return credits ? (credits * 0.4).toFixed(2) : '0.00';
  };

  const availableCredits = (currentCredits?.monthly_credits || 0) + (currentCredits?.extra_credits || 0);
  const usedCredits = currentCredits?.credits_used_this_month || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Comprar Créditos AI
          </DialogTitle>
          <DialogDescription>
            Los créditos AI te permiten mejorar las imágenes de tus productos con inteligencia artificial
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Credits Status */}
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Créditos Actuales</AlertTitle>
            <AlertDescription>
              Tienes <strong>{availableCredits - usedCredits}</strong> créditos disponibles
              {currentCredits && (
                <span className="text-muted-foreground">
                  {' '}(Usados este mes: {usedCredits} / {availableCredits})
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Credit Packages */}
          <div>
            <Label className="text-base mb-3 block">Paquetes de Créditos</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CREDIT_PACKAGES.map((pkg) => (
                <div
                  key={pkg.credits}
                  onClick={() => handlePackageSelect(pkg)}
                  className={`
                    relative p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${selectedPackage?.credits === pkg.credits ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/50'}
                    ${pkg.popular ? 'ring-2 ring-yellow-400' : ''}
                  `}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-yellow-500">
                      Más Popular
                    </Badge>
                  )}

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      <span className="text-2xl font-bold">{pkg.credits}</span>
                    </div>

                    {pkg.bonus && (
                      <Badge variant="secondary" className="mb-2 bg-green-100 text-green-800">
                        + {pkg.bonus} bonus
                      </Badge>
                    )}

                    <div className="text-lg font-semibold text-primary">${pkg.price}</div>
                    <div className="text-xs text-muted-foreground">
                      ${(pkg.price / (pkg.credits + (pkg.bonus || 0))).toFixed(2)}/crédito
                    </div>
                  </div>

                  {selectedPackage?.credits === pkg.credits && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O</span>
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <Label htmlFor="custom-credits">Cantidad Personalizada</Label>
            <Input
              id="custom-credits"
              type="number"
              min="1"
              step="1"
              value={customCredits}
              onChange={(e) => handleCustomCreditsChange(e.target.value)}
              placeholder="Ej: 75 créditos"
              className="mt-2"
            />
            {customCredits && parseInt(customCredits) > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Precio: ${getPrice()} USD (${0.4}/crédito)
              </p>
            )}
          </div>

          {(selectedPackage || (customCredits && parseInt(customCredits) > 0)) && (
            <>
              <Separator className="my-4" />

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
                <Label htmlFor="credits-notes">
                  Notas Adicionales <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  id="credits-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Información adicional sobre el pago..."
                  rows={2}
                  className="mt-2"
                />
              </div>

              {/* Summary */}
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Resumen de Compra
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Créditos base:</span>
                    <span className="font-medium">
                      {selectedPackage ? selectedPackage.credits : customCredits}
                    </span>
                  </div>
                  {selectedPackage?.bonus && (
                    <div className="flex justify-between text-green-700">
                      <span>Créditos bonus:</span>
                      <span className="font-medium">+{selectedPackage.bonus}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total créditos:</span>
                    <span className="text-primary">{getTotalCredits()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base">
                    <span>Precio:</span>
                    <span className="text-primary">${getPrice()} USD</span>
                  </div>
                </div>
              </div>

              {/* Payment Instructions */}
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Proceso de validación:</strong>
                  <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>Tu comprobante será revisado en 24-48 horas</li>
                    <li>Recibirás un email cuando sea aprobado</li>
                    <li>Los créditos se agregarán automáticamente a tu cuenta</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Los créditos adicionales no expiran y se acumulan a tu saldo actual
                  </p>
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
            disabled={purchaseCreditsMutation.isPending || uploadingProof}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              purchaseCreditsMutation.isPending ||
              uploadingProof ||
              (!selectedPackage && (!customCredits || parseInt(customCredits) <= 0)) ||
              !selectedPaymentMethodId ||
              (!paymentProofFile && !referenceNumber)
            }
          >
            {purchaseCreditsMutation.isPending || uploadingProof ? (
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
