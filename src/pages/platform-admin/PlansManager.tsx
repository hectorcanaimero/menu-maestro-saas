/**
 * PlansManager Page
 *
 * Complete subscription plans management interface
 * Accessible only by platform super admins
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Edit, Copy, Archive, ArchiveRestore, CheckCircle, MoreVertical, Package } from 'lucide-react';
import { usePlans, Plan, CreatePlanInput, UpdatePlanInput } from '@/hooks/usePlans';
import { PlanFormDialog } from '@/components/admin/PlanFormDialog';
import { getFeatureByKey } from '@/lib/planFeatures';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function PlansManager() {
  // State
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [archivingPlan, setArchivingPlan] = useState<Plan | null>(null);
  const [restoringPlan, setRestoringPlan] = useState<Plan | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);

  // Hook
  const {
    plans,
    isLoading,
    createPlan,
    createPlanAsync,
    isCreating,
    updatePlan,
    updatePlanAsync,
    isUpdating,
    toggleActive,
    archivePlan,
    isArchiving,
    restorePlan,
    isRestoring,
    duplicatePlan,
    isDuplicating,
  } = usePlans(includeArchived);

  // Handlers
  const handleCreatePlan = async (data: CreatePlanInput) => {
    await createPlanAsync(data);
    setShowCreateDialog(false);
  };

  const handleUpdatePlan = async (data: { planId: string; updates: UpdatePlanInput }) => {
    try {
      await updatePlanAsync(data);
      setEditingPlan(null);
    } catch (error) {
      // Error is already handled by the mutation's onError
    }
  };

  const handleArchivePlan = () => {
    if (archivingPlan) {
      archivePlan(archivingPlan.id);
      setArchivingPlan(null);
    }
  };

  const handleRestorePlan = () => {
    if (restoringPlan) {
      restorePlan(restoringPlan.id);
      setRestoringPlan(null);
    }
  };

  // Filter plans
  const activePlans = plans?.filter((p) => !p.is_archived) || [];
  const archivedPlans = plans?.filter((p) => p.is_archived) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Planes</h1>
          <p className="text-muted-foreground mt-2">
            Administra los planes de suscripción disponibles (solo super admin)
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Crear Nuevo Plan
        </Button>
      </div>

      {/* Show Archived Toggle */}
      {archivedPlans.length > 0 && (
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
          <Switch checked={includeArchived} onCheckedChange={setIncludeArchived} id="show-archived" />
          <label htmlFor="show-archived" className="text-sm cursor-pointer">
            Mostrar planes archivados ({archivedPlans.length})
          </label>
        </div>
      )}

      {/* Active Plans Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Planes Activos</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {activePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={() => setEditingPlan(plan)}
              onToggleActive={() => toggleActive({ planId: plan.id, isActive: !plan.is_active })}
              onDuplicate={() => duplicatePlan(plan.id)}
              onArchive={() => setArchivingPlan(plan)}
              isDuplicating={isDuplicating}
            />
          ))}
        </div>
        {activePlans.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No hay planes activos.
                <br />
                Crea un nuevo plan para empezar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Archived Plans Grid */}
      {includeArchived && archivedPlans.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Planes Archivados</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {archivedPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={() => setEditingPlan(plan)}
                onRestore={() => setRestoringPlan(plan)}
                isArchived
              />
            ))}
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <PlanFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreatePlan}
        isSubmitting={isCreating}
      />

      {/* Edit Dialog */}
      <PlanFormDialog
        open={!!editingPlan}
        onOpenChange={(open) => !open && setEditingPlan(null)}
        plan={editingPlan}
        onSubmit={handleUpdatePlan}
        isSubmitting={isUpdating}
      />

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!archivingPlan} onOpenChange={(open) => !open && setArchivingPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Archivar plan "{archivingPlan?.display_name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              El plan será archivado y no estará disponible para nuevas suscripciones. Las suscripciones existentes
              seguirán funcionando normalmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchivePlan} disabled={isArchiving}>
              {isArchiving ? 'Archivando...' : 'Archivar Plan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoringPlan} onOpenChange={(open) => !open && setRestoringPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restaurar plan "{restoringPlan?.display_name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              El plan será restaurado y estará disponible para nuevas suscripciones. Recuerda activarlo si deseas que
              sea visible inmediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestorePlan} disabled={isRestoring}>
              {isRestoring ? 'Restaurando...' : 'Restaurar Plan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// PLAN CARD COMPONENT
// ============================================================================

interface PlanCardProps {
  plan: Plan;
  onEdit: () => void;
  onToggleActive?: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  isArchived?: boolean;
  isDuplicating?: boolean;
}

function PlanCard({
  plan,
  onEdit,
  onToggleActive,
  onDuplicate,
  onArchive,
  onRestore,
  isArchived = false,
  isDuplicating = false,
}: PlanCardProps) {
  return (
    <Card className={`${plan.name === 'trial' ? 'border-blue-500' : ''} ${isArchived ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>{plan.display_name}</CardTitle>
              {isArchived && (
                <Badge variant="outline" className="border-orange-500 text-orange-700">
                  Archivado
                </Badge>
              )}
            </div>
            {plan.name === 'trial' && plan.trial_duration_days > 0 && (
              <Badge variant="outline" className="mt-2 border-blue-500 text-blue-700">
                {plan.trial_duration_days} días de prueba
              </Badge>
            )}
            {!isArchived && (
              <div className="flex items-center gap-2 mt-2">
                <Switch checked={plan.is_active} onCheckedChange={onToggleActive} id={`active-${plan.id}`} />
                <label htmlFor={`active-${plan.id}`} className="text-xs text-muted-foreground">
                  {plan.is_active ? 'Activo' : 'Inactivo'}
                </label>
              </div>
            )}
          </div>
          <div className="flex items-start gap-2">
            <div className="text-right">
              <div className="text-2xl font-bold">${plan.price_monthly}</div>
              <div className="text-xs text-muted-foreground">/mes</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                {!isArchived && (
                  <>
                    <DropdownMenuItem onClick={onDuplicate} disabled={isDuplicating}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onArchive} className="text-destructive">
                      <Archive className="h-4 w-4 mr-2" />
                      Archivar
                    </DropdownMenuItem>
                  </>
                )}
                {isArchived && onRestore && (
                  <DropdownMenuItem onClick={onRestore}>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Restaurar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardDescription className="mt-2">{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Limits */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Productos:</span>
            <span className="font-medium">
              {plan.limits.max_products === -1 ? 'Ilimitado' : plan.limits.max_products}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Categorías:</span>
            <span className="font-medium">
              {plan.limits.max_categories === -1 ? 'Ilimitado' : plan.limits.max_categories}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Órdenes/mes:</span>
            <span className="font-medium">
              {plan.limits.max_orders_per_month === -1 ? 'Ilimitado' : plan.limits.max_orders_per_month}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Créditos AI/mes:</span>
            <span className="font-medium">{plan.limits.max_ai_credits_per_month}</span>
          </div>
        </div>

        {/* Modules */}
        {(plan.modules.whatsapp_monthly !== undefined || plan.modules.delivery_monthly !== undefined) && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">Módulos:</p>
            {plan.modules.whatsapp_monthly !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">WhatsApp:</span>
                <span className="font-medium">
                  {plan.modules.whatsapp_monthly === 0 ? 'Incluido' : `+$${plan.modules.whatsapp_monthly}/mes`}
                </span>
              </div>
            )}
            {plan.modules.delivery_monthly !== undefined && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Delivery:</span>
                <span className="font-medium">
                  {plan.modules.delivery_monthly === 0 ? 'Incluido' : `+$${plan.modules.delivery_monthly}/mes`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Features */}
        {plan.features && plan.features.length > 0 && (
          <div className="space-y-1 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Características:</p>
            {plan.features.slice(0, 3).map((featureKey, idx) => {
              const feature = getFeatureByKey(featureKey);
              return (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{feature?.label || featureKey}</span>
                </div>
              );
            })}
            {plan.features.length > 3 && (
              <p className="text-xs text-muted-foreground">+{plan.features.length - 3} características más</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PlansManager;
