import { useState } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  CreditCard,
  AlertCircle,
  TrendingUp,
  Clock,
  Upload,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { UpgradePlanModal } from './UpgradePlanModal';
import { RequestModuleModal } from './RequestModuleModal';
import { PaymentProofUpload } from './PaymentProofUpload';
import { CreditsManager } from './CreditsManager';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function SubscriptionManager() {
  const { subscription, plan, usage, isLoading, isTrial, isExpired, needsUpgrade, trialDaysLeft } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showPaymentUpload, setShowPaymentUpload] = useState(false);
  const [showCreditsManager, setShowCreditsManager] = useState(false);

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

  const isActive = subscription.status === 'active';
  const isPendingPayment = subscription.status === 'pending_payment';

  // Calculate usage percentages
  const productUsage = usage?.products?.limit
    ? (usage.products.current / usage.products.limit) * 100
    : 0;

  const categoryUsage = usage?.categories?.limit
    ? (usage.categories.current / usage.categories.limit) * 100
    : 0;

  const orderUsage = usage?.orders_this_month?.limit
    ? (usage.orders_this_month.current / usage.orders_this_month.limit) * 100
    : 0;

  const aiUsage = usage?.ai_credits?.limit
    ? (usage.ai_credits.used / usage.ai_credits.limit) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Status Alerts */}
      {isTrial && trialDaysLeft !== null && trialDaysLeft <= 7 && (
        <Alert variant="default" className="border-orange-500 bg-orange-50">
          <Clock className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">Trial terminando pronto</AlertTitle>
          <AlertDescription className="text-orange-800">
            Tu período de prueba termina en {trialDaysLeft} días. Actualiza tu plan para continuar usando todas las funcionalidades.
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUpgradeModal(true)}
              className="ml-3"
            >
              Actualizar ahora
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isPendingPayment && (
        <Alert variant="default" className="border-blue-500 bg-blue-50">
          <CreditCard className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Pago pendiente de validación</AlertTitle>
          <AlertDescription className="text-blue-800">
            Hemos recibido tu solicitud de pago. Nuestro equipo la revisará en las próximas 24-48 horas.
          </AlertDescription>
        </Alert>
      )}

      {isExpired && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Suscripción vencida</AlertTitle>
          <AlertDescription>
            Tu suscripción ha vencido. Actualiza tu plan para continuar usando la plataforma.
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowUpgradeModal(true)}
              className="ml-3"
            >
              Renovar suscripción
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Estado</TabsTrigger>
          <TabsTrigger value="usage">Uso</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="billing">Facturación</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">Plan {plan.display_name}</CardTitle>
                  <CardDescription className="mt-2">{plan.description || 'Plan de suscripción actual'}</CardDescription>
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
                  {subscription.status === 'suspended' && 'Suspendida'}
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

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setShowUpgradeModal(true)} className="gap-2">
                  <ArrowUpCircle className="h-4 w-4" />
                  {isTrial ? 'Actualizar Plan' : 'Cambiar Plan'}
                </Button>
                <Button onClick={() => setShowPaymentUpload(true)} variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Pagar Suscripción
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Productos</p>
                    <p className="text-2xl font-bold">
                      {usage?.products?.current || 0}
                      <span className="text-sm text-muted-foreground font-normal">
                        {' / '}
                        {usage?.products?.unlimited ? '∞' : usage?.products?.limit || 0}
                      </span>
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Órdenes/mes</p>
                    <p className="text-2xl font-bold">
                      {usage?.orders_this_month?.current || 0}
                      <span className="text-sm text-muted-foreground font-normal">
                        {' / '}
                        {usage?.orders_this_month?.unlimited ? '∞' : usage?.orders_this_month?.limit || 0}
                      </span>
                    </p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Créditos AI</p>
                    <p className="text-2xl font-bold">
                      {usage?.ai_credits?.available || 0}
                      <span className="text-sm text-muted-foreground font-normal">
                        {' disponibles'}
                      </span>
                    </p>
                  </div>
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Uso del Plan</CardTitle>
              <CardDescription>Estadísticas detalladas de uso de tu suscripción</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Products */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 font-medium">
                    <Package className="h-4 w-4" />
                    Productos
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {usage?.products?.current || 0} / {usage?.products?.unlimited ? '∞' : usage?.products?.limit || 0}
                  </span>
                </div>
                {!usage?.products?.unlimited && (
                  <Progress
                    value={productUsage}
                    className={productUsage >= 80 ? 'bg-red-100 [&>div]:bg-red-600' : ''}
                  />
                )}
                {productUsage >= 90 && (
                  <p className="text-xs text-red-600 mt-1">Límite casi alcanzado. Considera actualizar tu plan.</p>
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
                    {usage?.categories?.current || 0} / {usage?.categories?.unlimited ? '∞' : usage?.categories?.limit || 0}
                  </span>
                </div>
                {!usage?.categories?.unlimited && (
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
                    {usage?.orders_this_month?.current || 0} / {usage?.orders_this_month?.unlimited ? '∞' : usage?.orders_this_month?.limit || 0}
                  </span>
                </div>
                {!usage?.orders_this_month?.unlimited && (
                  <Progress
                    value={orderUsage}
                    className={orderUsage >= 80 ? 'bg-red-100 [&>div]:bg-red-600' : ''}
                  />
                )}
              </div>

              {/* AI Credits */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 font-medium">
                    <Sparkles className="h-4 w-4" />
                    Créditos AI
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {usage?.ai_credits?.used || 0} usados / {usage?.ai_credits?.available || 0} disponibles
                  </span>
                </div>
                <Progress
                  value={aiUsage}
                  className={aiUsage >= 80 ? 'bg-red-100 [&>div]:bg-red-600' : ''}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">
                    Límite mensual: {usage?.ai_credits?.limit || 0} créditos
                  </p>
                  <Button
                    size="sm"
                    variant="link"
                    onClick={() => setShowCreditsManager(true)}
                    className="h-auto p-0"
                  >
                    Comprar más créditos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Módulos Adicionales</CardTitle>
              <CardDescription>Expande las funcionalidades de tu tienda con módulos especializados</CardDescription>
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
                      {subscription.enabled_modules?.whatsapp ? (
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
                      Recibe órdenes por WhatsApp y gestiona conversaciones con clientes
                    </p>
                    {isTrial && (
                      <div className="mb-3">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          ✓ Incluido en trial 30 días
                        </Badge>
                      </div>
                    )}
                    <div className="text-sm font-medium mb-3">
                      <DollarSign className="h-4 w-4 inline" />
                      15/mes después del trial
                    </div>
                    {!subscription.enabled_modules?.whatsapp && !isTrial && (
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
                      {subscription.enabled_modules?.delivery ? (
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
                      Sistema completo de gestión de entregas con zonas, tarifas y seguimiento
                    </p>
                    {isTrial && (
                      <div className="mb-3">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          ✓ Incluido en trial 30 días
                        </Badge>
                      </div>
                    )}
                    <div className="text-sm font-medium mb-3">
                      <DollarSign className="h-4 w-4 inline" />
                      20/mes después del trial
                    </div>
                    {!subscription.enabled_modules?.delivery && !isTrial && (
                      <Button size="sm" variant="outline" onClick={() => setShowModuleModal(true)} className="w-full">
                        Solicitar Activación
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {isTrial && (
                <Alert className="border-green-500 bg-green-50">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900">Módulos incluidos durante trial</AlertTitle>
                  <AlertDescription className="text-green-800">
                    Durante tu período de prueba de 30 días, tienes acceso completo a los módulos de WhatsApp y Delivery sin cargo adicional.
                    Después del trial, estos módulos se cobrarán mensualmente si deseas continuar usándolos.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de Facturación</CardTitle>
              <CardDescription>Gestiona tus pagos y comprobantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Próximo Pago</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monto del plan:</span>
                      <span className="font-medium">${plan.price_monthly}/mes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fecha de renovación:</span>
                      <span className="font-medium">
                        {format(new Date(subscription.current_period_end), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${plan.price_monthly}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Acciones Rápidas</h4>
                  <div className="space-y-2">
                    <Button
                      onClick={() => setShowPaymentUpload(true)}
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Pagar Suscripción
                    </Button>
                    <Button
                      onClick={() => setShowCreditsManager(true)}
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Comprar Créditos AI
                    </Button>
                    <Button
                      onClick={() => setShowUpgradeModal(true)}
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Cambiar de Plan
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Métodos de Pago Aceptados</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Transferencia bancaria</li>
                  <li>• PayPal</li>
                  <li>• Depósito bancario</li>
                  <li>• Otros métodos (contacta a soporte)</li>
                </ul>
                <p className="text-xs mt-3 text-muted-foreground">
                  Los comprobantes se validan manualmente en 24-48 horas
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <UpgradePlanModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlanId={subscription.plan_id}
      />

      <RequestModuleModal
        open={showModuleModal}
        onOpenChange={setShowModuleModal}
      />

      <PaymentProofUpload
        open={showPaymentUpload}
        onOpenChange={setShowPaymentUpload}
        subscriptionId={subscription.id}
      />

      <CreditsManager
        open={showCreditsManager}
        onOpenChange={setShowCreditsManager}
      />
    </div>
  );
}
