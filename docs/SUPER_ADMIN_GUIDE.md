# Guía del Super Administrador - PideAI

## Índice

1. [Introducción](#introducción)
2. [Acceso al Panel de Administración](#acceso-al-panel-de-administración)
3. [Dashboard Principal](#dashboard-principal)
4. [Gestión de Tiendas](#gestión-de-tiendas)
5. [Gestión de Suscripciones](#gestión-de-suscripciones)
6. [Validación de Pagos](#validación-de-pagos)
7. [Gestión de Planes](#gestión-de-planes)
8. [Gestión de Administradores](#gestión-de-administradores)
9. [Habilitación de Módulos](#habilitación-de-módulos)
10. [Tareas Comunes](#tareas-comunes)
11. [Troubleshooting](#troubleshooting)
12. [Mejores Prácticas](#mejores-prácticas)

---

## Introducción

Este documento es una guía completa para administradores de la plataforma PideAI. Como Super Administrador, tienes acceso completo a todas las funciones de administración de la plataforma, incluyendo:

- Gestión de todas las tiendas
- Validación de pagos
- Administración de suscripciones
- Configuración de planes
- Gestión de otros administradores
- Habilitación de módulos premium

### Roles de Administrador

La plataforma tiene 3 niveles de acceso administrativo:

| Rol | Permisos | Uso Recomendado |
|-----|----------|-----------------|
| **Super Admin** | Acceso completo a todas las funciones | Fundadores, CTO, CEO |
| **Billing** | Validación de pagos, gestión de suscripciones | Equipo de finanzas |
| **Support** | Vista de tiendas y soporte técnico | Equipo de soporte al cliente |

**Este documento está diseñado para Super Admins**, quienes tienen acceso a todas las funciones.

---

## Acceso al Panel de Administración

### URL de Acceso

```
https://tudominio.com/platform-admin
```

O en desarrollo:
```
http://localhost:8080/platform-admin
```

### Primer Acceso

Para crear tu primer Super Admin, sigue estos pasos:

1. **Crear usuario en Supabase Auth**:
   - Ve a Supabase Dashboard → Authentication → Users
   - Crea un nuevo usuario con tu email corporativo
   - Copia el User ID

2. **Ejecutar script de creación de admin**:
   ```sql
   -- En Supabase SQL Editor
   INSERT INTO platform_admins (user_id, role, is_active)
   VALUES (
     'tu-user-id-aqui',
     'super_admin',
     true
   );
   ```

3. **Verificar acceso**:
   - Cierra sesión si estás logueado
   - Inicia sesión con el email que configuraste
   - Navega a `/platform-admin`
   - Deberías ver el dashboard principal

### Seguridad

- Usa autenticación de dos factores (MFA) cuando esté disponible
- Cambia tu contraseña regularmente
- No compartas credenciales de Super Admin
- Usa emails corporativos, no personales
- Revisa el log de auditoría regularmente

---

## Dashboard Principal

El dashboard muestra métricas clave de la plataforma en tiempo real.

### Métricas Principales

#### 1. Total de Tiendas
- **Descripción**: Número total de tiendas registradas en la plataforma
- **Subtítulo**: Cuántas están activas (is_active = true)
- **Uso**: Monitorear crecimiento de la plataforma

#### 2. Tiendas en Trial
- **Descripción**: Tiendas con suscripción en período de prueba
- **Uso**: Identificar oportunidades de conversión
- **Acción**: Revisar lista de "Trials por Expirar" para hacer seguimiento

#### 3. Pagos Pendientes
- **Descripción**: Solicitudes de pago esperando validación
- **Uso**: Indicador de trabajo pendiente
- **Acción**: Ir a "Pagos Pendientes" para procesar

#### 4. Ingresos Mensuales
- **Descripción**: Proyección de ingresos recurrentes mensuales
- **Cálculo**: Suma de price_monthly de todas las suscripciones activas
- **Uso**: Tracking de revenue de la plataforma

### Widgets

#### Tiendas Recientes
- Muestra las últimas 5 tiendas registradas
- Información: Nombre, subdomain, plan, fecha de registro
- Click en subdomain para visitar la tienda
- Click en el plan para ver detalles de suscripción

#### Trials por Expirar
- Tiendas cuyo trial expira en los próximos 7 días
- Código de colores:
  - 🔴 Rojo: <= 3 días restantes (urgente)
  - 🟡 Amarillo: 4-7 días restantes
- **Acción recomendada**: Contactar al dueño para ofrecer upgrade

---

## Gestión de Tiendas

### Vista de Tiendas

Navega a **Tiendas** en el menú lateral.

#### Columnas

| Columna | Descripción |
|---------|-------------|
| Nombre | Nombre de la tienda |
| Subdomain | URL de acceso (ej: `restaurante1.pideai.com`) |
| Owner | Email del propietario |
| Plan | Plan de suscripción actual |
| Status | trial / active / past_due / suspended |
| Creada | Fecha de registro |
| Acciones | Botones de acción rápida |

#### Filtros Disponibles

- **Por Status**: Filtrar por estado de suscripción
- **Por Plan**: Filtrar por tipo de plan
- **Por Fecha**: Tiendas creadas en rango de fechas
- **Búsqueda**: Por nombre, subdomain o email del owner

#### Acciones Rápidas

##### Ver Detalles
- Información completa de la tienda
- Configuración actual
- Historial de suscripciones
- Uso de recursos

##### Editar Suscripción
- Cambiar plan manualmente
- Habilitar/deshabilitar módulos
- Extender período de prueba
- Cambiar estado

##### Suspender/Activar
- **Suspender**: Bloquea el acceso a la tienda (para no pago prolongado)
- **Activar**: Restaura el acceso
- Requiere confirmación
- Se registra en audit log

##### Ver como Cliente
- Abre la tienda pública en nueva pestaña
- Útil para verificar configuración
- No requiere autenticación

---

## Gestión de Suscripciones

Navega a **Suscripciones** en el menú lateral.

### Vista General

Tabla con todas las suscripciones de la plataforma.

#### Columnas

| Columna | Descripción |
|---------|-------------|
| Tienda | Nombre y subdomain |
| Plan | Plan actual |
| Status | Estado de la suscripción |
| Inicio | Fecha de inicio del período actual |
| Fin | Fecha de fin del período actual |
| Módulos | WhatsApp, Delivery habilitados |
| Acciones | Opciones disponibles |

#### Estados de Suscripción

| Estado | Significado | Acción Recomendada |
|--------|-------------|---------------------|
| `trial` | Período de prueba activo | Monitorear para conversión |
| `active` | Suscripción pagada y vigente | Ninguna (todo bien) |
| `pending_payment` | Esperando validación de pago | Revisar en Pagos Pendientes |
| `past_due` | Pago vencido | Contactar al cliente |
| `cancelled` | Cancelada por el usuario | Entender motivo de cancelación |
| `suspended` | Suspendida por admin | Verificar razón de suspensión |

### Acciones sobre Suscripciones

#### Cambiar Plan Manualmente

**Cuándo usar**: Cliente quiere downgrade/upgrade inmediato sin pago

**Pasos**:
1. Click en "Editar" en la suscripción
2. Seleccionar nuevo plan del dropdown
3. Opcional: Ajustar fecha de fin de período
4. Agregar nota explicativa (obligatorio)
5. Confirmar cambio

**Resultado**:
- Se actualiza `plan_id`
- Se registra en `subscription_audit_log`
- Se actualizan límites inmediatamente
- Se resetean créditos AI según nuevo plan

#### Extender Período de Prueba

**Cuándo usar**: Cliente necesita más tiempo para evaluar

**Pasos**:
1. Click en "Extender Trial"
2. Seleccionar nueva fecha de expiración
3. Agregar razón (ej: "Cliente solicitó extensión por vacaciones")
4. Confirmar

**Resultado**:
- Se actualiza `trial_ends_at`
- Se actualiza `current_period_end`
- Status permanece en `trial`

#### Habilitar Módulos Manualmente

Ver sección [Habilitación de Módulos](#habilitación-de-módulos).

#### Suspender Suscripción

**Cuándo usar**: No pago prolongado (30+ días)

**Pasos**:
1. Click en "Suspender"
2. Seleccionar razón:
   - No pago
   - Violación de términos
   - Solicitud del cliente
   - Otro (especificar)
3. Agregar notas adicionales
4. Confirmar

**Resultado**:
- Se actualiza status a `suspended`
- Se bloquea acceso a la tienda
- Se envía email de notificación (si configurado)
- Se registra en audit log

**Reverso**: Click en "Activar" para restaurar acceso

---

## Validación de Pagos

Navega a **Pagos Pendientes** en el menú lateral.

### Flujo de Validación

```
Cliente solicita upgrade → Realiza pago → Sube comprobante
                                                ↓
                                    Aparece en Pagos Pendientes
                                                ↓
                          Admin revisa comprobante y valida
                                                ↓
                                    ┌───────────┴───────────┐
                                Aprueba                  Rechaza
                                    ↓                        ↓
                        Suscripción se actualiza     Cliente recibe notificación
                        Cliente obtiene acceso        Puede reintentar
```

### Vista de Pagos Pendientes

#### Columnas

| Columna | Descripción |
|---------|-------------|
| Tienda | Nombre y subdomain |
| Monto | Cantidad pagada |
| Plan Solicitado | Plan que el cliente quiere |
| Método de Pago | bank_transfer, paypal, cash, other |
| Referencia | Número de referencia bancaria |
| Comprobante | Link al archivo subido |
| Fecha de Pago | Cuando realizó el pago |
| Solicitado | Cuando creó la solicitud |
| Acciones | Aprobar / Rechazar |

#### Filtros

- **Por Método de Pago**: bank_transfer, paypal, etc.
- **Por Monto**: Rango de montos
- **Por Fecha**: Rango de fechas
- **Por Plan**: Plan solicitado

### Aprobar Pago

**Pasos**:
1. Click en "Ver Comprobante" para verificar el pago
2. Validar que:
   - El monto coincide con el plan solicitado
   - La fecha de pago es reciente
   - El comprobante es legítimo
   - El número de referencia es válido (si aplica)
3. Click en "Aprobar"
4. Agregar notas (ej: "Pago verificado. Ref: TRANS-123456")
5. Confirmar aprobación

**Resultado**:
- Payment status → `approved`
- Subscription status → `active`
- Plan actualizado al solicitado
- Período extendido por 30 días
- Módulos solicitados habilitados (si se solicitaron)
- Se registra en audit log
- Cliente recibe confirmación (si email configurado)

### Rechazar Pago

**Cuándo usar**:
- Comprobante no es legítimo
- Monto no coincide
- Pago no se encuentra en el banco
- Duplicado (ya fue procesado)

**Pasos**:
1. Click en "Rechazar"
2. Seleccionar razón:
   - Comprobante inválido
   - Monto no coincide
   - Pago no encontrado
   - Duplicado
   - Otro (especificar)
3. Agregar notas explicativas (visible para el cliente)
4. Confirmar rechazo

**Resultado**:
- Payment status → `rejected`
- Subscription status permanece sin cambios
- Cliente puede reintentar con nuevo comprobante
- Se registra en audit log
- Cliente recibe notificación con razón

### Mejores Prácticas

✅ **DO**:
- Verificar siempre el comprobante antes de aprobar
- Agregar notas detalladas en cada validación
- Procesar pagos dentro de las 24 horas
- Confirmar referencias bancarias con el banco
- Contactar al cliente si hay dudas

❌ **DON'T**:
- Aprobar sin ver el comprobante
- Aprobar pagos de montos incorrectos
- Aprobar comprobantes claramente editados
- Aprobar sin agregar notas
- Procesar duplicados

---

## Gestión de Planes

Navega a **Planes** en el menú lateral.

### Vista de Planes

Muestra los 4 planes configurados:
- Trial ($0 - 30 días)
- Basic ($29/mes)
- Pro ($59/mes)
- Enterprise ($99/mes)

#### Información de cada Plan

- Nombre y precio
- Duración
- Límites (productos, órdenes, categorías, etc.)
- Módulos incluidos
- Features disponibles
- Estado (activo/inactivo)
- Número de tiendas con este plan

### Editar Plan

**Cuándo usar**: Ajustar límites o precio de un plan

**Pasos**:
1. Click en "Editar" en el plan
2. Modificar campos:
   - Display Name
   - Precio mensual
   - Límites (ver tabla abajo)
   - Módulos incluidos
   - Features
3. Agregar nota explicando el cambio
4. Confirmar

**Límites Configurables**:

| Límite | Descripción | Valor Especial |
|--------|-------------|----------------|
| `ai_monthly_credits` | Créditos AI mensuales | - |
| `max_products` | Productos máximos | `null` = ilimitado |
| `max_orders_per_month` | Órdenes por mes | `null` = ilimitado |
| `max_categories` | Categorías máximas | `null` = ilimitado |
| `has_kitchen_display` | Display de cocina | true/false |
| `has_analytics` | Analytics avanzado | true/false |
| `has_promotions` | Sistema de promociones | true/false |
| `has_coupons` | Sistema de cupones | true/false |

**Módulos Configurables**:

| Módulo | Descripción | Notas |
|--------|-------------|-------|
| `whatsapp` | Integración WhatsApp | Incluido en Pro y Enterprise |
| `delivery` | Sistema de delivery | Incluido en Pro y Enterprise |
| `ai_enhancement` | Estudio Fotográfico | Incluido en todos (varía créditos) |

**Importante**: Los cambios en límites afectan solo a nuevas suscripciones. Las existentes mantienen sus límites hasta renovación.

### Crear Nuevo Plan

**Cuándo usar**: Lanzar plan especial (ej: Plan Anual)

**Pasos**:
1. Click en "Crear Plan"
2. Completar formulario:
   - Name (slug, ej: `annual_pro`)
   - Display Name (ej: "Pro Anual")
   - Precio
   - Límites en JSON
   - Módulos en JSON
   - Features como array
3. Confirmar creación

**Resultado**: Nuevo plan disponible para asignación manual (no aparecerá automáticamente en el frontend para clientes).

### Desactivar Plan

**Cuándo usar**: Descontinuar un plan (ya no ofrecerlo a nuevos clientes)

**Pasos**:
1. Click en "Desactivar"
2. Confirmar

**Resultado**:
- `is_active` → false
- No se puede asignar a nuevas tiendas
- Tiendas existentes con este plan NO se afectan
- Sigue apareciendo en listados (filtrado como inactivo)

---

## Gestión de Administradores

Navega a **Administradores** en el menú lateral.

⚠️ **Solo accesible para Super Admins**

### Vista de Administradores

Lista de todos los usuarios con acceso administrativo.

#### Columnas

| Columna | Descripción |
|---------|-------------|
| Email | Email del admin |
| Rol | super_admin / billing / support |
| Estado | Activo / Inactivo |
| Creado | Fecha de creación |
| Creado por | Quién lo creó |
| Acciones | Editar / Desactivar |

### Crear Nuevo Administrador

**Pasos**:
1. Click en "Agregar Administrador"
2. Ingresar email del usuario
   - Debe existir en `auth.users`
   - Si no existe, crear primero en Supabase Auth
3. Seleccionar rol:
   - **Super Admin**: Acceso completo
   - **Billing**: Validación de pagos
   - **Support**: Vista de tiendas
4. Confirmar creación

**Resultado**:
- Se crea registro en `platform_admins`
- El usuario puede acceder a `/platform-admin`
- Se registra quién lo creó y cuándo

### Cambiar Rol

**Pasos**:
1. Click en "Editar" en el admin
2. Seleccionar nuevo rol
3. Agregar razón del cambio
4. Confirmar

**Resultado**:
- Se actualiza `role`
- Los permisos cambian inmediatamente
- Se registra en audit log

### Desactivar Administrador

**Cuándo usar**: Empleado dejó la empresa o cambio de rol

**Pasos**:
1. Click en "Desactivar"
2. Agregar razón (ej: "Empleado dejó la empresa")
3. Confirmar

**Resultado**:
- `is_active` → false
- Pierde acceso a `/platform-admin` inmediatamente
- El registro permanece (para auditoría)
- No se puede eliminar completamente (compliance)

### Reactivar Administrador

**Pasos**:
1. Filtrar por "Inactivos"
2. Click en "Activar" en el admin deseado
3. Confirmar

**Resultado**: `is_active` → true, acceso restaurado

---

## Habilitación de Módulos

Los módulos **WhatsApp** y **Delivery** son features premium que requieren pago adicional.

### Proceso de Habilitación

```
Cliente solicita módulo → Realiza pago adicional → Admin valida pago
                                                           ↓
                                              Admin habilita módulo manualmente
                                                           ↓
                                            Cliente puede usar el módulo
```

### Habilitar WhatsApp

**Precio sugerido**: $10 USD/mes adicional (si no incluido en plan)

**Pasos**:
1. Cliente solicita WhatsApp (puede ser por ticket o email)
2. Verificar que realizó el pago adicional
3. Ir a **Suscripciones**
4. Buscar la tienda del cliente
5. Click en "Editar"
6. En sección "Módulos", activar "WhatsApp"
7. Agregar nota: "WhatsApp habilitado. Pago verificado: $10 ref TRANS-XXX"
8. Confirmar

**SQL Directo** (alternativa):
```sql
UPDATE subscriptions
SET enabled_modules = jsonb_set(
  COALESCE(enabled_modules, '{}'::jsonb),
  '{whatsapp}',
  'true'::jsonb
),
updated_at = NOW()
WHERE store_id = 'id-de-la-tienda';
```

**Verificación**:
```sql
SELECT has_module_enabled('store-id', 'whatsapp'); -- Debe retornar true
```

**Resultado**:
- Cliente puede acceder a `/admin/settings?tab=whatsapp`
- Puede configurar Evolution API
- Puede gestionar drivers
- Políticas de RLS permiten acceso

### Habilitar Delivery

**Precio sugerido**: $10 USD/mes adicional (si no incluido en plan)

**Pasos**: Idénticos a WhatsApp, pero con módulo `delivery`

**SQL Directo**:
```sql
UPDATE subscriptions
SET enabled_modules = jsonb_set(
  COALESCE(enabled_modules, '{}'::jsonb),
  '{delivery}',
  'true'::jsonb
),
updated_at = NOW()
WHERE store_id = 'id-de-la-tienda';
```

**Resultado**:
- Cliente puede acceder a `/admin/settings?tab=delivery`
- Puede configurar zonas de delivery
- Puede gestionar costos de envío

### Deshabilitar Módulo

**Cuándo usar**: Cliente dejó de pagar el add-on

**Pasos**:
1. Ir a Suscripciones
2. Editar suscripción del cliente
3. Desactivar el módulo
4. Agregar nota: "Módulo deshabilitado por no renovación"
5. Confirmar

**SQL Directo**:
```sql
UPDATE subscriptions
SET enabled_modules = jsonb_set(
  enabled_modules,
  '{whatsapp}',
  'false'::jsonb
),
updated_at = NOW()
WHERE store_id = 'id-de-la-tienda';
```

**Resultado**:
- Cliente pierde acceso inmediato
- Configuración previa se mantiene (no se borra)
- Si reactiva después, recupera su configuración

### Verificar Módulos de una Tienda

**SQL**:
```sql
SELECT
  s.store_id,
  st.name as store_name,
  sp.name as plan_name,
  sp.modules as plan_modules,           -- Módulos incluidos en el plan
  s.enabled_modules as enabled_modules  -- Módulos habilitados manualmente
FROM subscriptions s
JOIN stores st ON st.id = s.store_id
JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE s.store_id = 'id-de-la-tienda';
```

**Interpretar resultado**:
- Si `plan_modules -> whatsapp` = true: Incluido en el plan
- Si `enabled_modules -> whatsapp` = true: Habilitado manualmente
- El cliente tiene acceso si **cualquiera** es true

---

## Tareas Comunes

### Dar Trial Extendido a Tienda Específica

**Escenario**: Cliente VIP quiere 60 días de trial

**SQL**:
```sql
UPDATE subscriptions
SET
  trial_ends_at = NOW() + INTERVAL '60 days',
  current_period_end = NOW() + INTERVAL '60 days',
  updated_at = NOW()
WHERE store_id = 'id-de-la-tienda'
AND status = 'trial';

-- Registrar en audit log
INSERT INTO subscription_audit_log (
  subscription_id, action, performed_by, reason
)
SELECT
  s.id,
  'trial_extended',
  'tu-admin-user-id',
  'Extended trial to 60 days for VIP client'
FROM subscriptions s
WHERE s.store_id = 'id-de-la-tienda';
```

### Migrar Tienda Existente a Plan Específico

**Escenario**: Quieres mover manualmente una tienda de Trial a Pro

**SQL**:
```sql
UPDATE subscriptions
SET
  plan_id = (SELECT id FROM subscription_plans WHERE name = 'pro'),
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '30 days',
  updated_at = NOW()
WHERE store_id = 'id-de-la-tienda';

-- Actualizar créditos AI según el nuevo plan
UPDATE store_ai_credits
SET
  monthly_credits = 100,  -- Pro plan tiene 100 créditos
  credits_used_this_month = 0,
  last_reset_date = NOW()
WHERE store_id = 'id-de-la-tienda';
```

### Aplicar Descuento Especial

**Escenario**: Cliente negoció $39 en lugar de $59 (Pro plan)

**Opción 1: Crear plan personalizado**
```sql
INSERT INTO subscription_plans (
  name, display_name, price_monthly, limits, modules, features
)
SELECT
  'pro_discounted',
  'Plan Pro (Descuento)',
  39.00,  -- Precio especial
  limits,
  modules,
  features
FROM subscription_plans
WHERE name = 'pro';

-- Asignar a la tienda
UPDATE subscriptions
SET plan_id = (SELECT id FROM subscription_plans WHERE name = 'pro_discounted')
WHERE store_id = 'id-de-la-tienda';
```

**Opción 2: Agregar nota y hacer seguimiento manual**
(Más simple pero requiere recordar el acuerdo)

### Dar Créditos AI Extra Sin Cambiar Plan

**Escenario**: Cliente necesita 10 créditos más este mes (sin upgrade)

**SQL**:
```sql
UPDATE store_ai_credits
SET monthly_credits = monthly_credits + 10
WHERE store_id = 'id-de-la-tienda';

-- Agregar nota en algún lado (ej: en admin_notes de payment_validations o crear sistema de notas)
```

### Reactivar Tienda Suspendida Después de Pago

**Escenario**: Cliente pagó deuda, quieres reactivar

**SQL**:
```sql
UPDATE subscriptions
SET
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '30 days',
  updated_at = NOW()
WHERE store_id = 'id-de-la-tienda'
AND status = 'suspended';

-- Registrar en audit log
INSERT INTO subscription_audit_log (
  subscription_id, action, performed_by, reason
)
SELECT
  s.id,
  'reactivated',
  'tu-admin-user-id',
  'Reactivated after payment received'
FROM subscriptions s
WHERE s.store_id = 'id-de-la-tienda';
```

### Ver Todas las Tiendas que Expiran Esta Semana

**SQL**:
```sql
SELECT
  st.name,
  st.subdomain,
  s.status,
  sp.display_name as plan,
  s.current_period_end,
  EXTRACT(DAY FROM (s.current_period_end - NOW())) as days_left,
  st.owner_id,
  u.email as owner_email
FROM subscriptions s
JOIN stores st ON st.id = s.store_id
JOIN subscription_plans sp ON sp.id = s.plan_id
LEFT JOIN auth.users u ON u.id = st.owner_id
WHERE s.current_period_end <= NOW() + INTERVAL '7 days'
AND s.status IN ('trial', 'active')
ORDER BY s.current_period_end ASC;
```

### Generar Reporte de Ingresos Mensuales

**SQL**:
```sql
SELECT
  sp.display_name as plan,
  COUNT(*) as active_subscriptions,
  sp.price_monthly as price_per_sub,
  (COUNT(*) * sp.price_monthly) as total_revenue
FROM subscriptions s
JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE s.status = 'active'
GROUP BY sp.id, sp.display_name, sp.price_monthly
ORDER BY total_revenue DESC;
```

---

## Troubleshooting

### Cliente Dice que no Puede Agregar Más Productos

**Diagnóstico**:
```sql
-- Ver límites y uso actual
SELECT get_store_usage_stats('store-id');

-- Resultado esperado:
{
  "products": {
    "current": 50,
    "limit": 50,      -- Cliente alcanzó el límite
    "unlimited": false
  }
}
```

**Solución 1**: Upgrade de plan
- Cliente debe upgradear a plan superior

**Solución 2**: Aumentar límite temporalmente
```sql
-- Crear plan personalizado con más límite
-- O habilitar temporalmente límite ilimitado
UPDATE subscriptions
SET plan_id = (SELECT id FROM subscription_plans WHERE name = 'pro')
WHERE store_id = 'store-id';
```

### Cliente Pagó pero Sigue en Trial

**Diagnóstico**:
```sql
-- Ver solicitudes de pago
SELECT * FROM payment_validations
WHERE subscription_id = (
  SELECT id FROM subscriptions WHERE store_id = 'store-id'
)
ORDER BY created_at DESC;
```

**Posibles causas**:
1. Pago no fue aprobado aún → Ir a Pagos Pendientes y aprobar
2. Pago fue rechazado → Contactar al cliente para aclaración
3. Cliente no subió comprobante → Pedirle que lo haga

**Solución**:
```sql
-- Si confirmas el pago, aprobar manualmente
SELECT approve_payment(
  'payment-validation-id',
  'tu-admin-user-id',
  'Pago confirmado manualmente por admin'
);
```

### Módulo WhatsApp no Aparece Habilitado

**Diagnóstico**:
```sql
-- Verificar módulos
SELECT
  sp.modules as plan_modules,
  s.enabled_modules
FROM subscriptions s
JOIN subscription_plans sp ON sp.id = s.plan_id
WHERE s.store_id = 'store-id';

-- Probar función directamente
SELECT has_module_enabled('store-id', 'whatsapp');
```

**Posibles causas**:
1. No está en el plan ni habilitado manualmente
2. Suscripción no está activa (expired, suspended)
3. Error en la función de verificación

**Solución**:
```sql
-- Habilitar manualmente
UPDATE subscriptions
SET enabled_modules = jsonb_set(
  COALESCE(enabled_modules, '{}'::jsonb),
  '{whatsapp}',
  'true'::jsonb
)
WHERE store_id = 'store-id';
```

### Cliente fue Suspendido por Error

**Diagnóstico**:
```sql
-- Ver historial de cambios
SELECT * FROM subscription_audit_log
WHERE subscription_id = (
  SELECT id FROM subscriptions WHERE store_id = 'store-id'
)
ORDER BY created_at DESC
LIMIT 10;
```

**Solución**:
```sql
-- Reactivar inmediatamente
UPDATE subscriptions
SET status = 'active', updated_at = NOW()
WHERE store_id = 'store-id';

-- Registrar la corrección
INSERT INTO subscription_audit_log (
  subscription_id, action, performed_by, reason
)
SELECT
  s.id,
  'reactivated',
  'tu-admin-user-id',
  'Suspended by mistake - reactivated'
FROM subscriptions s
WHERE s.store_id = 'store-id';
```

### Créditos AI no se Resetean

**Diagnóstico**:
```sql
-- Ver estado actual de créditos
SELECT * FROM store_ai_credits WHERE store_id = 'store-id';

-- Ver última fecha de reset
SELECT last_reset_date FROM store_ai_credits WHERE store_id = 'store-id';
```

**Solución manual**:
```sql
-- Resetear manualmente
UPDATE store_ai_credits
SET
  monthly_credits = (
    SELECT (sp.limits->>'ai_monthly_credits')::INTEGER
    FROM subscriptions s
    JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.store_id = 'store-id'
  ),
  credits_used_this_month = 0,
  last_reset_date = NOW()
WHERE store_id = 'store-id';
```

---

## Mejores Prácticas

### Comunicación con Clientes

✅ **DO**:
- Responder solicitudes de pago en <24 horas
- Explicar claramente razones de rechazo
- Ofrecer ayuda para resolver problemas
- Ser proactivo con trials que expiran pronto
- Documentar todas las conversaciones importantes

❌ **DON'T**:
- Aprobar pagos sin verificación
- Suspender sin previo aviso
- Ignorar solicitudes pendientes
- Cambiar planes sin documentar

### Seguridad

✅ **DO**:
- Usar MFA en cuenta de admin
- No compartir credenciales
- Revisar audit log regularmente
- Reportar actividad sospechosa
- Cerrar sesión al terminar

❌ **DON'T**:
- Dejar sesión abierta en computadora compartida
- Usar misma contraseña en múltiples sitios
- Dar acceso super_admin a todos
- Ejecutar SQL sin validar primero

### Gestión de Datos

✅ **DO**:
- Agregar notas en cada cambio manual
- Validar datos antes de modificar
- Hacer backup antes de cambios masivos
- Probar queries en dev primero
- Documentar acuerdos especiales

❌ **DON'T**:
- Modificar datos sin documentar
- Ejecutar UPDATE/DELETE sin WHERE
- Hacer cambios masivos sin validación
- Eliminar registros (usar soft delete)

### Soporte al Cliente

✅ **DO**:
- Entender el problema antes de actuar
- Verificar la identidad del cliente
- Proporcionar soluciones claras
- Hacer seguimiento después del fix
- Escalar cuando sea necesario

❌ **DON'T**:
- Asumir sin verificar
- Dar acceso sin validación de identidad
- Prometer lo que no puedes cumplir
- Ignorar solicitudes repetidas

---

## Recursos Adicionales

### Documentación Relacionada

- [SUBSCRIPTION_SYSTEM.md](./SUBSCRIPTION_SYSTEM.md) - Arquitectura técnica completa
- [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) - Procedimientos de testing
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Documentación de funciones RPC

### Scripts Útiles

- `docs/setup-subscription-system.sql` - Verificación de instalación
- `scripts/create-super-admin.sql` - Crear administradores
- `scripts/test-subscription-flow.sql` - Tests automáticos

### Contacto

Para dudas sobre este sistema:
- **Email técnico**: dev@tudominio.com
- **Slack**: #platform-admin
- **Emergencias**: +1-xxx-xxx-xxxx

---

**Última actualización**: 2025-12-02
**Versión**: 1.0.0
**Mantenido por**: Equipo PideAI
