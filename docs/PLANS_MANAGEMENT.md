# Plans Management System - Documentation

## Overview

Sistema completo de gestión de planes de suscripción con interfaz administrativa, permitiendo crear, editar, activar/desactivar, duplicar y archivar planes de forma dinámica sin necesidad de cambios en la base de datos.

## Características Principales

### 1. CRUD Completo de Planes
- ✅ **Crear** planes nuevos con toda su configuración
- ✅ **Editar** planes existentes (límites, precios, características, módulos)
- ✅ **Activar/Desactivar** planes inline
- ✅ **Duplicar** planes para crear variaciones rápidamente
- ✅ **Archivar** planes (soft delete) sin eliminar suscripciones activas
- ✅ **Restaurar** planes archivados

### 2. Configuración de Módulos con Precios
Los módulos (WhatsApp, Delivery) ahora tienen precios configurables por plan:
- **$0** = Módulo incluido en el precio base
- **> $0** = Precio adicional mensual del módulo
- **null/undefined** = Módulo no disponible para este plan

### 3. Catálogo de Características
40+ características predefinidas organizadas en 6 categorías:
- **Core** - Funcionalidades básicas
- **Analytics** - Analíticas y reportes
- **Marketing** - Marketing y promociones
- **Operations** - Operaciones y gestión
- **Support** - Soporte y asistencia
- **Advanced** - Funciones avanzadas

### 4. Seguridad
- Solo **platform admins** pueden crear/editar planes
- Solo **super admins** pueden eliminar planes
- Validación automática antes de archivar (verifica suscripciones activas)
- Auditoría automática de cambios

## Archivos Creados

### Backend

#### 1. Migration: `20251203160000_add_plan_management_fields.sql`
```sql
-- Agrega campo is_archived para soft delete
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Actualiza estructura de módulos a pricing
-- Antes: {"whatsapp": true, "delivery": false}
-- Ahora: {"whatsapp_monthly": 15.00, "delivery_monthly": 20.00}
```

**Cambios en planes existentes:**
- **Trial/Starter**: Módulos gratis ($0)
- **Basic**: WhatsApp $15, Delivery $20
- **Pro**: WhatsApp $12, Delivery $18 (descuento)
- **Enterprise**: Módulos incluidos ($0)

#### 2. Hook: `src/hooks/usePlans.ts`

**Exports principales:**
```typescript
export interface PlanLimits {
  max_products: number;           // -1 = ilimitado
  max_categories: number;
  max_orders_per_month: number;
  max_ai_credits_per_month: number;
}

export interface PlanModulePrices {
  whatsapp_monthly?: number;      // null = no disponible
  delivery_monthly?: number;
}

export interface Plan {
  id: string;
  name: string;                   // ID único (ej: "basic", "pro")
  display_name: string;           // Nombre visible
  description: string;
  price_monthly: number;
  limits: PlanLimits;
  modules: PlanModulePrices;
  features: string[];             // Array de feature keys
  is_active: boolean;
  is_archived?: boolean;
  trial_duration_days: number;
  sort_order: number;
}
```

**Mutaciones disponibles:**
```typescript
const {
  // Queries
  plans,
  isLoading,

  // Create
  createPlan,
  createPlanAsync,
  isCreating,

  // Update
  updatePlan,
  updatePlanAsync,
  isUpdating,

  // Toggle Active
  toggleActive,
  toggleActiveAsync,
  isToggling,

  // Archive
  archivePlan,
  archivePlanAsync,
  isArchiving,

  // Restore
  restorePlan,
  restorePlanAsync,
  isRestoring,

  // Duplicate
  duplicatePlan,
  duplicatePlanAsync,
  isDuplicating,

  // Utils
  fetchPlanById,
} = usePlans(includeArchived);
```

#### 3. Features Catalog: `src/lib/planFeatures.ts`

```typescript
export const AVAILABLE_FEATURES: Feature[] = [
  {
    key: 'basic_catalog',
    label: 'Catálogo Básico',
    description: 'Catálogo de productos con imágenes y descripciones',
    category: 'core',
  },
  // ... 40+ features
];

// Helper functions
getFeaturesByCategory(category: FeatureCategory): Feature[]
getFeatureByKey(key: string): Feature | undefined
getAllCategories(): FeatureCategory[]
getCategoryLabel(category: FeatureCategory): string
validateFeatures(featureKeys: string[]): {valid: boolean; invalid: string[]}
```

### Frontend

#### 4. Component: `src/components/admin/PlanFormDialog.tsx`

Formulario completo con validación Zod, organizado en 4 tabs:

**Tab 1 - Básico:**
- Nombre interno (ID) - No editable después de crear
- Nombre de visualización
- Descripción
- Precio mensual
- Duración de prueba
- Orden de visualización
- Switch de activación

**Tab 2 - Límites:**
- Máximo de productos (-1 = ilimitado)
- Máximo de categorías
- Máximo de órdenes por mes
- Créditos de IA por mes

**Tab 3 - Módulos:**
- Precio WhatsApp (0 = incluido, vacío = no disponible)
- Precio Delivery (0 = incluido, vacío = no disponible)

**Tab 4 - Características:**
- Editor interactivo con el catálogo completo
- Búsqueda de características
- Selección por categorías
- Vista de características seleccionadas

#### 5. Component: `src/components/admin/PlanFeaturesEditor.tsx`

Editor de características con:
- Búsqueda en tiempo real
- Accordion por categorías
- Checkboxes con descripción completa
- Selección/deselección por categoría
- Vista resumida de características seleccionadas

#### 6. Page: `src/pages/platform-admin/PlansManager.tsx`

Interfaz principal completamente refactorizada:
- Grid de cards con planes activos
- Toggle para mostrar planes archivados
- Botón "Crear Nuevo Plan"
- Cada card incluye:
  - Switch inline para activar/desactivar
  - Menú de acciones (editar, duplicar, archivar)
  - Vista de límites, módulos y características
  - Badges para estado (activo, archivado, trial)

## Uso

### Crear un Nuevo Plan

```typescript
import { usePlans } from '@/hooks/usePlans';

function MyComponent() {
  const { createPlan, isCreating } = usePlans();

  const handleCreate = () => {
    createPlan({
      name: 'premium',                    // ID único
      display_name: 'Plan Premium',
      description: 'Plan para empresas medianas',
      price_monthly: 79.99,
      limits: {
        max_products: 500,
        max_categories: 50,
        max_orders_per_month: -1,       // Ilimitado
        max_ai_credits_per_month: 1000,
      },
      modules: {
        whatsapp_monthly: 10,             // $10 adicionales
        delivery_monthly: 15,             // $15 adicionales
      },
      features: [
        'basic_catalog',
        'analytics',
        'promotions',
        // ... más features
      ],
      is_active: true,
      trial_duration_days: 14,
      sort_order: 3,
    });
  };

  return (
    <button onClick={handleCreate} disabled={isCreating}>
      Crear Plan
    </button>
  );
}
```

### Editar un Plan

```typescript
const { updatePlan, isUpdating } = usePlans();

const handleUpdate = (planId: string) => {
  updatePlan({
    planId,
    updates: {
      price_monthly: 89.99,              // Subir precio
      limits: {
        max_products: 1000,              // Aumentar límite
        max_categories: 100,
        max_orders_per_month: -1,
        max_ai_credits_per_month: 2000,
      },
      features: [
        // ... nuevo array de features
      ],
    },
  });
};
```

### Archivar un Plan

```typescript
const { archivePlan, isArchiving } = usePlans();

const handleArchive = (planId: string) => {
  // Automáticamente verifica si hay suscripciones activas
  // Si las hay, muestra error
  // Si no, archiva el plan y lo marca como inactivo
  archivePlan(planId);
};
```

### Duplicar un Plan

```typescript
const { duplicatePlan, isDuplicating } = usePlans();

const handleDuplicate = (planId: string) => {
  // Crea una copia del plan con:
  // - Nombre único: {original}_copy_{timestamp}
  // - Display name: {original} (Copia)
  // - is_active: false (requiere activación manual)
  // - sort_order: incrementado
  duplicatePlan(planId);
};
```

## Validaciones y Seguridad

### RLS Policies (Ya existentes en `20251202000003_subscription_security.sql`)

```sql
-- Ver planes: Solo los activos son públicamente visibles
CREATE POLICY "Plans are publicly readable"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- Crear/Editar planes: Solo platform admins
CREATE POLICY "Platform admins can insert plans"
  ON subscription_plans FOR INSERT
  TO authenticated
  WITH CHECK (is_platform_admin());

CREATE POLICY "Platform admins can update plans"
  ON subscription_plans FOR UPDATE
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Eliminar planes: Solo super admins
CREATE POLICY "Super admins can delete plans"
  ON subscription_plans FOR DELETE
  TO authenticated
  USING (is_super_admin());
```

### Validaciones de Negocio

#### 1. Al crear plan:
- ✅ Verifica que el `name` sea único
- ✅ Valida formato del `name` (solo minúsculas, números, - y _)
- ✅ Valida rangos de precios y límites

#### 2. Al editar plan:
- ✅ No permite cambiar el `name` (ID inmutable)
- ✅ Valida que los cambios no rompan suscripciones existentes

#### 3. Al archivar plan:
- ✅ Verifica que no haya suscripciones activas (trial, active, pending_payment)
- ✅ Automáticamente desactiva el plan (`is_active = false`)
- ✅ Muestra error descriptivo si hay suscripciones activas

#### 4. Al duplicar plan:
- ✅ Genera nombre único con timestamp
- ✅ Crea plan como inactivo por seguridad
- ✅ Copia todos los settings excepto ID

## Estructura de Datos

### Módulos - Antes y Después

**Antes:**
```json
{
  "whatsapp": true,
  "delivery": false
}
```

**Ahora:**
```json
{
  "whatsapp_monthly": 15.00,
  "delivery_monthly": 20.00
}
```

**Interpretación:**
- `0` → Módulo incluido en el precio base
- `> 0` → Precio adicional mensual
- `null` o ausente → Módulo no disponible

### Features Array

```json
{
  "features": [
    "basic_catalog",
    "order_management",
    "analytics",
    "promotions",
    "custom_branding"
  ]
}
```

Cada feature key debe existir en `AVAILABLE_FEATURES`. El hook `usePlans` no valida esto automáticamente, pero `PlanFeaturesEditor` solo permite seleccionar features válidas.

## Migración de Datos

Para aplicar la migración en producción:

1. **Opción 1: Supabase CLI**
```bash
npx supabase db push --include-all
```

2. **Opción 2: SQL Editor (Supabase Dashboard)**
- Ir a SQL Editor en Supabase Dashboard
- Copiar contenido de `supabase/migrations/20251203160000_add_plan_management_fields.sql`
- Ejecutar query

3. **Opción 3: psql directo**
```bash
psql "postgresql://postgres.[PROJECT_ID]:[PASSWORD]@[HOST]:6543/postgres" \
  -f supabase/migrations/20251203160000_add_plan_management_fields.sql
```

## Testing

### Checklist de Testing

**Crear Plan:**
- [ ] Crear plan con nombre único
- [ ] Validar que no acepta nombres duplicados
- [ ] Verificar que aparece en la lista
- [ ] Confirmar que se guarda con `is_active` correcto

**Editar Plan:**
- [ ] Editar precio, descripción, límites
- [ ] Cambiar features seleccionadas
- [ ] Modificar precios de módulos
- [ ] Verificar que no permite cambiar `name`

**Activar/Desactivar:**
- [ ] Toggle inline funciona
- [ ] Plan desactivado no aparece en lista pública
- [ ] Suscripciones existentes siguen funcionando

**Duplicar Plan:**
- [ ] Crea copia con nombre único
- [ ] Copia se crea como inactiva
- [ ] Todos los settings se copian correctamente

**Archivar Plan:**
- [ ] No permite archivar plan con suscripciones activas
- [ ] Permite archivar plan sin suscripciones
- [ ] Plan archivado desaparece de lista principal
- [ ] Puede verse al activar "Mostrar archivados"

**Restaurar Plan:**
- [ ] Plan restaurado vuelve a lista principal
- [ ] Mantiene configuración original
- [ ] Requiere reactivación manual si estaba inactivo

## Troubleshooting

### Error: "Ya existe un plan con el nombre X"
- El campo `name` debe ser único
- Cambia el `name` a uno diferente
- O edita el plan existente en lugar de crear uno nuevo

### Error: "No se puede archivar un plan con suscripciones activas"
- Hay tiendas con suscripción activa en este plan
- Opciones:
  1. Cambiar esas suscripciones a otro plan primero
  2. Esperar a que las suscripciones expiren
  3. Solo desactivar el plan (sin archivar)

### Los cambios no aparecen en producción
- Verifica que la migración se aplicó correctamente
- Revisa que tu usuario tiene rol `platform_admin`
- Limpia caché del navegador
- Revisa la consola de Supabase para errores RLS

### Features no aparecen correctamente
- Verifica que las feature keys existen en `AVAILABLE_FEATURES`
- Usa `validateFeatures()` para verificar validez
- Revisa que el JSONB en la base de datos está bien formado

## Roadmap Futuro

### Mejoras Potenciales

1. **Versionado de Planes**
   - Historial de cambios en planes
   - Rollback a versiones anteriores
   - Comparación de versiones

2. **A/B Testing**
   - Crear variantes de planes para testing
   - Métricas de conversión por plan
   - Asignación automática de usuarios a variantes

3. **Planes Personalizados**
   - Planes one-off para clientes específicos
   - Override de limits/features por tienda
   - Precios especiales negociados

4. **Integraciones de Pago**
   - Stripe Products sync
   - Pricing tables automáticas
   - Webhooks para cambios de plan

5. **Analytics de Planes**
   - Planes más populares
   - Churn rate por plan
   - Revenue por plan
   - Upgrade/downgrade flows

## Referencias

- **Hook**: [src/hooks/usePlans.ts](../src/hooks/usePlans.ts)
- **Features**: [src/lib/planFeatures.ts](../src/lib/planFeatures.ts)
- **Form Dialog**: [src/components/admin/PlanFormDialog.tsx](../src/components/admin/PlanFormDialog.tsx)
- **Features Editor**: [src/components/admin/PlanFeaturesEditor.tsx](../src/components/admin/PlanFeaturesEditor.tsx)
- **Manager Page**: [src/pages/platform-admin/PlansManager.tsx](../src/pages/platform-admin/PlansManager.tsx)
- **Migration**: [supabase/migrations/20251203160000_add_plan_management_fields.sql](../supabase/migrations/20251203160000_add_plan_management_fields.sql)
- **RLS Policies**: [supabase/migrations/20251202000003_subscription_security.sql](../supabase/migrations/20251202000003_subscription_security.sql)

## Soporte

Para preguntas o issues:
1. Revisar esta documentación
2. Revisar código fuente de los componentes
3. Verificar logs de Supabase
4. Contactar al equipo de desarrollo

---

**Última actualización**: 2025-12-03
**Versión**: 1.0.0
**Autor**: Agente Orquestador + General Purpose Agent
