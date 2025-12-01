# Scripts de Desarrollo

Este directorio contiene scripts útiles para el desarrollo y mantenimiento de PideAI.

## Scripts Disponibles

1. **setup-dev-store.sh** - Setup automático de la tienda de desarrollo
2. **update-totus-owner.sql** - Actualizar owner_id de la tienda "totus"
3. **verify-totus-store.sql** - Verificar que la tienda se creó correctamente

---

## setup-dev-store.sh

Script para configurar la tienda de desarrollo "totus" en tu ambiente local.

### Uso

```bash
# Desde el directorio raíz del proyecto
./scripts/setup-dev-store.sh
```

### Qué hace este script

1. Verifica que Supabase CLI esté instalado
2. Aplica la migración de la tienda de desarrollo "totus"
3. Te guía para configurar el owner_id de la tienda

### Prerequisitos

- Supabase CLI instalado: `brew install supabase/tap/supabase`
- Proyecto vinculado con Supabase: `supabase link`
- Supabase local funcionando: `supabase start`

### Solución de Problemas

Si el script falla, revisa:

1. **Error "Migration file not found"**: Asegúrate de estar en el directorio raíz del proyecto
2. **Error "Supabase CLI not found"**: Instala Supabase CLI con Homebrew
3. **Error al aplicar migración**: Verifica que Supabase esté corriendo con `supabase status`

### Después del Setup

1. Inicia el servidor de desarrollo: `npm run dev`
2. Abre <http://localhost:8080>
3. La tienda "totus" debería cargar automáticamente

Para acceso admin:

1. Crea un usuario en Supabase Auth
2. Actualiza el owner_id de la tienda con tu user UUID
3. Inicia sesión y navega a /admin

---

## update-totus-owner.sql

Script SQL para actualizar el owner_id de la tienda "totus" a tu usuario.

### Uso

1. Abre Supabase Dashboard → SQL Editor
2. Copia el contenido de `scripts/update-totus-owner.sql`
3. Reemplaza `'your-email@example.com'` con tu email
4. Ejecuta el paso 1 para obtener tu user UUID
5. Reemplaza `'YOUR-USER-UUID-HERE'` con tu UUID
6. Ejecuta los pasos 2-4 para actualizar y verificar

### Lo que hace

- Busca tu user UUID por email
- Actualiza el owner_id de la tienda "totus"
- Verifica que la actualización fue exitosa
- Confirma ownership

---

## verify-totus-store.sql

Script SQL de verificación completa para validar que la tienda "totus" se creó correctamente.

### Uso

1. Abre Supabase Dashboard → SQL Editor
2. Copia el contenido de `scripts/verify-totus-store.sql`
3. Ejecuta todo el script
4. Revisa los resultados

### Checks que realiza

1. ✅ Store exists
2. ✅ Store is active
3. ✅ Store configuration complete
4. ✅ Categories created (4 expected)
5. ✅ Category list
6. ✅ Menu items created (4+ expected)
7. ✅ Store hours created (6 days)
8. ✅ Store hours schedule
9. ✅ RPC function test
10. ✅ Public read access

Si todos los checks pasan, verás: "✅ ALL CHECKS PASSED - Store is ready for development"
