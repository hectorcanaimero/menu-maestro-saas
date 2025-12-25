# 📋 Plan de Acción - Corrección de Problemas Detectados por TestSprite

**Fecha:** 2025-12-25
**Preparado para:** Yenny
**Revisado por:** Carlos
**Basado en:** Auditoría TestSprite del 2025-12-17
**Tasa de aprobación actual:** 10.53% (2/19 tests)
**Objetivo:** Alcanzar >80% de tests aprobados

---

## ⚠️ ANTES DE EMPEZAR - LEE ESTO PRIMERO

**MUY IMPORTANTE:**

1. **🔒 Ambiente de Testing**
   - Ejecutar SOLO en ambiente de **DEVELOPMENT/STAGING**
   - **NO ejecutar directamente en PRODUCCIÓN** sin testing previo
   - Hacer backup de la base de datos antes de cualquier cambio SQL

2. **📝 Nuevo Flujo de Onboarding (NO TOCAR)**
   - Este plan NO afecta el nuevo onboarding implementado recientemente:
     - `/onboarding/personal` - Información personal
     - `/onboarding/business` - Información del negocio
     - `/onboarding/subdomain` - Validación y creación de tienda
   - Estos archivos están funcionando correctamente
   - **NO modificar estos archivos** a menos que haya bugs específicos reportados

3. **🛠️ Herramientas Necesarias**
   - Mantener DevTools del navegador abierto (F12) durante todo el debugging
   - Consola de Supabase abierta para ejecutar SQL
   - Acceso a logs de Supabase para verificar errores

4. **📞 Soporte**
   - Si encuentras algún problema, reporta inmediatamente a Carlos o Alejandro
   - Documenta cualquier error con screenshots de la consola

---

## 🎯 Resumen Ejecutivo

La auditoría de TestSprite reveló **4 problemas críticos** que están afectando el 89.47% de los tests:

1. **🛒 CARRITO ROTO** - Los clientes NO pueden agregar productos (CRÍTICO para el negocio)
2. **Columna faltante** `social_instagram` en la tabla `stores`
3. **Políticas RLS incorrectas** en la tabla `exchange_rates`
4. **Datos de suscripción faltantes** en las tablas `subscriptions` y `subscription_plans`

---

## 🚨 Prioridad 1: CRÍTICO - Arreglar AHORA (Día 1)

### Tarea 1.1: 🛒 Arreglar Funcionalidad del Carrito (MÁS CRÍTICO)
**Archivos:**
- `src/contexts/CartContext.tsx`
- `src/pages/ProductDetail.tsx`

**Tiempo estimado:** 30-45 minutos
**Impacto:** ⚠️ CRÍTICO PARA EL NEGOCIO - Sin carrito = CERO VENTAS

**¿Por qué es tan crítico?**
Los clientes no pueden agregar productos al carrito. Esto bloquea:
- ❌ Checkout flow
- ❌ Creación de órdenes
- ❌ WhatsApp notifications
- ❌ Analytics tracking
- ❌ TODO el proceso de ventas

**Pasos:**

1. **Agregar logging detallado al CartContext:**

Abre el archivo `src/contexts/CartContext.tsx` y busca la función `addToCart`. Reemplázala completamente con esta versión que tiene logging:

```typescript
const addToCart = useCallback((item: CartItem) => {
  try {
    console.log('🛒 [Cart] ========== ADD TO CART START ==========');
    console.log('[Cart] Item to add:', JSON.stringify(item, null, 2));
    console.log('[Cart] Current cart state:', JSON.stringify(cart, null, 2));

    const existingItemIndex = cart.findIndex(
      (cartItem) => cartItem.cartItemId === item.cartItemId
    );

    let updatedCart: CartItem[];

    if (existingItemIndex > -1) {
      console.log('[Cart] ✓ Item already exists at index:', existingItemIndex);
      console.log('[Cart] Current quantity:', cart[existingItemIndex].quantity);
      console.log('[Cart] Adding quantity:', item.quantity);

      updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += item.quantity;

      console.log('[Cart] New quantity:', updatedCart[existingItemIndex].quantity);
    } else {
      console.log('[Cart] ✓ Adding NEW item to cart');
      updatedCart = [...cart, item];
    }

    console.log('[Cart] Updated cart:', JSON.stringify(updatedCart, null, 2));

    // Guardar en localStorage
    try {
      const cartString = JSON.stringify(updatedCart);
      console.log('[Cart] Attempting to save to localStorage...');
      console.log('[Cart] Cart string length:', cartString.length);

      localStorage.setItem('cart', cartString);

      console.log('[Cart] ✅ Successfully saved to localStorage');

      // Verificar que se guardó correctamente
      const savedCart = localStorage.getItem('cart');
      console.log('[Cart] Verification - localStorage contains:', savedCart ? 'YES' : 'NO');

    } catch (storageError) {
      console.error('[Cart] ❌ ERROR saving to localStorage:', storageError);
      toast.error('Error al guardar el carrito. Verifica el espacio disponible.');
      return;
    }

    setCart(updatedCart);
    toast.success(`${item.name} agregado al carrito`);
    console.log('[Cart] ✅ Cart state updated successfully');
    console.log('🛒 [Cart] ========== ADD TO CART END ==========');

  } catch (error) {
    console.error('❌ [Cart] CRITICAL ERROR in addToCart:', error);
    console.error('[Cart] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    toast.error('Error al agregar producto al carrito');
  }
}, [cart, setCart]);
```

2. **Verificar ProductDetail.tsx:**

Abre `src/pages/ProductDetail.tsx` y busca la función `handleAddToCart`. Asegúrate de que se vea así:

```typescript
const handleAddToCart = () => {
  console.log('🛍️ [ProductDetail] ========== HANDLE ADD TO CART ==========');
  console.log('[ProductDetail] Product:', product);
  console.log('[ProductDetail] Selected extras:', selectedExtras);

  const cartItem: CartItem = {
    cartItemId: `${product.id}-${JSON.stringify(selectedExtras)}`,
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1,
    image_url: product.image_url,
    extras: selectedExtras,
    notes: '',
  };

  console.log('[ProductDetail] Cart item constructed:', JSON.stringify(cartItem, null, 2));
  console.log('[ProductDetail] Calling addToCart...');

  addToCart(cartItem);

  console.log('[ProductDetail] addToCart called successfully');

  // COMENTAR ESTA LÍNEA TEMPORALMENTE PARA DEBUGGING
  // navigate(-1);

  console.log('🛍️ [ProductDetail] ========== HANDLE ADD TO CART END ==========');
};
```

3. **Probar el carrito y capturar logs:**

   a. Abre el navegador y presiona F12 para abrir DevTools

   b. Ve a la pestaña "Console"

   c. Limpia la consola (botón 🚫 o Ctrl+L)

   d. Ve a un producto y haz clic en "Agregar al carrito"

   e. **CAPTURA TODO lo que aparece en la consola** (copia y pega en un archivo de texto)

   f. Ve a DevTools → Application → Local Storage → http://localhost:8081

   g. Busca la key `cart` y verifica si tiene datos

   h. Toma screenshot de lo que ves

4. **Reportar resultados:**

Después de probar, responde estas preguntas:
- ¿Aparecen los logs en la consola? (SÍ/NO)
- ¿Hay algún error en rojo? (Si sí, copia el mensaje completo)
- ¿Se guarda algo en localStorage con key "cart"? (SÍ/NO)
- ¿El contador del carrito se actualiza? (SÍ/NO)
- ¿Aparece el toast "agregado al carrito"? (SÍ/NO)

**Criterio de éxito:**
- ✅ Los productos se agregan al carrito exitosamente
- ✅ El contador del carrito se actualiza visualmente
- ✅ Los datos persisten en localStorage
- ✅ NO hay errores en la consola del navegador
- ✅ El toast de confirmación aparece

---

### Tarea 1.2: Agregar Columna Faltante en Base de Datos
**Archivo:** Supabase SQL Editor
**Tiempo estimado:** 5 minutos
**Impacto:** Afecta los 19 tests

**Pasos:**
1. Abre el Supabase SQL Editor para el proyecto
2. Ejecuta el siguiente SQL:

```sql
-- Agregar columna social_instagram a la tabla stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS social_instagram VARCHAR(255);
```

3. Verifica que la columna se creó correctamente:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stores' AND column_name = 'social_instagram';
```

**Criterio de éxito:** ✅ La columna existe en la tabla `stores`

---

### Tarea 1.2: Corregir Políticas RLS de Exchange Rates
**Archivo:** Supabase SQL Editor
**Tiempo estimado:** 15 minutos
**Impacto:** Afecta los 19 tests, bloquea conversión de moneda

**Pasos:**
1. Elimina las políticas RLS existentes en `exchange_rates`:

```sql
-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Enable read access for all users" ON exchange_rates;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON exchange_rates;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON exchange_rates;
```

2. Crea nuevas políticas que permitan a los dueños de tiendas gestionar sus tasas de cambio:

```sql
-- Política de lectura: todos pueden leer
CREATE POLICY "Anyone can read exchange rates"
ON exchange_rates
FOR SELECT
USING (true);

-- Política de inserción: dueños de tiendas pueden insertar sus propias tasas
CREATE POLICY "Store owners can insert their exchange rates"
ON exchange_rates
FOR INSERT
WITH CHECK (
  store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
  )
);

-- Política de actualización: dueños de tiendas pueden actualizar sus propias tasas
CREATE POLICY "Store owners can update their exchange rates"
ON exchange_rates
FOR UPDATE
USING (
  store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
  )
);

-- Política de eliminación: dueños de tiendas pueden eliminar sus propias tasas
CREATE POLICY "Store owners can delete their exchange rates"
ON exchange_rates
FOR DELETE
USING (
  store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
  )
);
```

3. Otorga permisos a usuarios autenticados:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON exchange_rates TO authenticated;
```

**Criterio de éxito:** ✅ No hay errores RLS al actualizar tasas de cambio (error 42501 eliminado)

---

### Tarea 1.3: Crear Datos de Suscripción Iniciales
**Archivo:** Supabase SQL Editor
**Tiempo estimado:** 20 minutos
**Impacto:** Afecta 17 tests, desbloquea feature gating

**Pasos:**
1. Verifica si la tabla `subscription_plans` existe y tiene datos:

```sql
SELECT * FROM subscription_plans LIMIT 5;
```

2. Si está vacía o no existe, crea los planes de suscripción:

```sql
-- Insertar planes de suscripción básicos
INSERT INTO subscription_plans (name, catalog_view_limit, price, features, description)
VALUES
  (
    'Free',
    100,
    0,
    '{"basic_features": true, "products": 10, "orders": 50}',
    'Plan gratuito con funcionalidades básicas'
  ),
  (
    'Pro',
    1000,
    29.99,
    '{"advanced_features": true, "products": 100, "orders": 500, "analytics": true}',
    'Plan profesional con análisis avanzado'
  ),
  (
    'Enterprise',
    -1,
    99.99,
    '{"unlimited": true, "products": -1, "orders": -1, "priority_support": true}',
    'Plan empresarial con todo ilimitado'
  )
ON CONFLICT (name) DO NOTHING;
```

3. Asigna suscripción "Free" a todas las tiendas existentes que no tengan una:

```sql
-- Crear suscripciones activas para tiendas sin suscripción
INSERT INTO subscriptions (store_id, subscription_plan_id, status, start_date, end_date)
SELECT
  s.id AS store_id,
  (SELECT id FROM subscription_plans WHERE name = 'Free' LIMIT 1) AS subscription_plan_id,
  'active' AS status,
  NOW() AS start_date,
  NOW() + INTERVAL '1 year' AS end_date
FROM stores s
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions
  WHERE store_id = s.id AND status = 'active'
);
```

4. Verifica que las suscripciones se crearon:

```sql
SELECT
  s.name AS store_name,
  sp.name AS plan_name,
  sub.status,
  sub.start_date
FROM stores s
JOIN subscriptions sub ON s.id = sub.store_id
JOIN subscription_plans sp ON sub.subscription_plan_id = sp.id
WHERE sub.status = 'active';
```

**Criterio de éxito:** ✅ Todas las tiendas tienen una suscripción activa, no hay error PGRST116

---

### Tarea 1.4: Arreglar Funcionalidad del Carrito
**Archivos:**
- `src/contexts/CartContext.tsx`
- `src/pages/ProductDetail.tsx`

**Tiempo estimado:** 30-45 minutos
**Impacto:** CRÍTICO - Bloquea checkout, órdenes, WhatsApp, analytics (4 tests)

**Pasos:**

1. **Agregar logging detallado al CartContext:**

Abre el archivo `src/contexts/CartContext.tsx` y modifica la función `addToCart`:

```typescript
const addToCart = useCallback((item: CartItem) => {
  try {
    console.log('[Cart] 🛒 Adding item to cart:', item);
    console.log('[Cart] Current cart state:', cart);

    const existingItemIndex = cart.findIndex(
      (cartItem) => cartItem.cartItemId === item.cartItemId
    );

    let updatedCart: CartItem[];

    if (existingItemIndex > -1) {
      console.log('[Cart] Item already exists, updating quantity');
      updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += item.quantity;
    } else {
      console.log('[Cart] Adding new item to cart');
      updatedCart = [...cart, item];
    }

    console.log('[Cart] Updated cart:', updatedCart);

    // Guardar en localStorage
    try {
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      console.log('[Cart] ✅ Saved to localStorage successfully');
    } catch (storageError) {
      console.error('[Cart] ❌ Error saving to localStorage:', storageError);
      toast.error('Error al guardar el carrito');
      return;
    }

    setCart(updatedCart);
    toast.success(`${item.name} agregado al carrito`);
    console.log('[Cart] ✅ Cart state updated successfully');

  } catch (error) {
    console.error('[Cart] ❌ Critical error in addToCart:', error);
    toast.error('Error al agregar producto al carrito');
  }
}, [cart, setCart]);
```

2. **Verificar ProductDetail.tsx:**

Abre `src/pages/ProductDetail.tsx` y verifica que el botón "Agregar al carrito" está llamando correctamente a `addToCart`:

```typescript
// Busca la función handleAddToCart y asegúrate de que se ve así:
const handleAddToCart = () => {
  console.log('[ProductDetail] Adding to cart with extras:', selectedExtras);

  const cartItem: CartItem = {
    cartItemId: `${product.id}-${JSON.stringify(selectedExtras)}`, // ID único
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1,
    image_url: product.image_url,
    extras: selectedExtras,
    notes: '',
  };

  console.log('[ProductDetail] Cart item to add:', cartItem);
  addToCart(cartItem);

  // No redireccionar inmediatamente - dar tiempo para que se agregue
  // navigate(-1); // COMENTAR ESTA LÍNEA TEMPORALMENTE
};
```

3. **Probar el carrito:**
   - Abre el navegador con DevTools (F12)
   - Ve a la pestaña Console
   - Intenta agregar un producto al carrito
   - Revisa los logs que aparecen
   - Captura cualquier error que aparezca

4. **Verificar localStorage:**
   - Abre DevTools → Application → Local Storage
   - Verifica que la key `cart` existe y tiene datos válidos

**Criterio de éxito:**
✅ Los productos se agregan al carrito exitosamente
✅ El contador del carrito se actualiza
✅ Los datos persisten en localStorage
✅ No hay errores en la consola

---

## ⚡ Prioridad 2: ALTA - Arreglar Esta Semana (Días 2-3)

### Tarea 2.1: Arreglar Navegación del Admin Panel
**Archivos:**
- `src/components/admin/AppSidebar.tsx`
- `src/App.tsx`

**Tiempo estimado:** 30 minutos
**Impacto:** Impide acceso a Pedidos, Zonas de Entrega (2 tests)

**Pasos:**

1. Abre `src/App.tsx` y verifica que estas rutas existen:

```typescript
// Busca estas rutas en App.tsx:
<Route path="/admin/orders" element={...} />
<Route path="/admin/settings" element={...} />
```

2. Abre `src/components/admin/AppSidebar.tsx` y verifica la configuración del menú:

```typescript
// Asegúrate de que estos items existen en el sidebar:
{
  title: "Pedidos",
  url: "/admin/orders",
  icon: ShoppingBag,
},
{
  title: "Configuración",
  url: "/admin/settings",
  icon: Settings,
},
```

3. Verifica que no hay condiciones que oculten estos items del menú

4. Prueba accediendo directamente a las URLs:
   - `/admin/orders`
   - `/admin/settings`

**Criterio de éxito:**
✅ El menú "Pedidos" es visible y clickeable
✅ El menú "Configuración" es accesible
✅ No hay errores 404 en estas rutas

---

### Tarea 2.2: Arreglar Rutas de Autenticación
**Archivos:**
- `src/App.tsx`
- `src/pages/Auth.tsx`

**Tiempo estimado:** 20 minutos
**Impacto:** Bloquea testing de autenticación (2 tests)

**Pasos:**

1. Verifica que la ruta `/auth` está accesible públicamente:

```typescript
// En App.tsx, la ruta debe estar FUERA del ProtectedRoute:
<Route path="/auth" element={<Auth />} />
```

2. Agrega un link visible de "Iniciar Sesión" en la página principal:

En `src/pages/Index.tsx` o `src/components/catalog/Header.tsx`:

```typescript
<Button asChild>
  <Link to="/auth">Iniciar Sesión</Link>
</Button>
```

3. Prueba:
   - Acceder a `/auth` directamente en el navegador
   - Hacer clic en el botón desde la página principal

**Criterio de éxito:**
✅ La página `/auth` es accesible sin errores
✅ Hay un link visible para llegar a la autenticación

---

### Tarea 2.3: Actualizar Función RPC get_store_by_subdomain_secure
**Archivo:** Supabase SQL Editor
**Tiempo estimado:** 15 minutos
**Impacto:** Mejora performance y elimina fallback queries

**Pasos:**

1. Busca la función `get_store_by_subdomain_secure` en Supabase:

```sql
-- Ver la función actual
SELECT prosrc FROM pg_proc WHERE proname = 'get_store_by_subdomain_secure';
```

2. Actualiza la función para manejar `social_instagram` correctamente:

```sql
CREATE OR REPLACE FUNCTION get_store_by_subdomain_secure(p_subdomain TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  subdomain TEXT,
  owner_id UUID,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  description TEXT,
  currency TEXT,
  operating_modes TEXT[],
  is_food_business BOOLEAN,
  social_instagram TEXT,
  -- agregar otros campos según sean necesarios
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.subdomain,
    s.owner_id,
    s.email,
    s.phone,
    s.address,
    s.logo_url,
    s.description,
    s.currency,
    s.operating_modes,
    s.is_food_business,
    COALESCE(s.social_instagram, '') AS social_instagram, -- manejar NULL
    s.created_at,
    s.updated_at
  FROM stores s
  WHERE s.subdomain = p_subdomain
  LIMIT 1;
END;
$$;
```

**Criterio de éxito:**
✅ No hay errores "column s.social_instagram does not exist"
✅ La función retorna datos correctamente

---

## 🔄 Prioridad 3: MEDIA - Arreglar Próxima Semana (Días 4-7)

### Tarea 3.1: Implementar Página 404 para Subdominios Inválidos
**Archivos:**
- `src/pages/NotFound.tsx`
- `src/contexts/StoreContext.tsx`

**Tiempo estimado:** 45 minutos
**Impacto:** Mejora UX cuando subdomain no existe

**Pasos:**

1. Mejora la página `NotFound.tsx` para manejar subdominios inválidos
2. En `StoreContext.tsx`, detecta cuando una tienda no existe y redirige a 404
3. Agrega mensaje amigable: "Esta tienda no existe o fue eliminada"

**Criterio de éxito:**
✅ Subdominios inválidos muestran página 404 en vez de error del navegador

---

### Tarea 3.2: Arreglar Integración de Chatwoot
**Archivos:**
- `src/hooks/useChatwoot.ts`
- `src/pages/admin/AdminDashboard.tsx`

**Tiempo estimado:** 30 minutos
**Impacto:** Soporte en tiempo real para administradores

**Pasos:**

1. Verifica configuración de Chatwoot en `useChatwoot.ts`
2. Asegúrate de que el widget se carga solo en rutas `/admin/*`
3. Prueba con DevTools para ver errores de carga del script

**Criterio de éxito:**
✅ El widget de Chatwoot aparece en el admin dashboard
✅ No hay errores de carga en la consola

---

### Tarea 3.3: Verificar Extras de Productos
**Archivos:**
- `src/components/catalog/ProductExtrasDialog.tsx`
- `src/pages/ProductDetail.tsx`

**Tiempo estimado:** 1 hora
**Impacto:** Permite personalización de productos

**Pasos:**

1. Verifica que productos en la BD tienen `product_extras` configurados
2. Asegúrate de que `ProductExtrasDialog` se renderiza correctamente
3. Prueba agregar productos con extras al carrito

**Criterio de éxito:**
✅ Productos con extras muestran diálogo de selección
✅ Extras se agregan correctamente al carrito

---

## 📊 Métricas de Éxito

Después de completar las tareas de Prioridad 1 y 2:

| Métrica | Actual | Esperado |
|---------|--------|----------|
| Tests Aprobados | 2/19 (10.53%) | 15/19 (78.95%) |
| Errores Críticos de BD | 3 | 0 |
| Carrito Funcional | ❌ No | ✅ Sí |
| Admin Panel Accesible | ❌ Parcial | ✅ Completo |
| Conversión de Moneda | ❌ No | ✅ Sí |

---

## 🔍 Cómo Verificar que Todo Funciona

### Checklist de Verificación Final

#### Base de Datos:
- [ ] Columna `social_instagram` existe en tabla `stores`
- [ ] Políticas RLS de `exchange_rates` permiten inserts/updates
- [ ] Todas las tiendas tienen una suscripción activa
- [ ] No hay errores en logs de Supabase

#### Aplicación:
- [ ] Agregar producto al carrito funciona
- [ ] Contador del carrito se actualiza
- [ ] Checkout es accesible
- [ ] Conversión USD/VES funciona sin errores
- [ ] Admin → Pedidos es accesible
- [ ] Admin → Configuración es accesible
- [ ] Página `/auth` carga correctamente
- [ ] Subdominios inválidos muestran 404

#### Re-ejecutar Tests:
```bash
# Desde la carpeta testsprite_tests, volver a correr los tests
# y verificar que el porcentaje de aprobación sube a >75%
```

---

## ⚠️ Notas Importantes

1. **Backup de Base de Datos:** Antes de ejecutar cualquier SQL, haz un backup de la BD
2. **Ambiente de Testing:** Ejecuta estos cambios primero en development/staging
3. **Logs:** Mantén abierta la consola del navegador mientras pruebas
4. **Comunicación:** Reporta cualquier error que encuentres inmediatamente

---

## 📞 Soporte

Si encuentras algún problema o tienes dudas:
1. Revisa los logs de la consola del navegador (F12)
2. Revisa los logs de Supabase
3. Consulta el archivo `testsprite-mcp-test-report.md` para detalles técnicos
4. Contacta a Carlos o Alejandro para asistencia

---

**Preparado por:** Carlos (Claude Code)
**Última actualización:** 2025-12-25
**Versión:** 1.0
