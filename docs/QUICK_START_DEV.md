# Quick Start - Desarrollo con Tienda "totus"

## TL;DR - Pasos Rápidos

```bash
# 1. Aplicar migración
cd /Users/al3jandro/project/pideai/app
supabase db push

# 2. Iniciar servidor
npm run dev

# 3. Abrir navegador
# http://localhost:8080
```

¡Listo! La tienda "totus" debería cargar automáticamente.

---

## Si necesitas acceso admin

### Paso 1: Crear usuario
1. Ve a Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Ingresa email y password
4. Copia el UUID del usuario

### Paso 2: Actualizar owner_id
En Supabase SQL Editor:
```sql
UPDATE stores
SET owner_id = 'TU-USER-UUID-AQUI'
WHERE subdomain = 'totus';
```

### Paso 3: Login
1. Inicia sesión en la app con ese email/password
2. Navega a http://localhost:8080/admin
3. ¡Listo!

---

## Problemas Comunes

### "Verificando tienda..." infinito
- **Causa**: Migración no aplicada
- **Solución**: `supabase db push`

### "Tienda no encontrada"
- **Causa**: Tienda no está activa
- **Solución**:
  ```sql
  UPDATE stores SET is_active = true WHERE subdomain = 'totus';
  ```

### "Acceso denegado" en /admin
- **Causa**: owner_id no coincide con tu usuario
- **Solución**: Ver "Si necesitas acceso admin" arriba

### "Rate limit exceeded"
- **Causa**: Demasiados intentos de acceso
- **Solución**: Esperar 15 minutos o limpiar logs:
  ```sql
  DELETE FROM rate_limit_log WHERE action_type = 'store_access';
  ```

---

## Cambiar de tienda en desarrollo

```javascript
// En DevTools Console:
localStorage.setItem('dev_subdomain', 'otra-tienda');
window.location.reload();
```

Para volver a "totus":
```javascript
localStorage.setItem('dev_subdomain', 'totus');
window.location.reload();
```

---

## Archivos Importantes

- 📄 `RESUMEN_SOLUCION.md` - Resumen ejecutivo
- 📘 `SOLUCION_TIENDA_TOTUS.md` - Documentación completa
- 🔧 `scripts/setup-dev-store.sh` - Script de setup
- 💾 `scripts/update-totus-owner.sql` - SQL helper
- 🗄️ `supabase/migrations/20251130000000_insert_dev_store_totus.sql` - Migración

---

## Datos de la Tienda "totus"

```
Subdomain: totus
Name: Totus - Tienda de Desarrollo
URL Dev: http://localhost:8080
Categorías: 4 (Entradas, Platos, Bebidas, Postres)
Productos: 4 de ejemplo
Horarios: Lun-Vie 9am-6pm, Sáb 10am-2pm
Operating Modes: Delivery, Pickup, Digital Menu
```

---

## Comandos Útiles

```bash
# Ver status de Supabase
supabase status

# Ver logs de Supabase
supabase logs

# Abrir Supabase Dashboard
supabase db open

# Ver migraciones aplicadas
supabase migration list

# Resetear base de datos (CUIDADO)
supabase db reset
```

---

**¿Dudas?** Consulta `SOLUCION_TIENDA_TOTUS.md` para documentación completa.
