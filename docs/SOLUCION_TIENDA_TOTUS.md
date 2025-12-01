# SOLUCIÓN: Aplicación se queda en "Verificando tienda" en DEV y PROD

## 1. DIAGNÓSTICO - CAUSA RAÍZ

### Problema Identificado
La aplicación se queda en estado de carga infinito o redirige a "crear tienda" tanto en desarrollo (localhost) como en producción.

### Causa Raíz
**NO EXISTE una tienda con subdomain "totus" en la base de datos de Supabase.**

### Arquitectura Actual
```
┌─────────────────────────────────────────────────────────────┐
│ 1. subdomain-validation.ts                                  │
│    getSubdomainFromHostname()                               │
│    - DEV: localStorage.getItem("dev_subdomain") || "totus"  │
│    - PROD: Extrae subdomain del hostname                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. StoreContext.tsx                                          │
│    loadStore() calls:                                        │
│    supabase.rpc('get_store_by_subdomain_secure', {          │
│      p_subdomain: 'totus'                                    │
│    })                                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. RPC: get_store_by_subdomain_secure (Supabase)            │
│    SELECT * FROM stores                                      │
│    WHERE subdomain = 'totus' AND is_active = true           │
│    RESULT: NULL (no existe)                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. StoreContext.tsx                                          │
│    setStore(null) → loading termina                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Index.tsx                                                 │
│    if (!store) { return "Tienda no encontrada" }            │
└─────────────────────────────────────────────────────────────┘
```

### Análisis del RPC
El RPC `get_store_by_subdomain_secure` está correctamente implementado:
- ✅ Rate limiting: 20 intentos por 15 minutos
- ✅ Logging de accesos
- ✅ Security: SECURITY DEFINER con search_path protegido
- ✅ Permisos: Otorgados a authenticated y anon

El problema NO es el RPC, sino la ausencia de datos.

---

## 2. SOLUCIÓN IMPLEMENTADA

### Migración Creada
**Archivo**: `/Users/al3jandro/project/pideai/app/supabase/migrations/20251130000000_insert_dev_store_totus.sql`

**Contenido**:
- Inserta tienda de desarrollo "totus" con subdomain fijo
- UUID fijo para desarrollo: `00000000-0000-0000-0000-000000000001`
- Owner UUID placeholder: `00000000-0000-0000-0000-000000000000`
- Categorías de ejemplo: Entradas, Platos Principales, Bebidas, Postres
- Productos de ejemplo para cada categoría
- Horarios de tienda predeterminados (Lun-Vie 9am-6pm, Sáb 10am-2pm)
- Configuración completa con todos los campos necesarios

### Datos de la Tienda "totus"
```sql
subdomain: 'totus'
name: 'Totus - Tienda de Desarrollo'
is_active: true
operating_modes: ['delivery', 'pickup', 'digital_menu']
force_status: 'normal'
currency: 'USD'
primary_color: '#FF6B6B'
price_color: '#4ECDC4'
```

### Características ON CONFLICT
```sql
ON CONFLICT (subdomain) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  operating_modes = EXCLUDED.operating_modes,
  updated_at = NOW();
```
- Si la tienda ya existe, se actualiza para asegurar que esté activa
- Evita errores de duplicación

---

## 3. VALIDACIÓN DE SEGURIDAD (Security Agent)

### RLS Policies - APROBADAS ✅
```sql
-- Lectura pública: Solo tiendas activas
CREATE POLICY "Stores are publicly readable if active"
ON stores FOR SELECT USING (is_active = true);

-- Dueños pueden ver sus tiendas (incluso inactivas)
CREATE POLICY "Store owners can view their stores"
ON stores FOR SELECT USING (owner_id = auth.uid());

-- Solo usuarios autenticados pueden crear
CREATE POLICY "Authenticated users can create stores"
ON stores FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Solo dueños pueden actualizar
CREATE POLICY "Store owners can update their stores"
ON stores FOR UPDATE USING (owner_id = auth.uid());
```

### Riesgos de Seguridad - MITIGADOS ⚠️
1. **Owner ID placeholder**: El `owner_id` es un UUID de ceros
   - ✅ MITIGADO: Documentado claramente como SOLO DESARROLLO
   - ✅ MITIGADO: Comentarios advierten sobre uso en producción
   - 🔔 ACCIÓN REQUERIDA: En desarrollo real, actualizar owner_id a un usuario válido

2. **Datos de ejemplo en producción**
   - ✅ MITIGADO: Header de migración advierte claramente
   - ✅ MITIGADO: Recomendaciones incluidas para producción
   - 🔔 ACCIÓN REQUERIDA: Eliminar tienda "totus" en producción o no ejecutar esta migración

3. **Rate Limiting**
   - ✅ Implementado: 20 intentos por 15 minutos
   - ✅ Identificador: IP address o user_id
   - ✅ Logging: Todos los intentos quedan registrados

---

## 4. PASOS PARA APLICAR LA SOLUCIÓN

### Opción A: Aplicar migración localmente (Supabase CLI)

```bash
# 1. Navegar al directorio del proyecto
cd /Users/al3jandro/project/pideai/app

# 2. Verificar conexión con Supabase
supabase status

# 3. Aplicar migraciones pendientes
supabase db push

# 4. Verificar que la tienda se creó correctamente
# Conectar a psql o usar Supabase Dashboard
# SELECT * FROM stores WHERE subdomain = 'totus';
```

### Opción B: Aplicar migración en producción (Dashboard de Supabase)

⚠️ **NO RECOMENDADO** - Esta migración es solo para desarrollo

Si aún así deseas aplicarla en producción:
1. Ir a Supabase Dashboard → SQL Editor
2. Copiar contenido de `20251130000000_insert_dev_store_totus.sql`
3. Ejecutar el SQL
4. **IMPORTANTE**: Actualizar el `owner_id` a un usuario real:
   ```sql
   UPDATE stores
   SET owner_id = 'TU-USER-UUID-AQUI'
   WHERE subdomain = 'totus';
   ```

### Opción C: Aplicar migración mediante supabase CLI remoto

```bash
# 1. Vincular con proyecto de producción
supabase link --project-ref wdpexjymbiyjqwdttqhz

# 2. Aplicar solo esta migración
supabase db push

# 3. Verificar en Dashboard
```

---

## 5. VALIDACIÓN POST-IMPLEMENTACIÓN

### Tests de Validación en DEV

1. **Test 1: Verificar carga de tienda**
   ```bash
   # Iniciar dev server
   npm run dev

   # Abrir http://localhost:8080
   # Esperar: La tienda debe cargar correctamente
   # NO debe mostrar "Verificando tienda" infinitamente
   # NO debe redirigir a /create-store
   ```

2. **Test 2: Verificar localStorage**
   ```javascript
   // En DevTools Console
   localStorage.getItem('dev_subdomain') || 'totus'
   // Debe retornar: "totus"
   ```

3. **Test 3: Verificar RPC**
   ```javascript
   // En DevTools Console
   const { data, error } = await supabase.rpc('get_store_by_subdomain_secure', {
     p_subdomain: 'totus',
     p_ip_address: undefined
   });
   console.log('Data:', data);
   console.log('Error:', error);
   // Esperar: data[0].store_data debe contener la tienda
   // Esperar: data[0].rate_limit_ok debe ser true
   // Esperar: data[0].error_message debe ser null
   ```

4. **Test 4: Verificar categorías y productos**
   ```bash
   # La página principal debe mostrar:
   # - 4 categorías (Entradas, Platos Principales, Bebidas, Postres)
   # - 4 productos de ejemplo
   ```

5. **Test 5: Verificar acceso admin**
   ```bash
   # 1. Crear un usuario en Supabase Auth
   # 2. Actualizar owner_id:
   #    UPDATE stores SET owner_id = 'TU-USER-UUID' WHERE subdomain = 'totus';
   # 3. Iniciar sesión en la app
   # 4. Navegar a /admin
   # Esperar: Acceso permitido al panel de administración
   ```

### Tests de Validación en PROD

⚠️ **IMPORTANTE**: Solo si decidiste aplicar en producción

1. **Test 1: Verificar subdomain routing**
   ```bash
   # Abrir https://totus.pideai.com
   # Esperar: La tienda debe cargar correctamente
   ```

2. **Test 2: Verificar que otros subdomains no se afecten**
   ```bash
   # Probar otros subdomains existentes
   # Esperar: Funcionamiento normal sin cambios
   ```

3. **Test 3: Rate limiting**
   ```bash
   # Hacer más de 20 requests en 15 minutos
   # Esperar: Mensaje "Too many requests. Please try again later."
   ```

---

## 6. TROUBLESHOOTING

### Problema: Migración falla con "constraint violation"
**Causa**: La tabla `stores` tiene constraints de formato de subdomain

**Solución**:
```sql
-- Verificar constraints
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
AND constraint_name LIKE '%subdomain%';

-- Si falla, verificar que 'totus' cumple:
-- - Mínimo 3 caracteres ✅
-- - Máximo 63 caracteres ✅
-- - Solo lowercase, números y guiones ✅
-- - No comienza/termina con guión ✅
-- - No tiene guiones consecutivos ✅
```

### Problema: "Store not found" después de migración
**Causa**: RPC no encuentra la tienda por is_active=false

**Solución**:
```sql
-- Verificar que la tienda está activa
SELECT subdomain, is_active FROM stores WHERE subdomain = 'totus';

-- Si is_active es false, activar:
UPDATE stores SET is_active = true WHERE subdomain = 'totus';
```

### Problema: "Rate limit exceeded"
**Causa**: Demasiados intentos de acceso

**Solución**:
```sql
-- Limpiar rate limit logs
DELETE FROM rate_limit_log
WHERE identifier LIKE '%anonymous%'
AND action_type = 'store_access';

-- O esperar 15 minutos
```

### Problema: Acceso admin denegado
**Causa**: owner_id no coincide con tu usuario

**Solución**:
```sql
-- 1. Obtener tu user ID
SELECT id, email FROM auth.users WHERE email = 'tu-email@ejemplo.com';

-- 2. Actualizar owner_id
UPDATE stores
SET owner_id = 'TU-USER-UUID'
WHERE subdomain = 'totus';
```

---

## 7. RECOMENDACIONES FINALES

### Para Desarrollo Local
1. ✅ Aplicar la migración
2. ✅ Crear un usuario de desarrollo en Supabase Auth
3. ✅ Actualizar `owner_id` con tu user UUID
4. ✅ Usar `localStorage.setItem('dev_subdomain', 'totus')` si necesitas cambiar de tienda

### Para Producción
1. ❌ NO aplicar esta migración en producción
2. ✅ Los usuarios reales deben crear sus propias tiendas mediante `/create-store`
3. ✅ Si necesitas una tienda demo en producción, crear una con owner_id real
4. ✅ Monitorear logs de `store_access_log` para detectar intentos sospechosos

### Mantenimiento
1. ✅ Ejecutar `cleanup_old_security_logs()` periódicamente:
   ```sql
   SELECT public.cleanup_old_security_logs();
   ```
2. ✅ Revisar `suspicious_access_patterns` mensualmente:
   ```sql
   SELECT * FROM get_suspicious_access_patterns('store-uuid', 24);
   ```

---

## 8. DATOS INSERTADOS

### Store
- **ID**: `00000000-0000-0000-0000-000000000001`
- **Subdomain**: `totus`
- **Name**: `Totus - Tienda de Desarrollo`
- **Owner ID**: `00000000-0000-0000-0000-000000000000` (placeholder)
- **Active**: `true`
- **Operating Modes**: Delivery, Pickup, Digital Menu
- **Currency**: USD
- **Colors**: Primary=#FF6B6B, Price=#4ECDC4

### Categories
1. Entradas
2. Platos Principales
3. Bebidas
4. Postres

### Menu Items
- 4 productos de ejemplo (1 por categoría)
- Precio: $9.99
- Estado: Disponible

### Store Hours
- Lunes-Viernes: 09:00 - 18:00
- Sábado: 10:00 - 14:00
- Domingo: Cerrado

---

## 9. PRÓXIMOS PASOS

1. ✅ **INMEDIATO**: Aplicar migración en tu ambiente local
2. ✅ **INMEDIATO**: Crear usuario de desarrollo y actualizar owner_id
3. ✅ **INMEDIATO**: Verificar que la app carga correctamente
4. 📋 **OPCIONAL**: Agregar más productos/categorías de ejemplo
5. 📋 **OPCIONAL**: Configurar imágenes de logo/banner
6. 📋 **FUTURO**: Crear documentación para nuevos developers

---

## 10. CONTACTO Y SOPORTE

Si encuentras problemas adicionales:
1. Verificar logs de consola del navegador
2. Verificar logs de Supabase Dashboard (SQL Editor)
3. Revisar `store_access_log` para debugging:
   ```sql
   SELECT * FROM store_access_log
   WHERE subdomain = 'totus'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

---

**Fecha de Solución**: 2025-11-30
**Autor**: Claude Code (Orchestrator + Developer + Supabase + Security Agents)
**Estado**: ✅ COMPLETO Y LISTO PARA IMPLEMENTAR
