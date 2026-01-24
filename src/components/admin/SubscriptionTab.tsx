import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle,
  XCircle,
  ArrowUpCircle,
  Calendar,
  DollarSign,
  Package,
  FolderTree,
  ShoppingCart,
  Sparkles,
  MessageSquare,
  Truck,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { UpgradePlanModal } from './UpgradePlanModal';
import { RequestModuleModal } from './RequestModuleModal';

export function SubscriptionTab() {
  const { subscription, plan, usage, isLoading } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!subscription || !plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Suscripción no encontrada</CardTitle>
          <CardDescription>No se pudo cargar la información de tu suscripción</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isTrial = subscription.status === 'trial';
  const isActive = subscription.status === 'active';

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

  const aiUsage = plan.limits.max_ai_credits_per_month === 0
    ? 0
    : ((usage?.ai_credits_used_this_month || 0) / plan.limits.max_ai_credits_per_month) * 100;

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Plan {plan.display_name}</CardTitle>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">${plan.price_monthly}</div>
              <div className="text-sm text-muted-foreground">/mes</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge
              variant={isActive ? 'default' : isTrial ? 'secondary' : 'outline'}
              className={isActive ? 'bg-green-600' : ''}
            >
              {subscription.status === 'trial' && 'Trial'}
              {subscription.status === 'active' && 'Activa'}
              {subscription.status === 'pending_payment' && 'Pago Pendiente'}
              {subscription.status === 'past_due' && 'Vencida'}
              {subscription.status === 'cancelled' && 'Cancelada'}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Período actual</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(subscription.current_period_start), 'dd MMM', { locale: es })} -{' '}
                {format(new Date(subscription.current_period_end), 'dd MMM yyyy', { locale: es })}
              </p>
            </div>
            {isTrial && subscription.trial_ends_at && (
              <div>
                <p className="text-muted-foreground mb-1">Trial termina</p>
                <p className="font-medium text-orange-600">
                  {format(new Date(subscription.trial_ends_at), 'dd MMM yyyy', { locale: es })}
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <Button onClick={() => setShowUpgradeModal(true)} className="gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              {isTrial ? 'Actualizar Plan' : 'Cambiar Plan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Uso del Plan</CardTitle>
          <CardDescription>Estadísticas de uso de tu suscripción actual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 font-medium">
                <Package className="h-4 w-4" />
                Productos
              </span>
              <span className="text-sm text-muted-foreground">
                {usage?.products || 0} / {plan.limits.max_products === -1 ? '∞' : plan.limits.max_products}
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
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 font-medium">
                <FolderTree className="h-4 w-4" />
                Categorías
              </span>
              <span className="text-sm text-muted-foreground">
                {usage?.categories || 0} / {plan.limits.max_categories === -1 ? '∞' : plan.limits.max_categories}
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
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 font-medium">
                <ShoppingCart className="h-4 w-4" />
                Órdenes este mes
              </span>
              <span className="text-sm text-muted-foreground">
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

          {/* AI Credits */}
          {plan.limits.max_ai_credits_per_month > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 font-medium">
                  <Sparkles className="h-4 w-4" />
                  Créditos AI este mes
                </span>
                <span className="text-sm text-muted-foreground">
                  {usage?.ai_credits_used_this_month || 0} / {plan.limits.max_ai_credits_per_month}
                </span>
              </div>
              <Progress
                value={aiUsage}
                className={aiUsage >= 80 ? 'bg-red-100 [&>div]:bg-red-600' : ''}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modules */}
      <Card>
        <CardHeader>
          <CardTitle>Módulos Adicionales</CardTitle>
          <CardDescription>Expande las funcionalidades de tu tienda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* WhatsApp Module */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">WhatsApp</h3>
                  </div>
                  {subscription.whatsapp_enabled ? (
                    <Badge className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactivo
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Recibe órdenes por WhatsApp y gestiona conversaciones
                </p>
                <div className="text-sm font-medium mb-3">
                  <DollarSign className="h-4 w-4 inline" />
                  15/mes
                </div>
                {!subscription.whatsapp_enabled && (
                  <Button size="sm" variant="outline" onClick={() => setShowModuleModal(true)} className="w-full">
                    Solicitar Activación
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Delivery Module */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Delivery</h3>
                  </div>
                  {subscription.delivery_enabled ? (
                    <Badge className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactivo
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Gestiona entregas con zonas, tarifas y seguimiento
                </p>
                <div className="text-sm font-medium mb-3">
                  <DollarSign className="h-4 w-4 inline" />
                  20/mes
                </div>
                {!subscription.delivery_enabled && (
                  <Button size="sm" variant="outline" onClick={() => setShowModuleModal(true)} className="w-full">
                    Solicitar Activación
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <UpgradePlanModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlanId={subscription.plan_id}
      />

      <RequestModuleModal open={showModuleModal} onOpenChange={setShowModuleModal} />
    </div>
  );
}
