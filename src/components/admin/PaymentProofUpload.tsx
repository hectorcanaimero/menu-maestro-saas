import { useState } from 'react';
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
import { Upload, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentProofUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
}

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Transferencia Bancaria' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'check', label: 'Cheque' },
  { value: 'crypto', label: 'Criptomonedas' },
  { value: 'other', label: 'Otro' },
];

export function PaymentProofUpload({ open, onOpenChange, subscriptionId }: PaymentProofUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { store } = useStore();

  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Upload payment proof mutation
  const uploadProofMutation = useMutation({
    mutationFn: async () => {
      if (!store?.id || !subscriptionId) {
        throw new Error('Información de tienda no disponible');
      }

      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      if (!proofUrl && !referenceNumber) {
        throw new Error('Debes proporcionar al menos un comprobante (URL) o número de referencia');
      }

      const { data, error } = await supabase.from('payment_validations').insert({
        subscription_id: subscriptionId,
        amount: parseFloat(amount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        proof_image_url: proofUrl || null,
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
    setPaymentMethod('bank_transfer');
    setReferenceNumber('');
    setProofUrl('');
    setNotes('');
  };

  const handleSubmit = () => {
    uploadProofMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subir Comprobante de Pago</DialogTitle>
          <DialogDescription>
            Envía tu comprobante de pago para validación manual. Nuestro equipo lo revisará en 24-48 horas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount */}
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

          {/* Payment Method */}
          <div>
            <Label htmlFor="payment-method">
              Método de Pago <span className="text-red-500">*</span>
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reference Number */}
          <div>
            <Label htmlFor="reference-number">
              Número de Referencia / Transacción
              <span className="text-muted-foreground ml-1">(opcional)</span>
            </Label>
            <Input
              id="reference-number"
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Ej: TXN123456789"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Número de confirmación, ID de transacción, o referencia del pago
            </p>
          </div>

          {/* Proof URL */}
          <div>
            <Label htmlFor="proof-url">
              URL del Comprobante <span className="text-red-500">*</span>
            </Label>
            <Input
              id="proof-url"
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="mt-2"
            />
            <Alert className="mt-2">
              <Upload className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Cómo subir tu comprobante:</strong>
                <ol className="list-decimal ml-4 mt-1 space-y-1">
                  <li>Sube tu comprobante a Google Drive, Dropbox, o similar</li>
                  <li>Asegúrate de que el enlace sea público o de que cualquiera con el enlace pueda ver el archivo</li>
                  <li>Copia el enlace y pégalo aquí</li>
                </ol>
                <a
                  href="https://support.google.com/drive/answer/2494822"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 mt-2"
                >
                  Cómo compartir archivos en Google Drive
                  <ExternalLink className="h-3 w-3" />
                </a>
              </AlertDescription>
            </Alert>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">
              Notas Adicionales
              <span className="text-muted-foreground ml-1">(opcional)</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Información adicional que pueda ayudar en la validación..."
              rows={3}
              className="mt-2"
            />
          </div>

          {/* Information Box */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Proceso de Validación
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>1. Tu comprobante será revisado por nuestro equipo en 24-48 horas</li>
              <li>2. Verificaremos el monto, fecha y método de pago</li>
              <li>3. Te notificaremos por email cuando sea aprobado</li>
              <li>4. Tu suscripción se activará automáticamente tras la aprobación</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={uploadProofMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploadProofMutation.isPending || !amount || !proofUrl}
          >
            {uploadProofMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar Comprobante
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
