import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface OrderLimitOverlayProps {
  currentOrders: number;
  limit: number;
  storeName?: string;
}

export function OrderLimitOverlay({ currentOrders, limit, storeName }: OrderLimitOverlayProps) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Alert className="max-w-md border-destructive">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <AlertTitle className="text-lg font-semibold">Límite de Pedidos Alcanzado</AlertTitle>
        <AlertDescription className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Has alcanzado el límite de pedidos mensuales de tu plan actual.
            </p>
            <div className="bg-muted p-3 rounded-md">
              <div className="flex justify-between text-sm">
                <span>Pedidos este mes:</span>
                <span className="font-semibold">{currentOrders}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Límite del plan:</span>
                <span className="font-semibold">{limit}</span>
              </div>
            </div>
            <p className="text-xs">
              Para seguir recibiendo pedidos, actualiza tu plan a uno superior.
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/subscription')}
            className="w-full"
            size="lg"
          >
            Actualizar Plan
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
