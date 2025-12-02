import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Package, DollarSign, Edit, CheckCircle } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  limits: {
    max_products: number;
    max_categories: number;
    max_orders_per_month: number;
    max_ai_credits_per_month: number;
  };
  features: string[];
  sort_order: number;
  is_active: boolean;
}

function PlansManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    price_monthly: 0,
    description: '',
  });

  // Fetch plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data as Plan[];
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, updates }: { planId: string; updates: Partial<Plan> }) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update(updates)
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Plan actualizado',
        description: 'Los cambios han sido guardados correctamente',
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setShowEditDialog(false);
      setEditingPlan(null);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar plan',
        description: error.message,
      });
    },
  });

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      price_monthly: plan.price_monthly,
      description: plan.description,
    });
    setShowEditDialog(true);
  };

  const handleSave = () => {
    if (!editingPlan) return;

    updatePlanMutation.mutate({
      planId: editingPlan.id,
      updates: formData,
    });
  };

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
      <div>
        <h1 className="text-3xl font-bold">Gestión de Planes</h1>
        <p className="text-muted-foreground mt-2">
          Administra los planes de suscripción disponibles (solo super admin)
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans?.map((plan) => (
          <Card key={plan.id} className={plan.name === 'trial' ? 'border-blue-500' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{plan.display_name}</CardTitle>
                  {plan.name === 'trial' && (
                    <Badge variant="outline" className="mt-2 border-blue-500 text-blue-700">
                      Incluye 30 días de prueba
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">${plan.price_monthly}</div>
                  <div className="text-xs text-muted-foreground">/mes</div>
                </div>
              </div>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              {plan.features && plan.features.length > 0 && (
                <div className="space-y-1 pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Características:</p>
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{plan.features.length - 3} características más
                    </p>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(plan)}
                className="w-full gap-2"
              >
                <Edit className="h-3 w-3" />
                Editar Plan
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-sm">Nota Importante</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            Por seguridad, solo se pueden editar los <strong>precios</strong> y{' '}
            <strong>descripciones</strong> de los planes.
          </p>
          <p className="text-muted-foreground">
            Los límites y características requieren cambios en la base de datos directamente para evitar
            inconsistencias en suscripciones activas.
          </p>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Plan: {editingPlan?.display_name}</DialogTitle>
            <DialogDescription>
              Modifica el precio mensual y la descripción del plan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="price">Precio mensual (USD) *</Label>
              <div className="relative mt-2">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price_monthly}
                  onChange={(e) =>
                    setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-2"
              />
            </div>

            <div className="bg-muted p-3 rounded text-sm">
              <p className="font-medium mb-1">Límites actuales (no editables):</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  • Productos:{' '}
                  {editingPlan?.limits.max_products === -1 ? '∞' : editingPlan?.limits.max_products}
                </li>
                <li>
                  • Categorías:{' '}
                  {editingPlan?.limits.max_categories === -1 ? '∞' : editingPlan?.limits.max_categories}
                </li>
                <li>
                  • Órdenes/mes:{' '}
                  {editingPlan?.limits.max_orders_per_month === -1
                    ? '∞'
                    : editingPlan?.limits.max_orders_per_month}
                </li>
                <li>• Créditos AI/mes: {editingPlan?.limits.max_ai_credits_per_month}</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingPlan(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updatePlanMutation.isPending}>
              {updatePlanMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PlansManager;
