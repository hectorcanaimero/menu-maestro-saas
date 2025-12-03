import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eraser, Check } from 'lucide-react';

interface SignatureCaptureProps {
  onSave: (signatureDataUrl: string) => void;
  onCancel?: () => void;
}

export function SignatureCapture({ onSave, onCancel }: SignatureCaptureProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    signatureRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (signatureRef.current && !isEmpty) {
      const dataUrl = signatureRef.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Firma del Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-muted rounded-lg overflow-hidden bg-white dark:bg-muted">
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              className: 'w-full h-48 touch-none',
              style: { touchAction: 'none' },
            }}
            backgroundColor="transparent"
            onBegin={handleBegin}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isEmpty}
            className="flex-1"
          >
            <Eraser className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
          )}
          <Button onClick={handleSave} disabled={isEmpty} className="flex-1">
            <Check className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          El cliente debe firmar aquí para confirmar la entrega
        </p>
      </CardContent>
    </Card>
  );
}
