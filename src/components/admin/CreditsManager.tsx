import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Check, ShoppingCart, Upload } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [customCredits, setCustomCredits] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

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

      // Create payment validation request for credits purchase
      const { data, error } = await supabase.from('payment_validations').insert({
        subscription_id: null, // null for credits purchase
        amount: price,
        payment_method: 'pending', // To be filled later
        reference_number: `CREDITS_${creditsAmount}`,
        proof_image_url: proofUrl || null,
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
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al solicitar créditos',
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setSelectedPackage(null);
    setCustomCredits('');
    setProofUrl('');
    setNotes('');
  };

  const handlePackageSelect = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setCustomCredits('');
  };

  const handleCustomCreditsChange = (value: string) => {
    setCustomCredits(value);
    setSelectedPackage(null);
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

              {/* Proof URL */}
              <div>
                <Label htmlFor="credits-proof-url">
                  URL del Comprobante de Pago
                  <span className="text-muted-foreground ml-1">(opcional - puedes subirlo después)</span>
                </Label>
                <Input
                  id="credits-proof-url"
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Upload className="h-3 w-3" />
                  Sube tu comprobante a Google Drive, Dropbox, etc. y pega el enlace aquí
                </p>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="credits-notes">
                  Notas Adicionales
                  <span className="text-muted-foreground ml-1">(opcional)</span>
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
                <AlertDescription className="text-sm space-y-2">
                  <p><strong>Proceso de Compra:</strong></p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Envía tu solicitud de créditos</li>
                    <li>Nuestro equipo te contactará con instrucciones de pago</li>
                    <li>Realiza el pago y sube el comprobante</li>
                    <li>Los créditos se agregarán a tu cuenta tras la validación (24-48 horas)</li>
                  </ol>
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
            disabled={purchaseCreditsMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              purchaseCreditsMutation.isPending ||
              (!selectedPackage && (!customCredits || parseInt(customCredits) <= 0))
            }
          >
            {purchaseCreditsMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Solicitar Créditos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
