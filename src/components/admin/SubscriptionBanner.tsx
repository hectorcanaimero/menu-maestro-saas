import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpCircle,
  X,
  TrendingUp,
  Package,
  FolderTree,
  ShoppingCart,
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { UpgradePlanModal } from './UpgradePlanModal';

interface SubscriptionBannerProps {
  showUsageStats?: boolean;
  dismissible?: boolean;
}

export function SubscriptionBanner({ showUsageStats = true, dismissible = false }: SubscriptionBannerProps) {
  const { subscription, plan, usage, isLoading } = useSubscription();
  const [dismissed, setDismissed] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (isLoading || !subscription || !plan || dismissed) {
    return null;
  }

  const isTrial = subscription.status === 'trial';
  const isPendingPayment = subscription.status === 'pending_payment';
  const isPastDue = subscription.status === 'past_due';
  const isActive = subscription.status === 'active';

  const daysRemaining = subscription.trial_ends_at
    ? differenceInDays(new Date(subscription.trial_ends_at), new Date())
    : null;

  const showTrialWarning = isTrial && daysRemaining !== null && daysRemaining <= 7;
  const showPendingPayment = isPendingPayment;
  const showPastDue = isPastDue;

  // Calculate usage percentages
  const productUsage = plan.limits.max_products === -1
    ? 0
    : ((usage?.products || 0) / plan.limits.max_products) * 100;

  const categoryUsage = plan.limits.max_categories === -1
    ? 0
    : ((usage?.categories || 0) / plan.limits.max_categories) * 100;

  const orderUsage = plan.limits.max_orders_per_month === -1
    ? 0
    : ((usage?.orders_this_month || 0) / plan.limits.max_orders_per_month) * 100;

  const showWarning = productUsage >= 80 || categoryUsage >= 80 || orderUsage >= 80;

  // Don't show banner if everything is fine and no warnings
  if (isActive && !showWarning && !showUsageStats) {
    return null;
  }

  return (
    <>
      {/* Trial Warning */}
      {showTrialWarning && (
        <Alert className="border-l-4 border-l-orange-500 mb-4">
          {dismissible && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Clock className="h-4 w-4" />
          <AlertTitle>Trial por vencer</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>
              Tu período de prueba termina{' '}
              <strong>
                {subscription.trial_ends_at && format(new Date(subscription.trial_ends_at), 'dd MMMM yyyy', { locale: es })}
              </strong>{' '}
              ({daysRemaining} {daysRemaining === 1 ? 'día' : 'días'} restantes)
            </p>
            <Button onClick={() => setShowUpgradeModal(true)} className="gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              Actualizar Plan
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Payment */}
      {showPendingPayment && (
        <Alert className="border-l-4 border-l-yellow-500 mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pago pendiente de validación</AlertTitle>
          <AlertDescription className="mt-2">
            <p>
              Tu solicitud de upgrade está siendo procesada. Recibirás una notificación cuando sea aprobada (24-48 horas).
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Past Due */}
      {showPastDue && (
        <Alert className="border-l-4 border-l-red-500 mb-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Suscripción vencida</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>Tu suscripción ha vencido. Renueva tu plan para seguir disfrutando de todas las funcionalidades.</p>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              variant="destructive"
              className="gap-2"
            >
              <ArrowUpCircle className="h-4 w-4" />
              Renovar Suscripción
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Stats */}
      {showUsageStats && isActive && (
        <Alert className={`border-l-4 ${showWarning ? 'border-l-orange-500' : 'border-l-green-500'} mb-4`}>
          {dismissible && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {showWarning ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertTitle className="flex items-center justify-between">
            <span>Plan {plan.display_name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUpgradeModal(true)}
              className="gap-1"
            >
              <TrendingUp className="h-3 w-3" />
              Ver planes
            </Button>
          </AlertTitle>
          <AlertDescription className="mt-3 space-y-3">
            <div className="grid gap-3">
              {/* Products */}
              <div>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Productos
                  </span>
                  <span className="font-medium">
                    {usage?.products || 0} /{' '}
                    {plan.limits.max_products === -1 ? '∞' : plan.limits.max_products}
                  </span>
                </div>
                {plan.limits.max_products !== -1 && (
                  <Progress
                    value={productUsage}
                    className={productUsage >= 80 ? 'bg-red-100 [&>div]:bg-red-600' : ''}
                  />
                )}
              </div>

              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="flex items-center gap-1">
                    <FolderTree className="h-3 w-3" />
                    Categorías
                  </span>
                  <span className="font-medium">
                    {usage?.categories || 0} /{' '}
                    {plan.limits.max_categories === -1 ? '∞' : plan.limits.max_categories}
                  </span>
                </div>
                {plan.limits.max_categories !== -1 && (
                  <Progress
                    value={categoryUsage}
                    className={categoryUsage >= 80 ? 'bg-red-100 [&>div]:bg-red-600' : ''}
                  />
                )}
              </div>

              {/* Orders */}
              <div>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="flex items-center gap-1">
                    <ShoppingCart className="h-3 w-3" />
                    Órdenes este mes
                  </span>
                  <span className="font-medium">
                    {usage?.orders_this_month || 0} /{' '}
                    {plan.limits.max_orders_per_month === -1 ? '∞' : plan.limits.max_orders_per_month}
                  </span>
                </div>
                {plan.limits.max_orders_per_month !== -1 && (
                  <Progress
                    value={orderUsage}
                    className={orderUsage >= 80 ? 'bg-red-100 [&>div]:bg-red-600' : ''}
                  />
                )}
              </div>
            </div>

            {showWarning && (
              <p className="text-sm text-orange-600 font-medium">
                ⚠️ Estás cerca del límite de tu plan. Considera actualizar para evitar interrupciones.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <UpgradePlanModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlanId={subscription.plan_id}
      />
    </>
  );
}
