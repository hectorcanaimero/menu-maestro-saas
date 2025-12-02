import { ReactNode, useState, useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock, ArrowUpCircle, Loader2 } from 'lucide-react';
import { UpgradePlanModal } from './UpgradePlanModal';

interface FeatureGuardProps {
  children: ReactNode;
  feature?: 'ai_credits' | 'analytics' | 'promotions' | 'multi_store';
  module?: 'whatsapp' | 'delivery';
  fallback?: ReactNode;
  showUpgradeButton?: boolean;
}

/**
 * FeatureGuard - Componente para bloquear acceso a features/módulos según suscripción
 *
 * @param children - Contenido a mostrar si tiene acceso
 * @param feature - Feature específico del plan a verificar
 * @param module - Módulo adicional a verificar (WhatsApp o Delivery)
 * @param fallback - Componente alternativo a mostrar si no tiene acceso
 * @param showUpgradeButton - Mostrar botón de upgrade en el mensaje de bloqueo
 */
export function FeatureGuard({
  children,
  feature,
  module,
  fallback,
  showUpgradeButton = true,
}: FeatureGuardProps) {
  const { subscription, plan, canAccessModule, canAccessFeature, isLoading } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [blockedReason, setBlockedReason] = useState('');
  const [checking, setChecking] = useState(true);

  // Check access asynchronously
  useEffect(() => {
    const checkAccess = async () => {
      setChecking(true);

      if (module) {
        const access = await canAccessModule(module);
        setHasAccess(access);
        setBlockedReason(`El módulo ${module === 'whatsapp' ? 'WhatsApp' : 'Delivery'} no está habilitado en tu plan`);
      } else if (feature) {
        const access = await canAccessFeature(feature);
        setHasAccess(access);
        setBlockedReason(`Esta funcionalidad no está disponible en tu plan ${plan?.display_name || 'actual'}`);
      } else {
        // No feature or module specified, grant access
        setHasAccess(true);
      }

      setChecking(false);
    };

    checkAccess();
  }, [module, feature, canAccessModule, canAccessFeature, plan]);

  // Loading state
  if (isLoading || checking) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Grant access
  if (hasAccess) {
    return <>{children}</>;
  }

  // Custom fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default blocked UI
  return (
    <>
      <Alert className="border-l-4 border-l-orange-500">
        <Lock className="h-4 w-4" />
        <AlertTitle>Funcionalidad no disponible</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p>{blockedReason}</p>

          {feature && (
            <div className="text-sm">
              <p className="font-medium mb-1">Para acceder a esta funcionalidad:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Actualiza tu plan a uno superior</li>
                <li>O contacta con soporte para más información</li>
              </ul>
            </div>
          )}

          {module && (
            <div className="text-sm">
              <p className="font-medium mb-1">Para habilitar este módulo:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Solicita la activación del módulo {module === 'whatsapp' ? 'WhatsApp' : 'Delivery'}</li>
                <li>El costo adicional es de ${module === 'whatsapp' ? '15' : '20'}/mes</li>
                <li>La activación toma 24-48 horas</li>
              </ul>
            </div>
          )}

          {showUpgradeButton && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="gap-2"
              >
                <ArrowUpCircle className="h-4 w-4" />
                {module ? 'Solicitar Módulo' : 'Ver Planes'}
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>

      <UpgradePlanModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlanId={subscription?.plan_id}
      />
    </>
  );
}

/**
 * Hook helper para usar FeatureGuard programáticamente
 */
export function useFeatureGuard() {
  const { hasModuleAccess, hasFeatureAccess, canAccessFeature, canAccessModule } = useSubscription();

  return {
    hasModuleAccess,
    hasFeatureAccess,
    canAccessFeature,
    canAccessModule,
  };
}
