import { useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useSubscriptionOverrides } from '@/hooks/useSubscriptionOverrides';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Save, Trash2, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SubscriptionOverridesManagerProps {
  storeId?: string; // Optional - if not provided, uses StoreContext
}

/**
 * Componente para gestionar límites personalizados (overrides) de suscripción
 * Solo accesible para super admins desde el panel de configuración de la tienda
 * Puede usarse desde /admin (usando StoreContext) o desde /platform-admin (con storeId prop)
 */
export function SubscriptionOverridesManager({ storeId: propStoreId }: SubscriptionOverridesManagerProps = {}) {
  const { store } = useStore();
  const storeId = propStoreId || store?.id;
  const { plan, usage } = useSubscription(storeId);
  const {
    override,
    isLoading,
    upsert,
    isUpserting,
    deleteOverride,
    isDeleting,
  } = useSubscriptionOverrides(storeId);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    max_products: '',
    max_categories: '',
    max_orders_per_month: '',
    reason: '',
    notes: '',
  });

  // Sincronizar form data con override cuando carga
  useState(() => {
    if (override) {
      setFormData({
        max_products: override.max_products?.toString() || '',
        max_categories: override.max_categories?.toString() || '',
        max_orders_per_month: override.max_orders_per_month?.toString() || '',
        reason: override.reason || '',
        notes: override.notes || '',
      });
    }
  });

  if (!storeId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No se pudo cargar la información de la tienda</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;

    upsert({
      store_id: storeId,
      max_products: formData.max_products ? parseInt(formData.max_products) : null,
      max_categories: formData.max_categories ? parseInt(formData.max_categories) : null,
      max_orders_per_month: formData.max_orders_per_month ? parseInt(formData.max_orders_per_month) : null,
      reason: formData.reason || null,
      notes: formData.notes || null,
    });
  };

  const handleDelete = () => {
    if (!storeId) return;
    deleteOverride(storeId);
    setShowDeleteDialog(false);
    // Reset form
    setFormData({
      max_products: '',
      max_categories: '',
      max_orders_per_month: '',
      reason: '',
      notes: '',
    });
  };

  const hasOverride = !!override;
  const hasChanges =
    formData.max_products !== (override?.max_products?.toString() || '') ||
    formData.max_categories !== (override?.max_categories?.toString() || '') ||
    formData.max_orders_per_month !== (override?.max_orders_per_month?.toString() || '') ||
    formData.reason !== (override?.reason || '') ||
    formData.notes !== (override?.notes || '');

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Límites Personalizados por Tienda</AlertTitle>
        <AlertDescription>
          Como super admin, puedes establecer límites específicos para esta tienda que sobrescriben los límites de su
          plan. Deja un campo vacío para usar el límite del plan actual.
        </AlertDescription>
      </Alert>

      {/* Current Plan Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Plan Actual: <Badge variant="outline">{plan?.display_name || 'N/A'}</Badge>
          </CardTitle>
          <CardDescription>Límites del plan y uso actual</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Productos</Label>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{usage?.products?.current || 0}</span>
              <span className="text-muted-foreground">/ {usage?.products?.limit || '∞'}</span>
              {usage?.products?.has_override && (
                <Badge variant="secondary" className="text-xs">
                  Custom
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Categorías</Label>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{usage?.categories?.current || 0}</span>
              <span className="text-muted-foreground">/ {usage?.categories?.limit || '∞'}</span>
              {usage?.categories?.has_override && (
                <Badge variant="secondary" className="text-xs">
                  Custom
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-sm text-muted-foreground">Pedidos este mes</Label>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{usage?.orders_this_month?.current || 0}</span>
              <span className="text-muted-foreground">/ {usage?.orders_this_month?.limit || '∞'}</span>
              {usage?.orders_this_month?.has_override && (
                <Badge variant="secondary" className="text-xs">
                  Custom
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Override Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Límites Personalizados
            </CardTitle>
            <CardDescription>
              {hasOverride
                ? 'Esta tienda tiene límites personalizados activos'
                : 'Configura límites específicos para esta tienda'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Limits */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="max_products">
                  Límite de Productos
                  <span className="text-xs text-muted-foreground ml-2">(vacío = usar plan)</span>
                </Label>
                <Input
                  id="max_products"
                  type="number"
                  min="0"
                  placeholder={`Plan: ${plan?.limits?.max_products || 'Ilimitado'}`}
                  value={formData.max_products}
                  onChange={(e) => setFormData({ ...formData, max_products: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Plan actual: {plan?.limits?.max_products || 'Ilimitado'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_categories">
                  Límite de Categorías
                  <span className="text-xs text-muted-foreground ml-2">(vacío = usar plan)</span>
                </Label>
                <Input
                  id="max_categories"
                  type="number"
                  min="0"
                  placeholder={`Plan: ${plan?.limits?.max_categories || 'Ilimitado'}`}
                  value={formData.max_categories}
                  onChange={(e) => setFormData({ ...formData, max_categories: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Plan actual: {plan?.limits?.max_categories || 'Ilimitado'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_orders_per_month">
                  Límite de Pedidos/Mes
                  <span className="text-xs text-muted-foreground ml-2">(vacío = usar plan)</span>
                </Label>
                <Input
                  id="max_orders_per_month"
                  type="number"
                  min="0"
                  placeholder={`Plan: ${plan?.limits?.max_orders_per_month || 'Ilimitado'}`}
                  value={formData.max_orders_per_month}
                  onChange={(e) => setFormData({ ...formData, max_orders_per_month: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Plan actual: {plan?.limits?.max_orders_per_month || 'Ilimitado'}
                </p>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                Razón <span className="text-destructive">*</span>
              </Label>
              <Input
                id="reason"
                placeholder="Por qué se están aplicando estos límites personalizados..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required={hasChanges && !override}
              />
              <p className="text-xs text-muted-foreground">
                Explica por qué esta tienda requiere límites diferentes al plan
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                placeholder="Notas internas para referencia del admin..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Metadata if exists */}
            {override && (
              <div className="pt-4 border-t">
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Creado:</span> {new Date(override.created_at).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Última actualización:</span>{' '}
                    {new Date(override.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={!hasChanges || isUpserting} className="gap-2">
                <Save className="h-4 w-4" />
                {isUpserting ? 'Guardando...' : hasOverride ? 'Actualizar Límites' : 'Aplicar Límites Personalizados'}
              </Button>

              {hasOverride && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar Override
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar límites personalizados?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará los límites personalizados y la tienda volverá a usar los límites de su plan actual
              ({plan?.display_name}). Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
