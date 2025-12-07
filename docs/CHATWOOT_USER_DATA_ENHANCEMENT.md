# Chatwoot User Data Enhancement

## 📋 Cambios Realizados

Se mejoró la integración de Chatwoot para enviar información más completa del usuario, incluyendo:
- **Email del usuario**
- **Nombre de la tienda** (como nombre del usuario)
- **Nombre de la tienda** en atributos personalizados

## ✅ Implementación

### Archivo Modificado

**`src/pages/admin/AdminDashboard.tsx`**

### Cambios Específicos

#### 1. Import de StoreContext

```typescript
import { useStore } from "@/contexts/StoreContext";
```

Se agregó el import para acceder al contexto de la tienda.

#### 2. Uso del Hook useStore

```typescript
const { store } = useStore();
```

Se obtiene el objeto `store` que contiene la información de la tienda actual.

#### 3. Actualización de setUser()

**Antes:**
```typescript
chatwoot.setUser(session.user.id, {
  email: session.user.email,
  name: session.user.user_metadata?.name || session.user.email,
});
```

**Después:**
```typescript
chatwoot.setUser(session.user.id, {
  email: session.user.email,
  name: store?.name || session.user.user_metadata?.name || session.user.email,
});
```

**Cambio:** El campo `name` ahora prioriza el nombre de la tienda (`store?.name`).

#### 4. Actualización de setCustomAttributes()

**Antes:**
```typescript
chatwoot.setCustomAttributes({
  user_type: 'store_admin',
  role: 'admin',
  logged_in_at: new Date().toISOString(),
});
```

**Después:**
```typescript
chatwoot.setCustomAttributes({
  user_type: 'store_admin',
  role: 'admin',
  store_name: store?.name || 'Unknown Store',
  logged_in_at: new Date().toISOString(),
});
```

**Cambio:** Se agregó el atributo personalizado `store_name`.

#### 5. Actualización del useEffect

**Antes:**
```typescript
useEffect(() => {
  getUserEmail();
}, []);
```

**Después:**
```typescript
useEffect(() => {
  getUserEmail();
}, [store]); // Re-run when store is loaded
```

**Cambio:** El effect ahora se ejecuta cuando cambia `store`, garantizando que si la tienda se carga después de la sesión, Chatwoot se actualiza con los datos correctos.

## 📊 Datos Enviados a Chatwoot

### Identificación del Usuario (setUser)

```javascript
{
  id: "user_supabase_id",
  email: "usuario@ejemplo.com",
  name: "Nombre de la Tienda"  // ← Ahora usa el nombre de la tienda
}
```

### Atributos Personalizados (setCustomAttributes)

```javascript
{
  user_type: "store_admin",
  role: "admin",
  store_name: "Nombre de la Tienda",  // ← NUEVO
  logged_in_at: "2025-12-05T14:00:00.000Z"
}
```

## 🎯 Beneficios

### Antes ❌
- Chatwoot mostraba el email o metadata del usuario
- No había contexto de qué tienda era el usuario
- Agentes de soporte debían preguntar información básica

### Después ✅
- **Nombre de usuario en Chatwoot = Nombre de la tienda**
- **Email visible** para contacto directo
- **Atributo `store_name`** en el perfil del usuario
- **Contexto completo** para agentes de soporte
- **Identificación inmediata** de qué tienda necesita ayuda

## 🔍 Flujo de Datos

```
1. Usuario inicia sesión en /admin
   ↓
2. AdminDashboard se monta
   ↓
3. StoreContext carga datos de la tienda (subdomain → store)
   ↓
4. useEffect detecta cambio en `store`
   ↓
5. getUserEmail() se ejecuta
   ↓
6. Supabase session proporciona user.id y user.email
   ↓
7. Chatwoot.setUser() recibe:
   - id: user.id
   - email: user.email
   - name: store.name ✨
   ↓
8. Chatwoot.setCustomAttributes() recibe:
   - store_name: store.name ✨
   - user_type: "store_admin"
   - role: "admin"
   - logged_in_at: timestamp
   ↓
9. Panel de Chatwoot muestra usuario con nombre de tienda
```

## 🧪 Cómo Probar

### 1. Iniciar sesión como admin

```bash
npm run dev
```

1. Ir a `http://localhost:8081/admin`
2. Iniciar sesión con credenciales de tienda
3. Abrir el widget de Chatwoot (esquina inferior derecha)
4. Enviar un mensaje de prueba

### 2. Verificar en Panel de Chatwoot

1. Ir a panel de Chatwoot: `https://woot.guria.lat`
2. Ver conversaciones
3. Verificar que el contacto muestra:
   - **Nombre**: Nombre de la tienda (ej: "Totus")
   - **Email**: Email del usuario admin
   - **Atributos personalizados**: `store_name`, `user_type`, `role`, `logged_in_at`

### 3. Verificar en Console del Navegador

Abrir DevTools > Console y ejecutar:

```javascript
// Ver datos del usuario en Chatwoot
window.$chatwoot?.user
```

Debería mostrar:
```javascript
{
  id: "uuid-del-usuario",
  email: "usuario@ejemplo.com",
  name: "Nombre de la Tienda"
}
```

## 📝 Consideraciones Técnicas

### Multi-tenancy
- ✅ Cada tienda se identifica con su propio nombre
- ✅ El `store_name` se obtiene del contexto multi-tenant
- ✅ Aislamiento correcto por subdomain

### Timing
- ✅ El `useEffect` se ejecuta cuando `store` cambia
- ✅ Si `store` no está cargado, usa fallback: `'Unknown Store'`
- ✅ No hay race conditions

### Fallbacks
```typescript
name: store?.name || session.user.user_metadata?.name || session.user.email
store_name: store?.name || 'Unknown Store'
```

Orden de prioridad:
1. `store?.name` - Nombre de la tienda (preferido)
2. `user_metadata?.name` - Metadata de usuario (fallback)
3. `user.email` - Email como último recurso
4. `'Unknown Store'` - Para atributos si no hay store

## 🔐 Seguridad

- ✅ **Email seguro**: Viene de Supabase session (autenticado)
- ✅ **Store name seguro**: Viene de RLS-protected query en StoreContext
- ✅ **User ID seguro**: UUID de Supabase
- ✅ **No se exponen datos sensibles** adicionales

## 🚀 Estado

- ✅ Implementado
- ✅ Testeado en desarrollo
- ✅ Build exitoso
- ✅ Listo para producción

## 📅 Metadata

**Fecha**: 2025-12-05
**Archivo modificado**: `src/pages/admin/AdminDashboard.tsx`
**Tipo**: Enhancement
**Prioridad**: P3-medium

---

**Resultado**: Ahora los agentes de soporte en Chatwoot pueden ver inmediatamente el nombre de la tienda y el email del usuario, mejorando significativamente la experiencia de soporte.
