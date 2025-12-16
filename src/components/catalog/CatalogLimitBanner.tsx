import { AlertCircle, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CatalogLimitBannerProps {
  percentage: number;
  currentViews: number;
  limit: number;
  exceeded: boolean;
}

/**
 * Banner discreto que se muestra cuando se alcanza el 80% del límite de vistas
 * Mensaje positivo de éxito con CTA para actualizar plan
 */
export function CatalogLimitBanner({ percentage, currentViews, limit, exceeded }: CatalogLimitBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  // Solo mostrar si está entre 80% y antes de exceder límite base
  const shouldShow = percentage >= 80 && !exceeded && !isDismissed;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">
              ¡Tu catálogo está teniendo mucho éxito! 🎉
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              {currentViews.toLocaleString()} de {limit.toLocaleString()} vistas utilizadas este mes.
              Actualiza tu plan para seguir recibiendo visitas sin límites.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => navigate('/admin/subscription')}
          >
            Ver Planes
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-green-600 hover:text-green-700 hover:bg-green-100"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
