# Sistema de Suscripciones - PideAI

## Índice

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Modelos de Datos](#modelos-de-datos)
4. [Planes de Suscripción](#planes-de-suscripción)
5. [Flujos de Negocio](#flujos-de-negocio)
6. [API y Funciones](#api-y-funciones)
7. [Frontend Integration](#frontend-integration)
8. [Seguridad](#seguridad)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Visión General

El sistema de suscripciones de PideAI permite gestionar diferentes niveles de acceso y funcionalidades para las tiendas en la plataforma. Características principales:

- **Trial Automático**: 30 días gratis con 5 créditos AI al registrar una tienda
- **Planes Escalables**: Trial, Basic, Pro, Enterprise
- **Módulos Premium**: WhatsApp y Delivery como add-ons pagos
- **Validación Manual de Pagos**: Sistema de aprobación manual por administradores
- **Límites Configurables**: Control de productos, categorías, órdenes, etc.
- **Panel de Administración**: Gestión centralizada de todas las tiendas

### Flujo de Usuario Típico

```
1. Usuario crea tienda
   ↓
2. Se crea automáticamente suscripción trial (30 días)
   ↓
3. Usuario usa la plataforma con límites del trial
   ↓
4. Usuario solicita upgrade y realiza pago
   ↓
5. Admin valida el pago manualmente
   ↓
6. Sistema actualiza suscripción y extiende acceso
   ↓
7. Usuario puede solicitar módulos adicionales (WhatsApp/Delivery)
   ↓
8. Admin habilita módulos manualmente después del pago
```

---

## Arquitectura

### Componentes del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Store Admin UI          │    Platform Admin UI             │
│  - Subscription status   │    - Stores management           │
│  - Upgrade requests      │    - Payment validations         │
│  - Module requests       │    - Plans configuration         │
│  - Usage dashboard       │    - Admin users management      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC                          │
├─────────────────────────────────────────────────────────────┤
│  - validate_plan_limit()                                    │
│  - has_module_enabled()                                     │
│  - approve_payment() / reject_payment()                     │
│  - get_store_usage_stats()                                  │
│  - is_subscription_valid()                                  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                    │
│  - subscription_plans      (configuración de planes)        │
│  - subscriptions           (suscripciones activas)          │
│  - payment_validations     (solicitudes de pago)            │
│  - platform_admins         (administradores)                │
│  - subscription_audit_log  (historial de cambios)           │
│                                                              │
│  Triggers:                                                  │
│  - create_trial_subscription (auto-trial en registro)       │
│  - validate_product_limit    (límite de productos)          │
│  - validate_category_limit   (límite de categorías)         │
│  - validate_order_limit      (límite de órdenes)            │
└─────────────────────────────────────────────────────────────┘
```

### Tecnologías

- **Backend**: Supabase PostgreSQL con RLS (Row Level Security)
- **Frontend**: React + TypeScript + TanStack Query
- **UI**: shadcn/ui components
- **Autenticación**: Supabase Auth
- **Real-time**: Supabase Realtime (opcional para notificaciones)

---

## Modelos de Datos

### subscription_plans

Configuración de los planes disponibles.

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,           -- 'trial', 'basic', 'pro', 'enterprise'
  display_name TEXT NOT NULL,          -- 'Plan Trial', 'Plan Básico'
  description TEXT,
  price_monthly DECIMAL(10,2),         -- Precio mensual
  trial_duration_days INTEGER,         -- Duración del trial (solo para plan trial)
  is_active BOOLEAN DEFAULT true,

  -- Límites del plan (JSONB flexible)
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Módulos incluidos en el plan base
  modules JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Features como lista de strings
  features TEXT[] DEFAULT ARRAY[]::TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Ejemplo de `limits`**:
```json
{
  "ai_monthly_credits": 5,
  "max_products": 50,
  "max_orders_per_month": 100,
  "max_categories": 10,
  "has_kitchen_display": false,
  "has_analytics": false,
  "has_promotions": false,
  "has_coupons": false
}
```

**Ejemplo de `modules`**:
```json
{
  "whatsapp": false,
  "delivery": false,
  "ai_enhancement": true
}
```

### subscriptions

Suscripciones activas de cada tienda.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),

  status TEXT NOT NULL DEFAULT 'trial',
  -- Estados: 'trial', 'active', 'pending_payment', 'past_due', 'cancelled', 'suspended'

  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,

  -- Módulos habilitados manualmente por admin (override del plan)
  enabled_modules JSONB DEFAULT '{}'::jsonb,

  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id)
);
```

**Estados de Suscripción**:
- `trial`: Período de prueba gratuito (30 días)
- `active`: Suscripción pagada y activa
- `pending_payment`: Esperando validación de pago
- `past_due`: Pago vencido
- `cancelled`: Cancelada por el usuario
- `suspended`: Suspendida por admin

### payment_validations

Solicitudes de pago que requieren validación manual.

```sql
CREATE TABLE payment_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,

  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL,        -- 'bank_transfer', 'paypal', 'cash', 'other'
  reference_number TEXT,               -- Número de referencia bancaria
  proof_url TEXT,                      -- URL del comprobante de pago

  status TEXT DEFAULT 'pending',
  -- Estados: 'pending', 'approved', 'rejected'

  requested_plan_id UUID REFERENCES subscription_plans(id),
  requested_modules JSONB DEFAULT '{}'::jsonb,  -- Módulos adicionales solicitados

  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### platform_admins

Administradores de la plataforma.

```sql
CREATE TABLE platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'support',
  -- Roles: 'super_admin', 'support', 'billing'

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(user_id)
);
```

**Roles**:
- `super_admin`: Acceso completo a todas las funciones
- `support`: Soporte técnico (sin acceso a billing)
- `billing`: Validación de pagos y facturación

### subscription_audit_log

Historial de cambios en suscripciones.

```sql
CREATE TABLE subscription_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  -- Ejemplos: 'created', 'upgraded', 'downgraded', 'cancelled',
  --           'payment_approved', 'module_enabled', 'suspended'

  old_data JSONB,
  new_data JSONB,

  performed_by UUID REFERENCES auth.users(id),
  reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Planes de Suscripción

### Plan Trial (Gratuito - 30 días)

**Características**:
- 5 créditos AI mensuales (Estudio Fotográfico)
- 50 productos máximo
- 100 órdenes por mes
- 10 categorías máximo
- Analytics básico
- Sin WhatsApp
- Sin Delivery
- Sin promociones/cupones

**Precio**: $0 (30 días gratis)

**Creación**: Automática al registrar tienda

### Plan Basic ($29/mes)

**Características**:
- 20 créditos AI mensuales
- 200 productos máximo
- 500 órdenes por mes
- 20 categorías máximo
- Analytics avanzado
- Display de cocina incluido
- Promociones y cupones
- WhatsApp y Delivery opcionales (pago adicional)

**Precio**: $29 USD/mes

**Ideal para**: Restaurantes pequeños

### Plan Pro ($59/mes)

**Características**:
- 100 créditos AI mensuales
- 1000 productos máximo
- Órdenes ilimitadas
- Categorías ilimitadas
- Analytics completo
- Display de cocina incluido
- Promociones y cupones avanzados
- WhatsApp incluido
- Delivery incluido

**Precio**: $59 USD/mes

**Ideal para**: Restaurantes medianos a grandes

### Plan Enterprise ($99/mes)

**Características**:
- 500 créditos AI mensuales
- Productos ilimitados
- Órdenes ilimitadas
- Categorías ilimitadas
- Analytics empresarial
- Display de cocina multi-sede
- Sistema de franquicias
- Integraciones API personalizadas
- Soporte prioritario 24/7
- WhatsApp incluido
- Delivery incluido

**Precio**: $99 USD/mes

**Ideal para**: Cadenas y franquicias

---

## Flujos de Negocio

### 1. Creación de Tienda y Trial Automático

```sql
-- Trigger que se ejecuta automáticamente al insertar en stores
CREATE TRIGGER trigger_create_trial_subscription
  AFTER INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION create_trial_subscription();
```

**Proceso**:
1. Usuario registra nueva tienda
2. Trigger detecta INSERT en tabla `stores`
3. Busca plan 'trial' activo
4. Crea registro en `subscriptions` con:
   - status = 'trial'
   - trial_ends_at = NOW() + 30 días
   - current_period_end = NOW() + 30 días
5. Actualiza `store_ai_credits` con 5 créditos
6. Registra en `subscription_audit_log`

### 2. Solicitud de Upgrade

**Frontend (Store Admin)**:
```typescript
// Usuario solicita upgrade a plan Basic
const handleUpgradeRequest = async () => {
  const { data, error } = await supabase
    .from('payment_validations')
    .insert({
      subscription_id: currentSubscription.id,
      amount: 29.00,
      payment_date: new Date().toISOString(),
      payment_method: 'bank_transfer',
      reference_number: 'TRANS-123456',
      proof_url: uploadedProofUrl,
      requested_plan_id: basicPlanId,
      status: 'pending'
    });
};
```

**Backend**:
1. Se crea registro en `payment_validations` con status 'pending'
2. Admin recibe notificación (puede implementarse con triggers)
3. Solicitud aparece en panel de administración

### 3. Validación de Pago por Admin

**Frontend (Platform Admin)**:
```typescript
// Admin aprueba el pago
const handleApprovePayment = async (paymentId: string) => {
  const { data, error } = await supabase.rpc('approve_payment', {
    p_payment_id: paymentId,
    p_admin_id: currentAdminUserId,
    p_notes: 'Pago verificado. Referencia bancaria confirmada.'
  });

  if (data?.success) {
    toast.success('Pago aprobado. Suscripción actualizada.');
  }
};
```

**Backend (approve_payment function)**:
```sql
CREATE OR REPLACE FUNCTION approve_payment(
  p_payment_id UUID,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_subscription_id UUID;
  v_requested_plan_id UUID;
  v_requested_modules JSONB;
  v_current_period_end TIMESTAMPTZ;
BEGIN
  -- 1. Obtener datos del pago
  SELECT subscription_id, requested_plan_id, requested_modules
  INTO v_subscription_id, v_requested_plan_id, v_requested_modules
  FROM payment_validations
  WHERE id = p_payment_id AND status = 'pending';

  -- 2. Actualizar el pago
  UPDATE payment_validations
  SET status = 'approved',
      reviewed_by = p_admin_id,
      reviewed_at = NOW(),
      admin_notes = p_notes
  WHERE id = p_payment_id;

  -- 3. Actualizar la suscripción
  UPDATE subscriptions
  SET
    plan_id = v_requested_plan_id,
    status = 'active',
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '30 days',
    enabled_modules = enabled_modules || v_requested_modules,
    updated_at = NOW()
  WHERE id = v_subscription_id;

  -- 4. Registrar en auditoría
  INSERT INTO subscription_audit_log (
    subscription_id, action, performed_by, reason
  ) VALUES (
    v_subscription_id, 'payment_approved', p_admin_id, p_notes
  );

  -- 5. Actualizar créditos AI según nuevo plan
  -- (lógica adicional aquí)

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Habilitación Manual de Módulos

**Proceso**:
1. Usuario solicita módulo WhatsApp o Delivery
2. Admin verifica pago del módulo
3. Admin actualiza `subscriptions.enabled_modules`:

```sql
UPDATE subscriptions
SET enabled_modules = jsonb_set(
  enabled_modules,
  '{whatsapp}',
  'true'::jsonb
)
WHERE store_id = 'xxx-xxx-xxx';
```

4. Sistema valida acceso con `has_module_enabled()`

### 5. Validación de Límites

**Triggers automáticos**:

```sql
-- Antes de insertar producto
CREATE TRIGGER trigger_validate_product_limit
  BEFORE INSERT ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_limit();
```

**Función de validación**:
```sql
CREATE OR REPLACE FUNCTION validate_product_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_can_add BOOLEAN;
BEGIN
  SELECT validate_plan_limit(NEW.store_id, 'max_products') INTO v_can_add;

  IF NOT v_can_add THEN
    RAISE EXCEPTION 'Has alcanzado el límite de productos de tu plan. Upgrade para agregar más productos.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## API y Funciones

### validate_plan_limit(p_store_id UUID, p_limit_key TEXT)

Valida si una tienda puede agregar más recursos según su plan.

**Parámetros**:
- `p_store_id`: UUID de la tienda
- `p_limit_key`: Clave del límite ('max_products', 'max_categories', 'max_orders_per_month')

**Retorna**: BOOLEAN

**Ejemplo**:
```sql
SELECT validate_plan_limit(
  '123e4567-e89b-12d3-a456-426614174000',
  'max_products'
); -- true o false
```

### has_module_enabled(p_store_id UUID, p_module_name TEXT)

Verifica si una tienda tiene acceso a un módulo específico.

**Parámetros**:
- `p_store_id`: UUID de la tienda
- `p_module_name`: Nombre del módulo ('whatsapp', 'delivery', 'ai_enhancement')

**Retorna**: BOOLEAN

**Lógica**:
1. Verifica que suscripción esté activa (trial o active)
2. Verifica si módulo está incluido en el plan (`subscription_plans.modules`)
3. Verifica si módulo está habilitado manualmente (`subscriptions.enabled_modules`)
4. Retorna true si cualquiera de las dos últimas es verdadero

**Ejemplo**:
```sql
SELECT has_module_enabled(
  '123e4567-e89b-12d3-a456-426614174000',
  'whatsapp'
); -- true o false
```

### get_store_usage_stats(p_store_id UUID)

Obtiene estadísticas de uso vs límites de una tienda.

**Retorna**: JSONB
```json
{
  "products": {
    "current": 45,
    "limit": 50,
    "unlimited": false
  },
  "orders_this_month": {
    "current": 78,
    "limit": 100,
    "unlimited": false
  },
  "categories": {
    "current": 8,
    "limit": 10,
    "unlimited": false
  },
  "ai_credits": {
    "used": 3,
    "available": 2,
    "limit": 5
  }
}
```

### approve_payment(p_payment_id UUID, p_admin_id UUID, p_notes TEXT)

Aprueba un pago pendiente y actualiza la suscripción.

**Retorna**: JSONB con `{success: true}` o `{success: false, error: "mensaje"}`

### reject_payment(p_payment_id UUID, p_admin_id UUID, p_notes TEXT)

Rechaza un pago pendiente.

**Retorna**: JSONB con `{success: true}` o `{success: false, error: "mensaje"}`

### is_platform_admin()

Verifica si el usuario actual es un administrador de plataforma.

**Retorna**: BOOLEAN

**Uso en RLS policies**:
```sql
CREATE POLICY "Platform admins can view all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (is_platform_admin());
```

### get_admin_role()

Obtiene el rol del administrador actual.

**Retorna**: TEXT ('super_admin', 'support', 'billing', o NULL)

---

## Frontend Integration

### Hook: useSubscription

Hook principal para gestionar suscripción de la tienda.

```typescript
import { useSubscription } from '@/hooks/useSubscription';

function MyComponent() {
  const {
    subscription,      // Datos de la suscripción
    plan,             // Datos del plan
    usage,            // Estadísticas de uso
    isLoading,        // Estado de carga
    isValid,          // true si suscripción es válida
    isTrial,          // true si está en trial
    isExpired,        // true si expiró
    needsUpgrade,     // true si quedan <= 7 días de trial
    trialDaysLeft,    // Días restantes de trial (o null)
    canAccessModule,  // Función async para verificar módulo
    canAccessFeature, // Función async para verificar feature
    canAddMore,       // Función async para verificar límite
    refetch,          // Función para refrescar datos
  } = useSubscription();

  // Verificar acceso a módulo
  const checkWhatsApp = async () => {
    const hasAccess = await canAccessModule('whatsapp');
    if (!hasAccess) {
      toast.error('WhatsApp no disponible en tu plan');
    }
  };

  // Verificar límite antes de agregar producto
  const handleAddProduct = async () => {
    const canAdd = await canAddMore('max_products');
    if (!canAdd) {
      toast.error('Has alcanzado el límite de productos');
      return;
    }
    // Proceder a agregar producto...
  };

  return (
    <div>
      <h2>{plan?.display_name}</h2>
      <p>Productos: {usage?.products.current} / {usage?.products.limit}</p>
      {needsUpgrade && (
        <Alert>
          Tu trial expira en {trialDaysLeft} días.
          <Link to="/admin/settings?tab=subscription">Upgradeate</Link>
        </Alert>
      )}
    </div>
  );
}
```

### Hook: useModuleAccess

Hook simplificado para verificar acceso a módulo específico.

```typescript
import { useModuleAccess } from '@/hooks/useSubscription';

function WhatsAppSettings() {
  const { data: hasWhatsAppAccess, isLoading } = useModuleAccess('whatsapp');

  if (isLoading) return <Skeleton />;

  if (!hasWhatsAppAccess) {
    return <ModuleNotAvailable module="WhatsApp" />;
  }

  return <WhatsAppConfigForm />;
}
```

### Componente: ModuleNotAvailable

Muestra cuando un módulo no está disponible en el plan actual.

```typescript
import { ModuleNotAvailable } from '@/components/admin/ModuleNotAvailable';

<ModuleNotAvailable
  module="WhatsApp"
  description="El módulo de WhatsApp permite gestionar conversaciones, enviar catálogos y automatizar respuestas."
/>
```

### Hook: usePlatformAdmin

Para rutas de administración de plataforma.

```typescript
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

function PlatformDashboard() {
  const { isAdmin, role, isLoading } = usePlatformAdmin();

  if (!isAdmin) {
    return <AccessDenied />;
  }

  return (
    <div>
      <h1>Platform Admin Dashboard</h1>
      {role === 'super_admin' && (
        <Link to="/platform-admin/admins">Manage Admins</Link>
      )}
    </div>
  );
}
```

---

## Seguridad

### Row Level Security (RLS)

Todas las tablas de suscripción tienen RLS habilitado:

```sql
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_audit_log ENABLE ROW LEVEL SECURITY;
```

### Políticas de Seguridad

**subscription_plans**:
- Todos pueden leer planes activos
- Solo super_admin puede modificar

**subscriptions**:
- Store owners pueden leer su propia suscripción
- Platform admins pueden leer todas
- Solo platform admins pueden modificar

**payment_validations**:
- Store owners pueden crear y leer sus propias solicitudes
- Platform admins (billing y super_admin) pueden leer y aprobar todas

**platform_admins**:
- Solo super_admin puede leer y modificar
- Los admins pueden ver su propio registro

### Funciones SECURITY DEFINER

Las funciones críticas usan `SECURITY DEFINER` para ejecutarse con permisos elevados:

```sql
CREATE OR REPLACE FUNCTION approve_payment(...)
RETURNS JSONB AS $$
...
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Esto permite que la función modifique datos aunque el usuario no tenga permisos directos en las tablas.

### Validación de Admin

```sql
-- Verificar que quien aprueba pagos sea admin de billing o super_admin
IF NOT EXISTS(
  SELECT 1 FROM platform_admins
  WHERE user_id = p_admin_id
  AND role IN ('super_admin', 'billing')
  AND is_active = true
) THEN
  RAISE EXCEPTION 'No tienes permisos para aprobar pagos';
END IF;
```

---

## Testing

### Script de Setup

Ejecutar en Supabase SQL Editor:

```bash
# Verificar instalación completa
psql -f docs/setup-subscription-system.sql

# Crear primer super admin
psql -f scripts/create-super-admin.sql

# Ejecutar tests automáticos
psql -f scripts/test-subscription-flow.sql
```

### Tests Manuales

Ver [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) para procedimientos completos.

**Tests básicos**:

1. **Trial Automático**:
   - Crear tienda nueva
   - Verificar que se creó suscripción con status 'trial'
   - Verificar que trial_ends_at = NOW() + 30 días
   - Verificar 5 créditos AI

2. **Límites**:
   - Intentar agregar productos hasta límite
   - Verificar error al exceder límite
   - Verificar mensaje de error apropiado

3. **Módulos**:
   - Intentar acceder a WhatsApp en plan trial
   - Verificar que muestra "Módulo no disponible"
   - Admin habilita módulo manualmente
   - Verificar acceso después de habilitar

4. **Pagos**:
   - Crear solicitud de pago
   - Admin aprueba pago
   - Verificar cambio de plan
   - Verificar extensión de período

### Tests de Integración

```typescript
// tests/subscription.test.ts
describe('Subscription System', () => {
  it('creates trial subscription on store creation', async () => {
    const { data: store } = await supabase
      .from('stores')
      .insert({ name: 'Test Store', subdomain: 'test-store' })
      .select()
      .single();

    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('store_id', store.id)
      .single();

    expect(subscription.status).toBe('trial');
    expect(subscription.trial_ends_at).toBeDefined();
  });

  it('validates product limit', async () => {
    // Test implementation...
  });

  it('approves payment and upgrades subscription', async () => {
    // Test implementation...
  });
});
```

---

## Troubleshooting

### Suscripción no se creó automáticamente

**Síntomas**: Nueva tienda no tiene registro en `subscriptions`

**Verificar**:
```sql
-- 1. Verificar que existe el trigger
SELECT * FROM pg_trigger WHERE tgname = 'trigger_create_trial_subscription';

-- 2. Verificar que existe el plan trial
SELECT * FROM subscription_plans WHERE name = 'trial' AND is_active = true;

-- 3. Ver logs de PostgreSQL
SELECT * FROM pg_stat_activity;
```

**Solución**:
```sql
-- Crear manualmente la suscripción
SELECT create_trial_subscription_for_store('store-id-aquí');
```

### Módulo aparece deshabilitado pero debería estar activo

**Verificar**:
```sql
-- 1. Verificar suscripción activa
SELECT status FROM subscriptions WHERE store_id = 'xxx';

-- 2. Verificar módulos del plan
SELECT modules FROM subscription_plans sp
JOIN subscriptions s ON s.plan_id = sp.id
WHERE s.store_id = 'xxx';

-- 3. Verificar módulos habilitados manualmente
SELECT enabled_modules FROM subscriptions WHERE store_id = 'xxx';

-- 4. Ejecutar la función directamente
SELECT has_module_enabled('store-id', 'whatsapp');
```

**Solución**:
```sql
-- Habilitar módulo manualmente
UPDATE subscriptions
SET enabled_modules = jsonb_set(
  COALESCE(enabled_modules, '{}'::jsonb),
  '{whatsapp}',
  'true'::jsonb
)
WHERE store_id = 'xxx';
```

### Límite no se está respetando

**Verificar**:
```sql
-- 1. Verificar que existe el trigger
SELECT * FROM pg_trigger WHERE tgname LIKE '%validate%limit%';

-- 2. Probar la función directamente
SELECT validate_plan_limit('store-id', 'max_products');

-- 3. Ver conteo actual vs límite
SELECT get_store_usage_stats('store-id');
```

**Solución**:
```sql
-- Recrear el trigger
DROP TRIGGER IF EXISTS trigger_validate_product_limit ON menu_items;
CREATE TRIGGER trigger_validate_product_limit
  BEFORE INSERT ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_limit();
```

### Pago aprobado pero suscripción no cambió

**Verificar**:
```sql
-- 1. Ver estado del pago
SELECT * FROM payment_validations WHERE id = 'payment-id';

-- 2. Ver logs de auditoría
SELECT * FROM subscription_audit_log
WHERE subscription_id = 'subscription-id'
ORDER BY created_at DESC;

-- 3. Intentar aprobar nuevamente
SELECT approve_payment('payment-id', 'admin-id', 'Retry approval');
```

### Usuario no puede acceder a panel de admin

**Verificar**:
```sql
-- 1. Verificar que existe el registro
SELECT * FROM platform_admins WHERE user_id = 'user-id';

-- 2. Verificar que está activo
SELECT is_active FROM platform_admins WHERE user_id = 'user-id';

-- 3. Verificar función
SELECT is_platform_admin(); -- Ejecutar como el usuario
```

**Solución**:
```sql
-- Activar admin
UPDATE platform_admins SET is_active = true WHERE user_id = 'user-id';

-- O crear registro si no existe
INSERT INTO platform_admins (user_id, role, is_active)
VALUES ('user-id', 'super_admin', true);
```

### Créditos AI no se resetean mensualmente

**Verificar**:
```sql
-- 1. Ver última fecha de reset
SELECT last_reset_date FROM store_ai_credits WHERE store_id = 'xxx';

-- 2. Ver job de pg_cron (si está configurado)
SELECT * FROM cron.job WHERE command LIKE '%reset_monthly_ai_credits%';
```

**Solución manual**:
```sql
-- Ejecutar reset manualmente
SELECT reset_monthly_ai_credits();

-- O para una tienda específica
UPDATE store_ai_credits
SET monthly_credits = (
  SELECT (sp.limits->>'ai_monthly_credits')::INTEGER
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.store_id = store_ai_credits.store_id
),
credits_used_this_month = 0,
last_reset_date = NOW()
WHERE store_id = 'xxx';
```

---

## Próximos Pasos

### Features Planeadas

- [ ] Webhook para notificaciones automáticas de pagos pendientes
- [ ] Dashboard de métricas para store admins (uso de recursos)
- [ ] Sistema de alertas cuando se acerca al límite (80%, 90%, 100%)
- [ ] Auto-suspensión de tiendas con 7+ días de retraso en pago
- [ ] Integración con procesador de pagos (Stripe, PayPal)
- [ ] Sistema de cupones y descuentos
- [ ] Plan anual con descuento
- [ ] Add-ons modulares (SMS, Marketing, CRM)
- [ ] API pública para integraciones externas

### Mejoras Técnicas

- [ ] Cache de verificaciones de módulos (Redis)
- [ ] Rate limiting en funciones críticas
- [ ] Notificaciones real-time con Supabase Realtime
- [ ] Export de datos de uso para analytics
- [ ] Sistema de backups automáticos
- [ ] Disaster recovery plan

---

## Soporte

Para soporte técnico o preguntas sobre el sistema de suscripciones:

- **Documentación**: Ver archivos en `/docs`
- **Tests**: Ejecutar scripts en `/scripts`
- **Issues**: Reportar en el sistema de tickets interno

---

**Última actualización**: 2025-12-02
**Versión**: 1.0.0
**Mantenido por**: Equipo PideAI
