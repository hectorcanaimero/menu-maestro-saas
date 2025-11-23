# Issue #11: Implement Error Boundaries and Centralized Error Handling

**Status:** ✅ IMPLEMENTADO
**Fecha:** 23 de Noviembre, 2025
**Desarrollador:** Claude Code Assistant
**Prioridad:** P2 - High Priority

---

## 🎯 Resumen Ejecutivo

Se ha implementado un sistema completo de manejo de errores centralizado para la aplicación, incluyendo error boundaries de React, utilidades de logging, y hooks reutilizables para operaciones asíncronas.

### Características Implementadas

1. **Error Handler Utilities** - `errorHandler.ts`
2. **React Error Boundaries** - Componentes de clase para capturar errores de renderizado
3. **Custom Hooks** - useErrorHandler y useAsyncOperation
4. **Retry Mechanism** - Reintentos automáticos con backoff exponencial
5. **User-Friendly Messages** - Mensajes en español adaptados a cada tipo de error
6. **Error Logging** - Sistema centralizado de logging con contexto

---

## 📦 Archivos Creados

### 1. Error Handler Utilities: `src/lib/errorHandler.ts`

Sistema centralizado de manejo de errores con múltiples utilidades.

#### AppError Class

Clase personalizada para errores de aplicación con contexto adicional.

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Uso
throw new AppError(
  'No se pudo cargar la tienda',
  'STORE_NOT_FOUND',
  { storeId: 'abc123', component: 'StoreContext' }
);
```

#### Error Logging

Función centralizada para logging de errores.

```typescript
export function logError(error: Error | AppError, context?: ErrorContext): void
```

**Características:**
- ✅ Console logging en desarrollo con agrupación
- ✅ Logging a Supabase (error_logs table) - opcional
- ✅ Preparado para integración con Sentry/LogRocket
- ✅ Incluye stack trace, user agent, URL, timestamp
- ✅ Fire-and-forget (no rompe la app si falla)

**Ejemplo:**
```typescript
logError(error, {
  component: 'CategoriesManager',
  action: 'deleteCategory',
  userId: user.id,
  storeId: store.id,
  categoryId: category.id
});
```

#### Error Type Handlers

Funciones especializadas para diferentes tipos de errores.

##### handleDatabaseError(error)

Maneja errores de PostgreSQL/Supabase.

**Códigos soportados:**
- `23505` - Unique violation → "Este registro ya existe"
- `23503` - Foreign key violation → "No se puede eliminar porque está siendo usado"
- `23502` - Not null violation → "Falta un campo requerido"
- `42P01` - Undefined table → "Error de configuración de base de datos"
- `PGRST116` - Not found → "No se encontró el registro"
- `PGRST301` - Auth error → "Error de autenticación"
- Row Level Security errors → "No tienes permisos"

##### handleNetworkError(error)

Maneja errores de red y conexión.

**Detecta:**
- Fetch errors
- Timeout errors
- NetworkError type
- TypeError (network-related)

##### handleAuthError(error)

Maneja errores de autenticación.

**Detecta:**
- JWT/token errors → "Tu sesión ha expirado"
- Invalid credentials → "Credenciales inválidas"
- Email not confirmed → "Confirma tu email"
- User not found → "Usuario no encontrado"

##### handleApiError(error)

Función maestra que intenta todos los handlers específicos.

```typescript
export function handleApiError(error: any): string
```

**Orden de procesamiento:**
1. Database errors
2. Network errors
3. Auth errors
4. Generic fallback

#### Retry Mechanism

Función para reintentar operaciones fallidas con backoff exponencial.

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;      // default: 3
    delay?: number;           // default: 1000ms
    backoff?: boolean;        // default: true (exponential)
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T>
```

**Características:**
- ✅ Backoff exponencial (1s, 2s, 4s, 8s...)
- ✅ No reintenta errores no recuperables (unique violations, auth errors)
- ✅ Callback onRetry para logging/UI updates
- ✅ Genérico (funciona con cualquier tipo de retorno)

**Ejemplo:**
```typescript
const categories = await withRetry(
  () => supabase.from('categories').select('*'),
  {
    maxRetries: 3,
    delay: 1000,
    backoff: true,
    onRetry: (attempt, error) => {
      console.log(`Intento ${attempt} falló:`, error.message);
      toast.info(`Reintentando... (${attempt}/3)`);
    }
  }
);
```

#### Utility Functions

##### safeAsync

Wrapper seguro para operaciones asíncronas.

```typescript
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T,
  context?: ErrorContext
): Promise<T | undefined>
```

**Ejemplo:**
```typescript
const store = await safeAsync(
  () => fetchStore(subdomain),
  null, // fallback
  { component: 'StoreContext', subdomain }
);
```

##### Checkers

```typescript
isAppError(error: any): error is AppError
isNetworkError(error: any): boolean
isAuthError(error: any): boolean
```

##### formatErrorMessage

```typescript
export function formatErrorMessage(error: Error | AppError): string
```

Formatea el error para mostrar al usuario (siempre en español).

---

### 2. Error Boundary Component: `src/components/ErrorBoundary.tsx`

Componentes de clase de React para capturar errores de renderizado.

#### ErrorBoundary

Error boundary principal para toda la aplicación.

**Props:**
```typescript
interface Props {
  children: ReactNode;
  fallback?: ReactNode;           // UI personalizado
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;          // Mostrar stack trace (dev only)
}
```

**Features UI:**
- ✅ Card centrado con diseño limpio
- ✅ Icono de alerta
- ✅ Mensaje de error amigable
- ✅ Stack trace en desarrollo (collapsible)
- ✅ Tres botones de acción:
  - **Intentar de nuevo**: Reset del error boundary
  - **Recargar página**: window.location.reload()
  - **Ir al inicio**: window.location.href = '/'
- ✅ Error ID único en producción

**Uso en App.tsx:**
```typescript
const App = () => (
  <ErrorBoundary showDetails={import.meta.env.DEV}>
    <QueryClientProvider client={queryClient}>
      {/* ... rest of app */}
    </QueryClientProvider>
  </ErrorBoundary>
);
```

#### SectionErrorBoundary

Error boundary ligero para secciones más pequeñas.

**Uso:**
```typescript
<SectionErrorBoundary>
  <DashboardStats />
</SectionErrorBoundary>
```

**UI:**
- Mensaje simple en línea
- No bloquea el resto de la aplicación
- Ideal para componentes opcionales

---

### 3. Error Handler Hook: `src/hooks/useErrorHandler.ts`

Custom hooks para manejo de errores en componentes funcionales.

#### useErrorHandler

Hook para manejo consistente de errores.

```typescript
export function useErrorHandler() {
  const handleError = useCallback((
    error: Error | AppError,
    context?: ErrorContext
  ) => void;

  return { handleError };
}
```

**Características:**
- ✅ Logs automático con contexto
- ✅ Toast notification con mensaje formateado
- ✅ Redirección a /auth si error de autenticación
- ✅ Callback memoizado (no causa re-renders)

**Ejemplo:**
```typescript
const CategoriesManager = () => {
  const { handleError } = useErrorHandler();

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Categoría eliminada');
    } catch (error) {
      handleError(error as Error, {
        component: 'CategoriesManager',
        action: 'deleteCategory',
        categoryId: id
      });
    }
  };
};
```

#### useAsyncOperation

Hook para operaciones asíncronas con loading state y error handling.

```typescript
export function useAsyncOperation<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    context?: ErrorContext;
  }
)
```

**Retorna:**
```typescript
{
  execute: (...args: Args) => Promise<T | undefined>;
  loading: boolean;
  error: Error | null;
  data: T | null;
  reset: () => void;
}
```

**Ejemplo:**
```typescript
const CategoriesManager = () => {
  const { execute, loading, error } = useAsyncOperation(
    async (id: string) => {
      const { data, error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        toast.success('Categoría eliminada');
        refetch();
      },
      context: {
        component: 'CategoriesManager',
        action: 'deleteCategory'
      }
    }
  );

  return (
    <Button
      onClick={() => execute(categoryId)}
      disabled={loading}
    >
      {loading ? 'Eliminando...' : 'Eliminar'}
    </Button>
  );
};
```

---

## 🎯 Patrones de Uso

### Patrón 1: Try-Catch con useErrorHandler

**Para:** Operaciones simples con manejo manual

```typescript
const Component = () => {
  const { handleError } = useErrorHandler();

  const doSomething = async () => {
    try {
      const result = await riskyOperation();
      toast.success('Éxito');
    } catch (error) {
      handleError(error as Error, {
        component: 'Component',
        action: 'doSomething'
      });
    }
  };
};
```

### Patrón 2: useAsyncOperation

**Para:** Operaciones con loading state

```typescript
const Component = () => {
  const { execute, loading } = useAsyncOperation(
    async (id: string) => {
      // operation
    },
    {
      onSuccess: (data) => {
        toast.success('Éxito');
      },
      context: { component: 'Component' }
    }
  );

  return (
    <Button onClick={() => execute(id)} disabled={loading}>
      {loading ? 'Cargando...' : 'Ejecutar'}
    </Button>
  );
};
```

### Patrón 3: Retry Mechanism

**Para:** Operaciones que pueden fallar temporalmente

```typescript
const Component = () => {
  const fetchData = async () => {
    const data = await withRetry(
      () => supabase.from('table').select('*'),
      {
        maxRetries: 3,
        delay: 1000,
        backoff: true,
        onRetry: (attempt) => {
          toast.info(`Reintentando... (${attempt}/3)`);
        }
      }
    );
  };
};
```

### Patrón 4: Error Boundary para Secciones

**Para:** Aislar errores de componentes opcionales

```typescript
const Dashboard = () => (
  <div>
    <SectionErrorBoundary>
      <DashboardStats />
    </SectionErrorBoundary>

    <SectionErrorBoundary>
      <RecentOrders />
    </SectionErrorBoundary>

    {/* Si Stats falla, RecentOrders sigue funcionando */}
  </div>
);
```

---

## 🔄 Migración de Componentes Existentes

### Antes (Sin Error Handling)

```typescript
const CategoriesManager = () => {
  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      toast.error('Error al eliminar');
      return;
    }

    toast.success('Eliminado');
  };
};
```

### Después (Con Error Handling)

```typescript
const CategoriesManager = () => {
  const { handleError } = useErrorHandler();

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Categoría eliminada');
    } catch (error) {
      handleError(error as Error, {
        component: 'CategoriesManager',
        action: 'deleteCategory',
        categoryId: id
      });
    }
  };
};
```

**Beneficios:**
- ✅ Mensajes de error más descriptivos
- ✅ Logging centralizado con contexto
- ✅ Redirección automática si error de auth
- ✅ Consistencia en toda la app

---

## 🧪 Testing

### Test 1: Error Boundary en Renderizado

**Simular error:**
```typescript
const BuggyComponent = () => {
  throw new Error('Test error boundary');
  return <div>Never renders</div>;
};

// En desarrollo
<ErrorBoundary showDetails={true}>
  <BuggyComponent />
</ErrorBoundary>
```

**Validación:**
- ✅ Error boundary captura el error
- ✅ Muestra UI de error con mensaje
- ✅ Stack trace visible en desarrollo
- ✅ Botones funcionan correctamente
- ✅ Error logged en console

### Test 2: useErrorHandler con Diferentes Tipos de Error

**Database Error:**
```typescript
// Simular unique violation
const error = { code: '23505', message: 'duplicate key' };
handleError(error, { component: 'Test' });
// Espera: "Este registro ya existe"
```

**Network Error:**
```typescript
const error = new Error('fetch failed');
handleError(error, { component: 'Test' });
// Espera: "Error de conexión. Verifica tu conexión a internet"
```

**Auth Error:**
```typescript
const error = { message: 'JWT expired' };
handleError(error, { component: 'Test' });
// Espera: "Tu sesión ha expirado" + redirect a /auth
```

### Test 3: Retry Mechanism

**Setup:**
```typescript
let attempts = 0;
const flakeyOperation = async () => {
  attempts++;
  if (attempts < 3) throw new Error('Temporary failure');
  return 'Success';
};

const result = await withRetry(flakeyOperation, {
  maxRetries: 3,
  delay: 100,
  onRetry: (attempt) => console.log(`Attempt ${attempt}`)
});
```

**Validación:**
- ✅ Reintenta hasta 3 veces
- ✅ Callback onRetry se ejecuta
- ✅ Eventualmente retorna 'Success'
- ✅ Delays con backoff exponencial

### Test 4: useAsyncOperation

**Test con éxito:**
```typescript
const { execute, loading, data } = useAsyncOperation(
  async (id: string) => ({ id, name: 'Test' }),
  { onSuccess: (data) => console.log('Success:', data) }
);

await execute('123');
// Espera: loading = false, data = { id: '123', name: 'Test' }
```

**Test con error:**
```typescript
const { execute, error } = useAsyncOperation(
  async () => { throw new Error('Test error'); },
  { onError: (err) => console.log('Error caught:', err) }
);

await execute();
// Espera: error = Error('Test error'), toast notification
```

---

## 📊 Error Logging to Supabase (Opcional)

### Tabla error_logs (Crear si se desea)

```sql
CREATE TABLE public.error_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message text NOT NULL,
  name text,
  stack text,
  context jsonb,
  user_agent text,
  url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_context ON public.error_logs USING gin(context);
```

### RLS Policy

```sql
-- Solo admins pueden ver logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view error logs"
  ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Todos pueden insertar (fire-and-forget)
CREATE POLICY "Anyone can insert error logs"
  ON public.error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

---

## 🚀 Mejoras Futuras (Opcional)

### 1. Integración con Sentry

```typescript
// En errorHandler.ts
if (import.meta.env.PROD) {
  Sentry.captureException(error, {
    extra: errorData.context,
    tags: {
      component: errorData.context?.component,
      action: errorData.context?.action,
    }
  });
}
```

### 2. Error Analytics Dashboard

```typescript
// Nueva página: /admin/error-logs
// Muestra errores de error_logs table
// Filtros: por componente, fecha, tipo
// Gráficos: errores por día, top componentes con errores
```

### 3. User Feedback en Error Boundary

```typescript
// Agregar formulario para que usuario reporte el problema
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Mostrar formulario opcional
    setShowFeedbackForm(true);
  }}
>
```

### 4. Offline Error Queue

```typescript
// Guardar errores en IndexedDB cuando offline
// Sincronizar cuando vuelve la conexión
```

---

## ✅ Checklist de Implementación

- [x] errorHandler.ts creado
- [x] AppError class implementada
- [x] logError function implementada
- [x] handleDatabaseError implementado
- [x] handleNetworkError implementado
- [x] handleAuthError implementado
- [x] handleApiError implementado
- [x] withRetry mechanism implementado
- [x] safeAsync utility implementada
- [x] Checker functions implementadas
- [x] formatErrorMessage implementada
- [x] ErrorBoundary component creado
- [x] SectionErrorBoundary creado
- [x] useErrorHandler hook creado
- [x] useAsyncOperation hook creado
- [x] App.tsx wrapped con ErrorBoundary
- [x] Mensajes en español
- [x] Error UI responsive
- [x] Development/Production modes
- [x] Documentation completa

---

## 📁 Archivos del Sistema

### Nuevos Archivos

1. **Error Handler Utilities**
   - `src/lib/errorHandler.ts`
   - Todas las utilidades de manejo de errores

2. **Error Boundary Component**
   - `src/components/ErrorBoundary.tsx`
   - ErrorBoundary y SectionErrorBoundary

3. **Error Handler Hook**
   - `src/hooks/useErrorHandler.ts`
   - useErrorHandler y useAsyncOperation

4. **Documentation**
   - `docs/ISSUE_11_IMPLEMENTATION.md`
   - Esta documentación completa

### Archivos Modificados

1. **App.tsx**
   - `src/App.tsx`
   - Wrapped con ErrorBoundary

---

## 📚 Ejemplos Completos

### Ejemplo 1: CategoriesManager con Error Handling

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

const CategoriesManager = () => {
  const { handleError } = useErrorHandler();

  const { execute: deleteCategory, loading: deleting } = useAsyncOperation(
    async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    {
      onSuccess: () => {
        toast.success('Categoría eliminada');
        queryClient.invalidateQueries(['categories']);
      },
      context: {
        component: 'CategoriesManager',
        action: 'deleteCategory'
      }
    }
  );

  return (
    <Button
      onClick={() => deleteCategory(category.id)}
      disabled={deleting}
    >
      {deleting ? 'Eliminando...' : 'Eliminar'}
    </Button>
  );
};
```

### Ejemplo 2: StoreContext con Retry

```typescript
import { withRetry } from '@/lib/errorHandler';

const StoreContext = () => {
  const fetchStore = async (subdomain: string) => {
    return await withRetry(
      async () => {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('subdomain', subdomain)
          .single();

        if (error) throw error;
        return data;
      },
      {
        maxRetries: 3,
        delay: 1000,
        backoff: true,
        onRetry: (attempt) => {
          console.log(`Cargando tienda... intento ${attempt}`);
        }
      }
    );
  };
};
```

### Ejemplo 3: Dashboard con Section Error Boundaries

```typescript
import { SectionErrorBoundary } from '@/components/ErrorBoundary';

const AdminDashboard = () => (
  <div className="space-y-6">
    <SectionErrorBoundary>
      <DashboardStats />
    </SectionErrorBoundary>

    <SectionErrorBoundary>
      <RecentOrders />
    </SectionErrorBoundary>

    <SectionErrorBoundary>
      <TopProducts />
    </SectionErrorBoundary>
  </div>
);
```

---

## 🎓 Best Practices

### 1. Siempre Proveer Contexto

```typescript
// ❌ Mal
handleError(error);

// ✅ Bien
handleError(error, {
  component: 'CategoriesManager',
  action: 'deleteCategory',
  categoryId: id,
  storeId: store.id
});
```

### 2. Usar Error Boundaries Apropiados

```typescript
// ❌ Mal - Error boundary por componente
<ErrorBoundary><Button /></ErrorBoundary>

// ✅ Bien - Error boundary por sección lógica
<ErrorBoundary>
  <Dashboard />
</ErrorBoundary>
```

### 3. No Reintentar Errores Permanentes

```typescript
// ❌ Mal - Reintentar error de validación
await withRetry(() => createUser(invalidEmail));

// ✅ Bien - Solo reintentar errores temporales
await withRetry(() => fetchFromAPI(), {
  maxRetries: 3,
  // withRetry ya excluye errores permanentes automáticamente
});
```

### 4. Mensajes Específicos al Usuario

```typescript
// ❌ Mal
toast.error('Error');

// ✅ Bien
const message = formatErrorMessage(error);
toast.error('Error al guardar', { description: message });
```

---

## ✅ Estado Final

**IMPLEMENTADO COMPLETAMENTE**

**Componentes Principales:**
- ✅ Error Handler Utilities (errorHandler.ts)
- ✅ ErrorBoundary Component
- ✅ SectionErrorBoundary Component
- ✅ useErrorHandler Hook
- ✅ useAsyncOperation Hook

**Características:**
- ✅ Logging centralizado con contexto
- ✅ Retry mechanism con backoff exponencial
- ✅ Mensajes user-friendly en español
- ✅ Error boundaries para toda la app
- ✅ Hooks reutilizables
- ✅ Type-safe con TypeScript
- ✅ Development/Production modes
- ✅ Preparado para Sentry integration

**Testing:**
- ✅ Error boundary funcional
- ✅ Hooks funcionan correctamente
- ✅ Retry mechanism testeado
- ✅ Mensajes de error apropiados

---

**Desarrollado con ❤️ por Claude Code Assistant**
**Fecha:** 23 de Noviembre, 2025
