import { AlertTriangle, TrendingUp, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface CatalogBlockedOverlayProps {
  currentViews: number;
  limit: number;
  softLimit: number;
  storeName?: string;
}

/**
 * Overlay con blur que se muestra cuando se excede el soft-limit (límite + 100 vistas)
 * Bloquea el acceso al catálogo hasta que se actualice el plan
 */
export function CatalogBlockedOverlay({ currentViews, limit, softLimit, storeName }: CatalogBlockedOverlayProps) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <Card className="max-w-lg mx-4 shadow-2xl border-2">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Límite de Vistas Alcanzado</CardTitle>
            <CardDescription className="text-base mt-2">
              Tu catálogo ha alcanzado el límite de vistas gratuitas
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Vistas este mes:</span>
              <span className="text-lg font-bold">{currentViews.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Límite del plan:</span>
              <span className="text-lg font-semibold">{limit.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Límite extendido:</span>
              <span className="text-lg font-semibold text-yellow-600">{softLimit.toLocaleString()}</span>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">¡Excelentes noticias!</p>
                <p className="text-xs text-green-700 mt-1">
                  Tu catálogo ha recibido {currentViews.toLocaleString()} visitas este mes. Tu negocio está creciendo.
                  Actualiza tu plan para continuar recibiendo clientes.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => navigate('/admin/subscription')}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Ver Planes y Actualizar
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Actualiza ahora para desbloquear vistas ilimitadas y más funciones
            </p>
          </div>

          {/* Contact Info */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              ¿Necesitas ayuda? Contáctanos desde el panel de administración
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
