/**
 * PlanFormDialog Component
 *
 * Dialog for creating and editing subscription plans
 * Includes form validation, feature selection, and module pricing
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { Plan, CreatePlanInput, UpdatePlanInput } from '@/hooks/usePlans';
import { PlanFeaturesEditor } from './PlanFeaturesEditor';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const planFormSchema = z.object({
  // Basic info
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-z0-9_-]+$/, 'Solo letras minúsculas, números, guiones y guiones bajos'),
  display_name: z
    .string()
    .min(2, 'El nombre de visualización debe tener al menos 2 caracteres')
    .max(100, 'El nombre de visualización no puede exceder 100 caracteres'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  price_monthly: z.number().min(0, 'El precio no puede ser negativo').max(999999, 'El precio es demasiado alto'),

  // Limits
  max_products: z.number().int('Debe ser un número entero').min(-1, 'Usa -1 para ilimitado o un número positivo'),
  max_categories: z.number().int('Debe ser un número entero').min(-1, 'Usa -1 para ilimitado o un número positivo'),
  max_orders_per_month: z
    .number()
    .int('Debe ser un número entero')
    .min(-1, 'Usa -1 para ilimitado o un número positivo'),
  max_ai_credits_per_month: z.number().int('Debe ser un número entero').min(0, 'No puede ser negativo'),
  catalog_view_limit: z
    .number()
    .int('Debe ser un número entero')
    .min(-1, 'Usa -1 o deja vacío para ilimitado, o un número positivo')
    .optional()
    .nullable(),

  // Module pricing
  whatsapp_monthly: z
    .number()
    .min(0, 'El precio no puede ser negativo')
    .max(999999, 'El precio es demasiado alto')
    .optional()
    .nullable(),
  delivery_monthly: z
    .number()
    .min(0, 'El precio no puede ser negativo')
    .max(999999, 'El precio es demasiado alto')
    .optional()
    .nullable(),

  // Features
  features: z.array(z.string()).default([]),

  // Settings
  is_active: z.boolean().default(true),
  trial_duration_days: z
    .number()
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo')
    .max(365, 'No puede exceder 365 días'),
  sort_order: z
    .number()
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo')
    .max(9999, 'Valor demasiado alto'),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: Plan | null; // If provided, edit mode; otherwise, create mode
  onSubmit: (data: CreatePlanInput | { planId: string; updates: UpdatePlanInput }) => void;
  isSubmitting?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PlanFormDialog({ open, onOpenChange, plan, onSubmit, isSubmitting = false }: PlanFormDialogProps) {
  const isEditMode = !!plan;
  // Initialize form
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: '',
      display_name: '',
      description: '',
      price_monthly: 0,
      max_products: -1,
      max_categories: -1,
      max_orders_per_month: -1,
      max_ai_credits_per_month: 0,
      catalog_view_limit: null,
      whatsapp_monthly: null,
      delivery_monthly: null,
      features: [],
      is_active: true,
      trial_duration_days: 0,
      sort_order: 999,
    },
  });

  // Reset form when plan changes or dialog opens/closes
  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        display_name: plan.display_name,
        description: plan.description,
        price_monthly: plan.price_monthly,
        max_products: plan.limits.max_products,
        max_categories: plan.limits.max_categories,
        max_orders_per_month: plan.limits.max_orders_per_month,
        max_ai_credits_per_month: plan.limits.max_ai_credits_per_month,
        catalog_view_limit: (plan as any).catalog_view_limit ?? null,
        whatsapp_monthly: plan.modules.whatsapp_monthly ?? null,
        delivery_monthly: plan.modules.delivery_monthly ?? null,
        features: plan.features || [],
        is_active: plan.is_active,
        trial_duration_days: plan.trial_duration_days,
        sort_order: plan.sort_order,
      });
    } else {
      form.reset({
        name: '',
        display_name: '',
        description: '',
        price_monthly: 0,
        max_products: -1,
        max_categories: -1,
        max_orders_per_month: -1,
        max_ai_credits_per_month: 0,
        whatsapp_monthly: null,
        delivery_monthly: null,
        features: [],
        is_active: true,
        trial_duration_days: 0,
        sort_order: 999,
      });
    }
  }, [plan, form, open]);

  // Handle form submission
  const handleSubmit = async (values: PlanFormValues) => {
    console.log('[PlanFormDialog] handleSubmit called with values:', values);
    console.log('[PlanFormDialog] isEditMode:', isEditMode);
    console.log('[PlanFormDialog] plan:', plan);

    try {
      if (isEditMode && plan) {
        // Edit mode - send updates
        await onSubmit({
          planId: plan.id,
          updates: {
            display_name: values.display_name,
            description: values.description,
            price_monthly: values.price_monthly,
            limits: {
              max_products: values.max_products,
              max_categories: values.max_categories,
              max_orders_per_month: values.max_orders_per_month,
              max_ai_credits_per_month: values.max_ai_credits_per_month,
            },
            modules: {
              whatsapp_monthly: values.whatsapp_monthly ?? undefined,
              delivery_monthly: values.delivery_monthly ?? undefined,
            },
            catalog_view_limit: values.catalog_view_limit ?? undefined,
            features: values.features,
            is_active: values.is_active,
            trial_duration_days: values.trial_duration_days,
            sort_order: values.sort_order,
          },
        });
      } else {
        // Create mode - send full plan
        await onSubmit({
          name: values.name,
          display_name: values.display_name,
          description: values.description,
          price_monthly: values.price_monthly,
          limits: {
            max_products: values.max_products,
            max_categories: values.max_categories,
            max_orders_per_month: values.max_orders_per_month,
            max_ai_credits_per_month: values.max_ai_credits_per_month,
          },
          modules: {
            whatsapp_monthly: values.whatsapp_monthly ?? undefined,
            delivery_monthly: values.delivery_monthly ?? undefined,
          },
          catalog_view_limit: values.catalog_view_limit ?? undefined,
          features: values.features,
          is_active: values.is_active,
          trial_duration_days: values.trial_duration_days,
          sort_order: values.sort_order,
        });
      }
    } catch (error) {
      // Error is handled by the mutation
      console.error('[PlanFormDialog] Error submitting form:', error);
    }
  };
  console.log('[PlanFormDialog] Rendering dialog, open:', open, 'isEditMode:', isEditMode);
  console.log('[PlanFormDialog] Form state:', form.formState.errors);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Plan' : 'Crear Nuevo Plan'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifica los detalles del plan de suscripción.'
              : 'Crea un nuevo plan de suscripción con características personalizadas.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              console.log('[PlanFormDialog] Form onSubmit event triggered!', e);
              form.handleSubmit(handleSubmit)(e);
            }}
            className="space-y-6"
          >
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="limits">Límites</TabsTrigger>
                <TabsTrigger value="modules">Módulos</TabsTrigger>
                <TabsTrigger value="features">Características</TabsTrigger>
              </TabsList>

              {/* ============================================================ */}
              {/* TAB 1: BASIC INFO */}
              {/* ============================================================ */}
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Interno (ID)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="basic, pro, enterprise"
                          {...field}
                          disabled={isEditMode} // Can't change name in edit mode
                        />
                      </FormControl>
                      <FormDescription>
                        Identificador único (solo minúsculas, números, - y _). No se puede cambiar después de crear.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de Visualización</FormLabel>
                      <FormControl>
                        <Input placeholder="Plan Básico, Plan Pro" {...field} />
                      </FormControl>
                      <FormDescription>Nombre que verán los usuarios en la interfaz.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción del plan y sus beneficios..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Describe las ventajas de este plan.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price_monthly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Mensual (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="29.99"
                          value={field.value}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              field.onChange(val);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>Precio base mensual del plan.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="trial_duration_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración de Prueba (días)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="14"
                            value={field.value}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                              if (!isNaN(val)) {
                                field.onChange(val);
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>0 = sin período de prueba</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sort_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Orden de Visualización</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            value={field.value}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                              if (!isNaN(val)) {
                                field.onChange(val);
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>Menor = aparece primero</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Plan Activo</FormLabel>
                        <FormDescription>
                          Los planes inactivos no pueden ser seleccionados por nuevos usuarios.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* ============================================================ */}
              {/* TAB 2: LIMITS */}
              {/* ============================================================ */}
              <TabsContent value="limits" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Define los límites del plan. Usa -1 para indicar ilimitado.
                </p>

                <FormField
                  control={form.control}
                  name="max_products"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Máximo de Productos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50"
                          value={field.value}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                            if (!isNaN(val)) {
                              field.onChange(val);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>-1 = ilimitado</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_categories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Máximo de Categorías</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10"
                          value={field.value}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                            if (!isNaN(val)) {
                              field.onChange(val);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>-1 = ilimitado</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_orders_per_month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Máximo de Órdenes por Mes</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          value={field.value}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                            if (!isNaN(val)) {
                              field.onChange(val);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>-1 = ilimitado</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_ai_credits_per_month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Créditos de IA por Mes</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          value={field.value}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                            if (!isNaN(val)) {
                              field.onChange(val);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>Cantidad de créditos para funcionalidades de IA</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="catalog_view_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Límite de Vistas de Catálogo por Mes</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1000 (vacío = ilimitado)"
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseInt(e.target.value);
                            if (val === null || !isNaN(val)) {
                              field.onChange(val);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Vistas permitidas en modo catálogo. Vacío o null = ilimitado (planes premium)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* ============================================================ */}
              {/* TAB 3: MODULES */}
              {/* ============================================================ */}
              <TabsContent value="modules" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Define el precio mensual de los módulos adicionales. Usa 0 para módulos incluidos en el plan base.
                  Deja vacío o null para módulos no disponibles.
                </p>

                <FormField
                  control={form.control}
                  name="whatsapp_monthly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Módulo WhatsApp - Precio Mensual (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="15.00 (0 = incluido, vacío = no disponible)"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>Precio del módulo de integración con WhatsApp</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivery_monthly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Módulo Delivery - Precio Mensual (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="20.00 (0 = incluido, vacío = no disponible)"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>Precio del módulo de gestión de entregas y repartidores</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <h4 className="font-medium text-sm">Guía de Precios de Módulos:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>
                      <strong>0</strong> = Módulo incluido en el precio base del plan
                    </li>
                    <li>
                      <strong>Valor mayor a 0</strong> = Precio adicional mensual del módulo
                    </li>
                    <li>
                      <strong>Vacío/null</strong> = Módulo no disponible para este plan
                    </li>
                  </ul>
                </div>
              </TabsContent>

              {/* ============================================================ */}
              {/* TAB 4: FEATURES */}
              {/* ============================================================ */}
              <TabsContent value="features" className="space-y-4">
                <FormField
                  control={form.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Características del Plan</FormLabel>
                      <FormControl>
                        <PlanFeaturesEditor selectedFeatures={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormDescription>Selecciona las características incluidas en este plan</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={() => {
                  console.log('[PlanFormDialog] Submit button clicked!');
                  console.log('[PlanFormDialog] Form errors:', form.formState.errors);
                  console.log('[PlanFormDialog] Form isValid:', form.formState.isValid);
                  console.log('[PlanFormDialog] Full error details:', JSON.stringify(form.formState.errors, null, 2));
                }}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Guardar Cambios' : 'Crear Plan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
