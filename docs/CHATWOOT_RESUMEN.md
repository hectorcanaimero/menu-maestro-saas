# Resumen: Integración de Chatwoot

## ✅ Implementación Completada

El widget de Chatwoot ha sido integrado exitosamente en el **Panel de Administración** (`/admin`).

## 📍 Ubicación

El widget de chat en vivo **solo aparece en**:

- **Ruta**: `/admin` (Dashboard de administración)
- **Acceso**: Solo para administradores autenticados
- **Posición**: Esquina inferior derecha
- **Idioma**: Español

## 🔧 Configuración Actual

**Archivo**: [src/pages/admin/AdminDashboard.tsx](src/pages/admin/AdminDashboard.tsx)

```typescript
const chatwoot = useChatwoot({
  websiteToken: 'w6ca8SJxutDVrXby1mjDTj5D',
  baseUrl: 'https://woot.guria.lat',
  enabled: true,
  position: 'right',
  locale: 'es',
});
```

## ✨ Características Implementadas

### 1. Identificación Automática de Usuario

Cuando un administrador ingresa al dashboard, el sistema automáticamente:

- Identifica al usuario con su email y nombre
- Establece atributos de contexto:
  - `user_type`: 'store_admin'
  - `role`: 'admin'
  - `logged_in_at`: Fecha y hora de ingreso

### 2. Carga Dinámica

- El widget se carga solo cuando el administrador visita `/admin`
- Se limpia automáticamente al salir del dashboard
- No afecta el rendimiento en otras páginas

### 3. Hook Reutilizable

El hook `useChatwoot` permite usar el widget en cualquier componente:

```typescript
import { useChatwoot } from '@/hooks/useChatwoot';

const MyComponent = () => {
  const chatwoot = useChatwoot({
    websiteToken: 'token',
    baseUrl: 'https://url',
    enabled: true,
  });

  // Métodos disponibles:
  chatwoot.toggle('open'); // Abrir
  chatwoot.toggle('close'); // Cerrar
  chatwoot.setUser(id, userData); // Identificar usuario
  chatwoot.setCustomAttributes(attrs); // Agregar contexto
  chatwoot.reset(); // Resetear
};
```

## 📁 Archivos

### Creados

1. **`src/hooks/useChatwoot.ts`** - Hook principal de React
2. **`src/components/ChatwootControl.tsx`** - Panel de control demo (opcional)
3. **`CHATWOOT_SETUP.md`** - Guía completa de configuración
4. **`CHATWOOT_IMPLEMENTATION.md`** - Documentación técnica completa

### Modificados

1. **`src/pages/admin/AdminDashboard.tsx`** - Integración del widget
2. **`.env.example`** - Variables de entorno documentadas

## 🚀 Cómo Probarlo

### 1. Iniciar servidor de desarrollo

```bash
npm run dev
```

### 2. Acceder al panel de administración

1. Ir a `http://localhost:8081/auth`
2. Iniciar sesión como administrador
3. Navegar a `/admin`
4. El widget aparecerá en la esquina inferior derecha

### 3. Verificar funcionalidad

- Click en el ícono del chat para abrir
- Enviar un mensaje de prueba
- Los mensajes deben aparecer en tu panel de Chatwoot en `https://woot.guria.lat`

## 🔐 Seguridad y Privacidad

### Información del Usuario

El sistema envía a Chatwoot:

- ✅ User ID (UUID de Supabase)
- ✅ Email del administrador
- ✅ Nombre (si está disponible)
- ✅ Tipo de usuario y rol

### NO se envía

- ❌ Contraseñas
- ❌ Tokens de sesión
- ❌ Información sensible de clientes
- ❌ Datos de pagos

## 🎯 Próximos Pasos (Opcionales)

### 1. Mover a Variables de Entorno

Para producción, es recomendable usar variables de entorno:

**Agregar a `.env`:**

```env
VITE_CHATWOOT_WEBSITE_TOKEN=w6ca8SJxutDVrXby1mjDTj5D
VITE_CHATWOOT_BASE_URL=https://woot.guria.lat
```

**Actualizar en `AdminDashboard.tsx`:**

```typescript
const chatwoot = useChatwoot({
  websiteToken: import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN || '',
  baseUrl: import.meta.env.VITE_CHATWOOT_BASE_URL || '',
  enabled: !!(
    import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN &&
    import.meta.env.VITE_CHATWOOT_BASE_URL
  ),
  position: 'right',
  locale: 'es',
});
```

### 2. Agregar Contexto de Tienda

Puedes agregar información de la tienda actual:

```typescript
import { useStore } from '@/contexts/StoreContext';

const { store } = useStore();

if (chatwoot && store) {
  chatwoot.setCustomAttributes({
    store_name: store.name,
    store_subdomain: store.subdomain,
    operating_mode: store.operating_mode,
  });
}
```

### 3. Extender a Otras Páginas Admin

Si quieres el widget en todas las páginas de admin, puedes mover la integración al componente `AdminLayout`:

```typescript
// src/components/admin/AdminLayout.tsx
import { useChatwoot } from '@/hooks/useChatwoot';

const AdminLayout = () => {
  useChatwoot({
    websiteToken: 'w6ca8SJxutDVrXby1mjDTj5D',
    baseUrl: 'https://woot.guria.lat',
    enabled: true,
    position: 'right',
    locale: 'es',
  });

  // ... resto del componente
};
```

## 📊 Estadísticas de Build

✅ Build exitoso:

- Tiempo de compilación: ~17s
- Sin errores de TypeScript
- Todos los módulos transformados correctamente

## 📚 Documentación Adicional

- **Configuración**: [CHATWOOT_SETUP.md](CHATWOOT_SETUP.md)
- **Detalles técnicos**: [CHATWOOT_IMPLEMENTATION.md](CHATWOOT_IMPLEMENTATION.md)
- **Hook de React**: [src/hooks/useChatwoot.ts](src/hooks/useChatwoot.ts)

## 💡 Tips

1. **El widget no aparece?**
   - Verifica que estés en la ruta `/admin`
   - Revisa la consola del navegador para errores
   - Confirma que el `websiteToken` sea correcto

2. **No se identifican los usuarios?**
   - Verifica que la autenticación funcione correctamente
   - Revisa que `session.user` tenga email

3. **Personalizar apariencia?**
   - Cambia `position: 'left'` para ponerlo a la izquierda
   - Cambia `locale: 'en'` para inglés
   - Usa `hideMessageBubble: true` para ocultarlo por defecto

## 🎉 ¡Listo!

El widget de Chatwoot está completamente funcional en el panel de administración. Los administradores ahora pueden recibir soporte directo mientras usan el sistema.
