# Testing Checklist - Sistema de Suscripciones

## Índice

1. [Pre-requisitos](#pre-requisitos)
2. [Tests de Base de Datos](#tests-de-base-de-datos)
3. [Tests de Frontend - Store Admin](#tests-de-frontend---store-admin)
4. [Tests de Frontend - Platform Admin](#tests-de-frontend---platform-admin)
5. [Tests de Integración](#tests-de-integración)
6. [Tests de Seguridad](#tests-de-seguridad)
7. [Tests de Performance](#tests-de-performance)
8. [Tests de Regresión](#tests-de-regresión)
9. [Escenarios de Edge Cases](#escenarios-de-edge-cases)
10. [Checklist Final de Deployment](#checklist-final-de-deployment)

---

## Pre-requisitos

Antes de comenzar los tests, asegurar que:

- [ ] Migraciones ejecutadas exitosamente
  ```bash
  # Verificar en Supabase SQL Editor
  SELECT * FROM subscription_plans;
  -- Debe retornar 4 planes: trial, basic, pro, enterprise
  ```

- [ ] Funciones creadas correctamente
  ```sql
  SELECT routine_name FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name LIKE '%subscription%' OR routine_name LIKE '%module%';
  ```

- [ ] Triggers activos
  ```sql
  SELECT tgname, tgenabled FROM pg_trigger
  WHERE tgname LIKE '%subscription%' OR tgname LIKE '%limit%';
  ```

- [ ] RLS policies habilitadas
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('subscription_plans', 'subscriptions', 'payment_validations', 'platform_admins');
  -- Todas deben tener rowsecurity = true
  ```

- [ ] Super admin creado
  ```sql
  SELECT * FROM platform_admins WHERE role = 'super_admin';
  -- Debe existir al menos uno
  ```

- [ ] Ambiente de testing con datos de prueba
  - 3-5 tiendas con diferentes estados
  - Suscripciones en diferentes planes
  - Algunos pagos pendientes
  - Algunos módulos habilitados/deshabilitados

---

## Tests de Base de Datos

### Test 1: Creación Automática de Trial

**Objetivo**: Verificar que al crear una tienda se crea automáticamente suscripción trial.

**Pasos**:
1. Crear nueva tienda en Supabase o mediante UI
   ```sql
   INSERT INTO stores (name, subdomain, owner_id, is_active)
   VALUES (
     'Test Store Trial',
     'test-trial-' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8),
     (SELECT id FROM auth.users LIMIT 1),
     true
   )
   RETURNING id;
   ```

2. Esperar 1 segundo (para que trigger ejecute)

3. Verificar suscripción creada
   ```sql
   SELECT status, plan_id, trial_ends_at
   FROM subscriptions
   WHERE store_id = 'id-de-la-tienda-creada';
   ```

**Resultado esperado**:
- ✅ Status = 'trial'
- ✅ trial_ends_at = NOW() + 30 días (aproximadamente)
- ✅ plan_id corresponde al plan 'trial'

4. Verificar créditos AI
   ```sql
   SELECT monthly_credits, credits_used_this_month
   FROM store_ai_credits
   WHERE store_id = 'id-de-la-tienda-creada';
   ```

**Resultado esperado**:
- ✅ monthly_credits = 5
- ✅ credits_used_this_month = 0

---

### Test 2: Validación de Límite de Productos

**Objetivo**: Verificar que no se pueden agregar productos más allá del límite del plan.

**Pasos**:
1. Identificar una tienda en plan trial (límite: 50 productos)
   ```sql
   SELECT s.store_id, COUNT(mi.id) as current_products
   FROM subscriptions s
   LEFT JOIN menu_items mi ON mi.store_id = s.store_id
   WHERE s.status = 'trial'
   GROUP BY s.store_id
   LIMIT 1;
   ```

2. Si tiene menos de 50 productos, agregar productos hasta alcanzar 50

3. Intentar agregar producto #51
   ```sql
   INSERT INTO menu_items (store_id, category_id, name, price, is_available)
   VALUES (
     'store-id',
     (SELECT id FROM categories WHERE store_id = 'store-id' LIMIT 1),
     'Test Product Over Limit',
     10.00,
     true
   );
   ```

**Resultado esperado**:
- ❌ Query debe fallar con error: "Has alcanzado el límite de productos de tu plan"

4. Verificar que el producto NO se insertó
   ```sql
   SELECT COUNT(*) FROM menu_items WHERE store_id = 'store-id';
   -- Debe ser 50, no 51
   ```

---

### Test 3: Validación de Acceso a Módulos

**Objetivo**: Verificar que la función `has_module_enabled()` funciona correctamente.

**Pasos**:
1. Tienda en plan Trial (WhatsApp no incluido)
   ```sql
   SELECT has_module_enabled('store-id-trial', 'whatsapp');
   -- Debe retornar false
   ```

2. Tienda en plan Pro (WhatsApp incluido)
   ```sql
   SELECT has_module_enabled('store-id-pro', 'whatsapp');
   -- Debe retornar true
   ```

3. Tienda con módulo habilitado manualmente
   ```sql
   -- Habilitar WhatsApp para tienda en trial
   UPDATE subscriptions
   SET enabled_modules = '{"whatsapp": true}'::jsonb
   WHERE store_id = 'store-id-trial';

   -- Verificar acceso
   SELECT has_module_enabled('store-id-trial', 'whatsapp');
   -- Ahora debe retornar true
   ```

4. Tienda con suscripción suspendida
   ```sql
   UPDATE subscriptions SET status = 'suspended' WHERE store_id = 'store-id-trial';

   SELECT has_module_enabled('store-id-trial', 'whatsapp');
   -- Debe retornar false (suscripción no activa)
   ```

---

### Test 4: Aprobar Pago

**Objetivo**: Verificar que `approve_payment()` actualiza correctamente la suscripción.

**Pasos**:
1. Crear solicitud de pago
   ```sql
   INSERT INTO payment_validations (
     subscription_id,
     amount,
     payment_date,
     payment_method,
     reference_number,
     status,
     requested_plan_id
   )
   SELECT
     s.id,
     29.00,
     CURRENT_DATE,
     'bank_transfer',
     'TEST-PAYMENT-001',
     'pending',
     (SELECT id FROM subscription_plans WHERE name = 'basic')
   FROM subscriptions s
   WHERE s.store_id = 'store-id-trial'
   RETURNING id;
   ```

2. Aprobar el pago
   ```sql
   SELECT approve_payment(
     'payment-id-creado',
     (SELECT id FROM platform_admins WHERE role = 'super_admin' LIMIT 1),
     'Test approval - automated testing'
   );
   ```

**Resultado esperado**:
- ✅ Retorna `{"success": true}`

3. Verificar cambios en suscripción
   ```sql
   SELECT status, plan_id
   FROM subscriptions
   WHERE store_id = 'store-id-trial';
   ```

**Resultado esperado**:
- ✅ status = 'active'
- ✅ plan_id = ID del plan 'basic'

4. Verificar cambios en payment_validation
   ```sql
   SELECT status, reviewed_by, reviewed_at
   FROM payment_validations
   WHERE id = 'payment-id-creado';
   ```

**Resultado esperado**:
- ✅ status = 'approved'
- ✅ reviewed_by = ID del admin
- ✅ reviewed_at = timestamp reciente

5. Verificar audit log
   ```sql
   SELECT action, performed_by
   FROM subscription_audit_log
   WHERE subscription_id = (SELECT id FROM subscriptions WHERE store_id = 'store-id-trial')
   ORDER BY created_at DESC
   LIMIT 1;
   ```

**Resultado esperado**:
- ✅ action = 'payment_approved'
- ✅ performed_by = ID del admin

---

### Test 5: Rechazar Pago

**Objetivo**: Verificar que `reject_payment()` actualiza el pago pero NO la suscripción.

**Pasos**:
1. Crear otra solicitud de pago (mismo proceso que Test 4, paso 1)

2. Rechazar el pago
   ```sql
   SELECT reject_payment(
     'payment-id-creado',
     (SELECT id FROM platform_admins WHERE role = 'super_admin' LIMIT 1),
     'Invalid payment proof - automated testing'
   );
   ```

**Resultado esperado**:
- ✅ Retorna `{"success": true}`

3. Verificar que suscripción NO cambió
   ```sql
   SELECT status, plan_id
   FROM subscriptions
   WHERE store_id = 'store-id-trial';
   ```

**Resultado esperado**:
- ✅ status sigue siendo el mismo (no cambió a 'active')
- ✅ plan_id sigue siendo el mismo

4. Verificar que payment_validation se actualizó
   ```sql
   SELECT status, reviewed_by, admin_notes
   FROM payment_validations
   WHERE id = 'payment-id-creado';
   ```

**Resultado esperado**:
- ✅ status = 'rejected'
- ✅ reviewed_by = ID del admin
- ✅ admin_notes contiene el texto de rechazo

---

### Test 6: Estadísticas de Uso

**Objetivo**: Verificar que `get_store_usage_stats()` retorna datos correctos.

**Pasos**:
1. Contar recursos manualmente
   ```sql
   SELECT
     (SELECT COUNT(*) FROM menu_items WHERE store_id = 'store-id') as products,
     (SELECT COUNT(*) FROM categories WHERE store_id = 'store-id') as categories,
     (SELECT COUNT(*) FROM orders WHERE store_id = 'store-id'
      AND created_at >= date_trunc('month', NOW())) as orders_this_month,
     (SELECT credits_used_this_month FROM store_ai_credits
      WHERE store_id = 'store-id') as ai_used;
   ```

2. Obtener stats mediante función
   ```sql
   SELECT get_store_usage_stats('store-id');
   ```

3. Comparar resultados

**Resultado esperado**:
- ✅ products.current coincide con conteo manual
- ✅ categories.current coincide con conteo manual
- ✅ orders_this_month.current coincide con conteo manual
- ✅ ai_credits.used coincide con conteo manual
- ✅ Los límites corresponden al plan actual

---

## Tests de Frontend - Store Admin

### Test 7: Visualizar Suscripción Actual

**Objetivo**: Verificar que el hook `useSubscription()` carga datos correctamente.

**Pasos**:
1. Loguearse como dueño de tienda
2. Navegar a `/admin/settings?tab=subscription`
3. Verificar que se muestra:
   - ✅ Nombre del plan actual
   - ✅ Status de la suscripción
   - ✅ Fecha de fin del período
   - ✅ Días restantes (si está en trial)
   - ✅ Estadísticas de uso (productos, órdenes, categorías, créditos AI)
   - ✅ Barras de progreso reflejan uso vs límite correctamente

4. Abrir DevTools Console y verificar:
   ```javascript
   // No debe haber errores
   // Queries deben completar exitosamente
   ```

---

### Test 8: Solicitud de Upgrade

**Objetivo**: Verificar que se puede crear solicitud de pago desde UI.

**Pasos**:
1. Estar logueado como dueño de tienda en trial
2. Click en "Upgrade" o "Ver Planes"
3. Seleccionar plan "Basic"
4. Completar formulario de pago:
   - ✅ Monto: $29.00 (autocompletado)
   - ✅ Método de pago: Seleccionar "Transferencia Bancaria"
   - ✅ Número de referencia: Ingresar "TEST-REF-123"
   - ✅ Comprobante: Subir imagen (opcional)
   - ✅ Click en "Enviar Solicitud"

5. Verificar toast/mensaje de éxito
   - ✅ "Solicitud enviada correctamente"

6. Verificar en base de datos
   ```sql
   SELECT * FROM payment_validations
   WHERE subscription_id = (SELECT id FROM subscriptions WHERE store_id = 'tu-store-id')
   ORDER BY created_at DESC
   LIMIT 1;
   ```

**Resultado esperado**:
- ✅ Registro existe
- ✅ status = 'pending'
- ✅ amount = 29.00
- ✅ reference_number = 'TEST-REF-123'

---

### Test 9: Bloqueo por Límite de Productos

**Objetivo**: Verificar que UI bloquea agregar productos cuando se alcanza el límite.

**Pasos**:
1. Tienda en trial con 49 productos (uno menos del límite)
2. Navegar a `/admin/menu-items`
3. Click en "Agregar Producto"
4. Completar formulario y guardar
   - ✅ Producto se crea exitosamente
   - ✅ Toast: "Producto creado"

5. Intentar agregar otro producto (el #51)
   - ✅ UI muestra alerta: "Has alcanzado el límite de productos"
   - ✅ Botón "Guardar" está deshabilitado o muestra mensaje
   - ✅ Link a "Upgrade de Plan" presente

6. Alternativamente, si se permite el intento:
   - ❌ Backend rechaza con error 400
   - ✅ Toast error: "Límite de productos alcanzado"

---

### Test 10: Acceso a Módulo WhatsApp (Sin Acceso)

**Objetivo**: Verificar que se muestra componente `ModuleNotAvailable` cuando no hay acceso.

**Pasos**:
1. Tienda en plan trial (sin WhatsApp)
2. Navegar a `/admin/settings?tab=whatsapp`
3. Verificar que se muestra:
   - ✅ Ícono de candado
   - ✅ Título: "Módulo WhatsApp No Disponible"
   - ✅ Descripción del módulo
   - ✅ Botón "Ver Planes" o "Solicitar Módulo"
   - ✅ NO se muestra el formulario de configuración de WhatsApp

---

### Test 11: Acceso a Módulo WhatsApp (Con Acceso)

**Objetivo**: Verificar acceso correcto cuando el módulo está habilitado.

**Pasos**:
1. Habilitar WhatsApp para la tienda (manual o upgrade a Pro)
   ```sql
   UPDATE subscriptions
   SET enabled_modules = '{"whatsapp": true}'::jsonb
   WHERE store_id = 'tu-store-id';
   ```

2. Refrescar la página `/admin/settings?tab=whatsapp`
3. Verificar que se muestra:
   - ✅ Formulario de configuración de WhatsApp
   - ✅ Campos: API URL, API Key, Instance Name, etc.
   - ✅ NO se muestra componente `ModuleNotAvailable`

---

## Tests de Frontend - Platform Admin

### Test 12: Acceso al Panel de Administración

**Objetivo**: Verificar que solo platform admins pueden acceder.

**Pasos**:
1. Como usuario normal (dueño de tienda), navegar a `/platform-admin`
   - ✅ Redirect a página de "Acceso Denegado"
   - ✅ O redirect a `/admin` (panel de tienda)

2. Como platform admin (super_admin), navegar a `/platform-admin`
   - ✅ Se carga el dashboard correctamente
   - ✅ Se muestra sidebar con menú de navegación
   - ✅ Se muestra badge con rol del admin

---

### Test 13: Dashboard de Platform Admin

**Objetivo**: Verificar que métricas se muestran correctamente.

**Pasos**:
1. Estar logueado como super_admin
2. Navegar a `/platform-admin`
3. Verificar cards de métricas:
   - ✅ "Total de Tiendas" muestra número correcto
   - ✅ "Tiendas en Trial" muestra número correcto
   - ✅ "Pagos Pendientes" muestra número correcto
   - ✅ "Ingresos Mensuales" muestra monto correcto

4. Verificar widget "Tiendas Recientes":
   - ✅ Muestra últimas 5 tiendas
   - ✅ Información completa (nombre, subdomain, plan, fecha)

5. Verificar widget "Trials por Expirar":
   - ✅ Muestra trials que expiran en próximos 7 días
   - ✅ Badge rojo/amarillo según días restantes
   - ✅ Ordenado por fecha de expiración

---

### Test 14: Vista de Tiendas

**Objetivo**: Verificar que se listan todas las tiendas.

**Pasos**:
1. Navegar a `/platform-admin/stores`
2. Verificar tabla:
   - ✅ Muestra todas las tiendas del sistema
   - ✅ Columnas correctas (nombre, subdomain, owner, plan, status)
   - ✅ Paginación funciona (si hay muchas tiendas)
   - ✅ Búsqueda funciona (buscar por nombre o subdomain)

3. Click en "Ver Detalles" de una tienda:
   - ✅ Muestra información completa
   - ✅ Historial de suscripciones
   - ✅ Estadísticas de uso

---

### Test 15: Validar Pago - Aprobar

**Objetivo**: Verificar flujo de aprobación de pago desde UI.

**Pasos**:
1. Crear solicitud de pago de prueba (ver Test 8 o crear manualmente en DB)
2. Como super_admin, navegar a `/platform-admin/payments`
3. Verificar que aparece la solicitud pendiente
4. Click en "Ver Comprobante" (si existe)
   - ✅ Se abre imagen o modal con comprobante
5. Click en "Aprobar"
6. En el modal de confirmación:
   - ✅ Mostrar resumen del pago
   - ✅ Campo para notas del admin
   - ✅ Agregar nota: "Test approval"
   - ✅ Click en "Confirmar Aprobación"

7. Verificar resultado:
   - ✅ Toast: "Pago aprobado exitosamente"
   - ✅ Pago desaparece de lista de pendientes
   - ✅ En base de datos, payment status = 'approved'
   - ✅ Suscripción actualizada a plan solicitado

---

### Test 16: Validar Pago - Rechazar

**Objetivo**: Verificar flujo de rechazo de pago desde UI.

**Pasos**:
1. Similar a Test 15, pero click en "Rechazar"
2. En el modal de confirmación:
   - ✅ Seleccionar razón: "Comprobante inválido"
   - ✅ Agregar nota: "Test rejection - invalid proof"
   - ✅ Click en "Confirmar Rechazo"

3. Verificar resultado:
   - ✅ Toast: "Pago rechazado"
   - ✅ Pago desaparece de lista de pendientes (o se marca como rechazado)
   - ✅ En base de datos, payment status = 'rejected'
   - ✅ Suscripción NO cambió

---

### Test 17: Habilitar Módulo Manualmente

**Objetivo**: Verificar que admin puede habilitar módulos desde UI.

**Pasos**:
1. Navegar a `/platform-admin/subscriptions`
2. Buscar tienda en trial (sin WhatsApp)
3. Click en "Editar" o "Gestionar Módulos"
4. En el modal/página:
   - ✅ Ver checkboxes para módulos: WhatsApp, Delivery
   - ✅ Ambos desmarcados (plan trial no los incluye)
   - ✅ Marcar checkbox "WhatsApp"
   - ✅ Agregar nota: "Test manual module enablement"
   - ✅ Click en "Guardar"

5. Verificar resultado:
   - ✅ Toast: "Módulos actualizados"
   - ✅ En base de datos:
     ```sql
     SELECT enabled_modules FROM subscriptions WHERE store_id = 'store-id';
     -- Debe mostrar: {"whatsapp": true}
     ```
   - ✅ La tienda ahora puede acceder a `/admin/settings?tab=whatsapp`

---

### Test 18: Gestión de Administradores

**Objetivo**: Verificar CRUD de administradores (solo super_admin).

**Pasos**:
1. Como super_admin, navegar a `/platform-admin/admins`
   - ✅ Se muestra lista de administradores

2. Click en "Agregar Administrador"
   - ✅ Modal con formulario
   - ✅ Campo email (con búsqueda de usuarios existentes)
   - ✅ Dropdown de rol: super_admin, billing, support
   - ✅ Seleccionar rol "billing"
   - ✅ Click en "Crear"

3. Verificar resultado:
   - ✅ Toast: "Administrador creado"
   - ✅ Aparece en la lista
   - ✅ En base de datos existe el registro

4. Cambiar rol:
   - ✅ Click en "Editar"
   - ✅ Cambiar rol a "support"
   - ✅ Guardar
   - ✅ Rol actualizado

5. Desactivar admin:
   - ✅ Click en "Desactivar"
   - ✅ Confirmar
   - ✅ Admin marcado como inactivo
   - ✅ Ese usuario ya no puede acceder a `/platform-admin`

6. Como admin de rol "billing", intentar acceder a `/platform-admin/admins`
   - ❌ Acceso denegado o menú no visible (solo super_admin)

---

## Tests de Integración

### Test 19: Flujo Completo - Trial a Active

**Objetivo**: Simular flujo real desde creación de tienda hasta suscripción activa.

**Pasos**:
1. **Registrar nueva tienda**:
   - Usuario se registra en la plataforma
   - Crea su tienda
   - ✅ Automáticamente se crea suscripción trial de 30 días
   - ✅ Recibe 5 créditos AI

2. **Usar la plataforma en trial**:
   - Agregar categorías (hasta el límite)
   - Agregar productos (hasta el límite)
   - Recibir órdenes
   - Usar créditos AI
   - ✅ Todo funciona correctamente dentro de los límites

3. **Intentar exceder límite**:
   - Intentar agregar producto #51
   - ✅ Se bloquea con mensaje de límite alcanzado
   - ✅ Se sugiere upgrade

4. **Solicitar upgrade**:
   - Usuario navega a sección de planes
   - Selecciona plan "Basic" ($29)
   - Realiza pago por transferencia bancaria
   - Sube comprobante
   - Crea solicitud
   - ✅ Solicitud aparece como "pending"

5. **Admin valida pago**:
   - Admin ve solicitud en panel
   - Verifica comprobante
   - Aprueba el pago
   - ✅ Suscripción cambia a "active"
   - ✅ Plan cambia a "basic"
   - ✅ Límites se actualizan

6. **Usuario continúa usando**:
   - Puede agregar más productos (nuevo límite: 200)
   - Puede crear más categorías
   - Recibe más créditos AI (20 mensuales)
   - ✅ Todo funciona con nuevos límites

---

### Test 20: Flujo Completo - Habilitar Módulo

**Objetivo**: Simular flujo de habilitación de módulo WhatsApp.

**Pasos**:
1. **Usuario en plan Basic intenta acceder a WhatsApp**:
   - Navega a `/admin/settings?tab=whatsapp`
   - ✅ Ve mensaje "Módulo no disponible"
   - ✅ Ve botón "Solicitar Módulo"

2. **Solicitar módulo**:
   - Click en "Solicitar Módulo"
   - Selecciona "WhatsApp"
   - Realiza pago adicional ($10)
   - Sube comprobante
   - ✅ Solicitud creada

3. **Admin habilita módulo**:
   - Admin ve solicitud
   - Verifica pago
   - Habilita módulo manualmente
   - ✅ `enabled_modules` actualizado

4. **Usuario puede usar WhatsApp**:
   - Refrescar página
   - ✅ Ahora ve formulario de configuración
   - Puede configurar Evolution API
   - Puede gestionar drivers
   - ✅ Todo funciona correctamente

---

## Tests de Seguridad

### Test 21: RLS - Store Admin No Puede Ver Otras Suscripciones

**Objetivo**: Verificar que RLS policies funcionan correctamente.

**Pasos**:
1. Crear 2 tiendas con diferentes owners:
   - Tienda A (owner: user-a@test.com)
   - Tienda B (owner: user-b@test.com)

2. Loguearse como user-a@test.com
3. Intentar leer suscripción de Tienda B:
   ```javascript
   const { data, error } = await supabase
     .from('subscriptions')
     .select('*')
     .eq('store_id', 'tienda-b-id');
   ```

**Resultado esperado**:
- ✅ `data` está vacío o error de permisos
- ✅ NO puede leer datos de otra tienda

4. Intentar actualizar suscripción de Tienda B:
   ```javascript
   const { error } = await supabase
     .from('subscriptions')
     .update({ status: 'active' })
     .eq('store_id', 'tienda-b-id');
   ```

**Resultado esperado**:
- ❌ Error de permisos
- ✅ NO puede modificar otra suscripción

---

### Test 22: RLS - Platform Admin Puede Ver Todo

**Objetivo**: Verificar que platform admins tienen acceso completo.

**Pasos**:
1. Loguearse como platform admin
2. Leer todas las suscripciones:
   ```javascript
   const { data, error } = await supabase
     .from('subscriptions')
     .select('*');
   ```

**Resultado esperado**:
- ✅ Retorna TODAS las suscripciones
- ✅ Sin errores

3. Actualizar cualquier suscripción:
   ```javascript
   const { error } = await supabase
     .from('subscriptions')
     .update({ status: 'active' })
     .eq('id', 'cualquier-subscription-id');
   ```

**Resultado esperado**:
- ✅ Actualiza sin errores (si admin tiene rol adecuado)

---

### Test 23: Funciones SECURITY DEFINER

**Objetivo**: Verificar que funciones con SECURITY DEFINER no se pueden explotar.

**Pasos**:
1. Como usuario normal (no admin), intentar aprobar pago directamente:
   ```javascript
   const { data, error } = await supabase.rpc('approve_payment', {
     p_payment_id: 'payment-id',
     p_admin_id: auth.user.id, // Usuario normal
     p_notes: 'Trying to exploit'
   });
   ```

**Resultado esperado**:
- ❌ Error: "No tienes permisos para aprobar pagos"
- ✅ La función valida internamente que p_admin_id sea platform admin

2. Como billing admin, intentar cambiar rol de otro admin:
   ```javascript
   const { error } = await supabase
     .from('platform_admins')
     .update({ role: 'super_admin' })
     .eq('user_id', 'otro-admin-id');
   ```

**Resultado esperado**:
- ❌ Error de permisos (solo super_admin puede modificar)

---

### Test 24: Inyección SQL

**Objetivo**: Verificar que funciones RPC son seguras contra SQL injection.

**Pasos**:
1. Intentar SQL injection en `has_module_enabled`:
   ```javascript
   const { data, error } = await supabase.rpc('has_module_enabled', {
     p_store_id: "'; DROP TABLE subscriptions; --",
     p_module_name: 'whatsapp'
   });
   ```

**Resultado esperado**:
- ✅ No ejecuta SQL malicioso
- ✅ Retorna error o false (parámetros tipados previenen inyección)

2. Intentar en `get_store_usage_stats`:
   ```javascript
   const { data, error } = await supabase.rpc('get_store_usage_stats', {
     p_store_id: "' OR '1'='1"
   });
   ```

**Resultado esperado**:
- ✅ No retorna datos de otras tiendas
- ✅ Parámetros tipados previenen inyección

---

## Tests de Performance

### Test 25: Carga de Dashboard con Muchas Tiendas

**Objetivo**: Verificar que dashboard carga rápido incluso con muchas tiendas.

**Pre-requisito**: Base de datos con 100+ tiendas (usar seed script)

**Pasos**:
1. Navegar a `/platform-admin`
2. Medir tiempo de carga con DevTools Network tab
3. Verificar queries ejecutadas

**Resultado esperado**:
- ✅ Dashboard carga en < 2 segundos
- ✅ Queries utilizan índices apropiados
- ✅ No hay N+1 queries

---

### Test 26: Validación de Límites con Muchos Productos

**Objetivo**: Verificar que trigger de validación no ralentiza inserciones.

**Pasos**:
1. Tienda con 45 productos (cerca del límite de 50)
2. Medir tiempo de inserción:
   ```sql
   EXPLAIN ANALYZE
   INSERT INTO menu_items (store_id, category_id, name, price, is_available)
   VALUES ('store-id', 'category-id', 'Test Product', 10.00, true);
   ```

**Resultado esperado**:
- ✅ Inserción completa en < 100ms
- ✅ Trigger ejecuta rápidamente

---

## Tests de Regresión

### Test 27: Módulos Existentes No Afectados

**Objetivo**: Verificar que sistema de suscripción no rompió funcionalidades existentes.

**Pasos**:
1. **Orders**:
   - Crear orden en tienda con suscripción activa
   - ✅ Orden se crea correctamente
   - ✅ No hay errores relacionados con suscripción

2. **WhatsApp (si ya estaba integrado)**:
   - Enviar mensaje de prueba
   - ✅ Funciona correctamente (si tiene módulo habilitado)

3. **AI Enhancement**:
   - Procesar imagen con IA
   - ✅ Descuenta créditos correctamente
   - ✅ No permite usar más créditos que los disponibles

4. **Delivery (si ya estaba integrado)**:
   - Crear orden con delivery
   - ✅ Funciona correctamente (si tiene módulo habilitado)

---

### Test 28: Migraciones Idempotentes

**Objetivo**: Verificar que migraciones se pueden ejecutar múltiples veces sin errores.

**Pasos**:
1. Ejecutar migraciones de suscripción por primera vez
   - ✅ Todo se crea correctamente

2. Ejecutar las mismas migraciones nuevamente
   - ✅ No hay errores
   - ✅ `CREATE TABLE IF NOT EXISTS` previene duplicados
   - ✅ `CREATE OR REPLACE FUNCTION` actualiza funciones

3. Verificar que datos no se duplicaron:
   ```sql
   SELECT COUNT(*) FROM subscription_plans;
   -- Debe ser 4, no 8
   ```

---

## Escenarios de Edge Cases

### Test 29: Trial Expirado

**Objetivo**: Verificar comportamiento cuando trial expira.

**Pasos**:
1. Crear suscripción trial con fecha de expiración pasada:
   ```sql
   UPDATE subscriptions
   SET trial_ends_at = NOW() - INTERVAL '1 day',
       current_period_end = NOW() - INTERVAL '1 day'
   WHERE store_id = 'test-store-id';
   ```

2. Intentar acceder como dueño de tienda:
   - ✅ Ve mensaje de suscripción expirada
   - ✅ No puede realizar acciones (agregar productos, etc.)
   - ✅ Ve call-to-action para renovar

3. Verificar función `is_subscription_valid`:
   ```sql
   SELECT is_subscription_valid('test-store-id');
   -- Debe retornar false
   ```

---

### Test 30: Pago Duplicado

**Objetivo**: Verificar que no se puede aprobar el mismo pago dos veces.

**Pasos**:
1. Crear solicitud de pago
2. Aprobar el pago una vez
   - ✅ Se actualiza suscripción

3. Intentar aprobar el mismo pago nuevamente:
   ```sql
   SELECT approve_payment('payment-id', 'admin-id', 'Second approval');
   ```

**Resultado esperado**:
- ❌ Error: "Payment not found or already processed"
- ✅ La función verifica que status sea 'pending'

---

### Test 31: Cambio de Plan Sin Pago

**Objetivo**: Verificar que admin puede cambiar plan manualmente sin pago.

**Pasos**:
1. Admin edita suscripción desde UI
2. Cambia plan de Trial a Pro sin solicitud de pago
3. Guarda cambios

**Resultado esperado**:
- ✅ Plan se actualiza inmediatamente
- ✅ Se registra en audit log
- ✅ Límites se actualizan
- ✅ NO se requiere payment_validation

---

### Test 32: Tienda Sin Suscripción

**Objetivo**: Verificar comportamiento si por algún error no hay suscripción.

**Pre-condición**: Deshabilitar trigger temporalmente y crear tienda

**Pasos**:
1. Verificar que tienda no tiene registro en `subscriptions`
2. Intentar acceder como dueño de la tienda:
   - ✅ Se muestra mensaje de error
   - ✅ Se ofrece contactar soporte

3. Verificar función `has_module_enabled`:
   ```sql
   SELECT has_module_enabled('store-sin-subscription', 'whatsapp');
   -- Debe retornar false
   ```

4. Admin crea suscripción manualmente:
   ```sql
   SELECT create_trial_subscription_for_store('store-sin-subscription');
   ```

**Resultado esperado**:
- ✅ Se crea suscripción trial
- ✅ Usuario puede continuar usando la plataforma

---

## Checklist Final de Deployment

Antes de desplegar a producción, verificar:

### Base de Datos
- [ ] Migraciones ejecutadas exitosamente en staging
- [ ] Todas las funciones creadas
- [ ] Todos los triggers activos
- [ ] RLS policies habilitadas en todas las tablas
- [ ] Índices creados para performance
- [ ] 4 planes de suscripción insertados
- [ ] Al menos un super admin creado

### Frontend
- [ ] Build exitoso sin errores TypeScript
- [ ] Todos los componentes de suscripción renderean correctamente
- [ ] useSubscription hook funciona en diferentes escenarios
- [ ] Panel de platform admin accesible solo para admins
- [ ] Componente ModuleNotAvailable se muestra correctamente
- [ ] Formularios de solicitud de pago funcionan

### Seguridad
- [ ] RLS policies probadas extensivamente
- [ ] Solo platform admins pueden acceder a `/platform-admin`
- [ ] Store owners solo ven su propia suscripción
- [ ] Funciones SECURITY DEFINER validan permisos
- [ ] No hay vulnerabilidades de SQL injection

### Integración
- [ ] Límites se validan correctamente en UI y backend
- [ ] Módulos se habilitan/deshabilitan correctamente
- [ ] WhatsApp y Delivery respetan has_module_enabled
- [ ] AI credits se consumen y resetean correctamente

### Documentación
- [ ] SUBSCRIPTION_SYSTEM.md actualizado
- [ ] SUPER_ADMIN_GUIDE.md disponible para admins
- [ ] Scripts de testing documentados
- [ ] README actualizado con información de suscripciones

### Comunicación
- [ ] Equipo capacitado en el nuevo sistema
- [ ] Super admins tienen acceso y conocen el panel
- [ ] Proceso de validación de pagos definido
- [ ] Email templates preparados (confirmación de pago, rechazo, etc.)
- [ ] Plan de comunicación a usuarios existentes

### Monitoreo
- [ ] Logs de auditoría revisables
- [ ] Alertas configuradas para pagos pendientes
- [ ] Dashboard de métricas funcional
- [ ] Proceso de backup configurado

---

## Notas Finales

Este checklist debe ser ejecutado en su totalidad antes de cada deployment mayor. Mantener un log de resultados de tests con fecha y responsable.

**Template de Log**:
```
Fecha: 2025-12-02
Tester: [Nombre]
Ambiente: [Staging/Production]
Versión: 1.0.0

Resultados:
- Tests DB: 6/6 ✅
- Tests Frontend Store: 5/5 ✅
- Tests Frontend Platform: 7/7 ✅
- Tests Integración: 2/2 ✅
- Tests Seguridad: 4/4 ✅
- Tests Performance: 2/2 ✅
- Tests Regresión: 2/2 ✅
- Edge Cases: 4/4 ✅

Total: 32/32 tests pasados ✅

Notas adicionales:
[Cualquier observación]
```

---

**Última actualización**: 2025-12-02
**Versión**: 1.0.0
**Mantenido por**: Equipo PideAI
