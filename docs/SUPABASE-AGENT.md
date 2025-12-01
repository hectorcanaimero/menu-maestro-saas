# Supabase Expert Agent

Este proyecto incluye un agente especializado en Supabase que puede ayudarte con todas las tareas relacionadas con base de datos, RLS, migraciones, optimización de queries y más.

## 🚀 Cómo Usar el Agente

### Activar el Agente de Supabase

En Claude Code, puedes invocar al agente de dos formas:

**Opción 1: Comando directo**
```
@supabase-expert [tu pregunta sobre base de datos]
```

**Opción 2: Desde el chat**
Simplemente menciona que necesitas ayuda con Supabase y el sistema sugerirá usar el agente especializado.

## 🎯 Capacidades del Agente

El agente Supabase es experto en:

### 1. Diseño de Schema y Migraciones
- Crear tablas con constraints apropiados
- Diseñar relaciones entre tablas
- Crear índices para optimización
- Generar migraciones SQL

**Ejemplo:**
```
@supabase-expert necesito agregar una tabla para tracking de inventario
por producto. Debe llevar historial de cambios de stock.
```

### 2. Row Level Security (RLS)
- Diseñar políticas de seguridad
- Asegurar aislamiento multi-tenant
- Validar políticas existentes
- Debuggear problemas de permisos

**Ejemplo:**
```
@supabase-expert revisa las políticas RLS de la tabla orders y asegura
que cada tienda solo vea sus propias órdenes
```

### 3. Optimización de Queries
- Analizar queries lentos con EXPLAIN
- Sugerir índices apropiados
- Optimizar JOINs complejos
- Resolver problemas N+1

**Ejemplo:**
```
@supabase-expert este query de órdenes está tardando 3 segundos,
cómo puedo optimizarlo? [pega el query]
```

### 4. Funciones y Triggers
- Crear funciones PostgreSQL
- Implementar triggers automáticos
- Calcular totales automáticamente
- Validaciones a nivel de base de datos

**Ejemplo:**
```
@supabase-expert necesito que el total de la orden se calcule
automáticamente cuando se agregan items
```

### 5. Realtime Subscriptions
- Configurar subscripciones en tiempo real
- Filtrar eventos por store
- Optimizar performance de realtime

**Ejemplo:**
```
@supabase-expert cómo configuro realtime para que el admin reciba
notificaciones solo de órdenes de su tienda?
```

### 6. Storage y Edge Functions
- Políticas de Storage buckets
- Validación de uploads
- Edge Functions para lógica del servidor
- Integración con otras APIs

**Ejemplo:**
```
@supabase-expert necesito validar que las imágenes de productos
solo las suban los dueños de la tienda
```

## 📋 Casos de Uso Comunes

### Agregar Nueva Funcionalidad

**Escenario:** Necesitas agregar sistema de reseñas de productos

```
@supabase-expert necesito implementar un sistema de reseñas donde:
- Los clientes pueden dejar reseñas de productos que compraron
- Solo pueden reseñar productos que hayan pedido
- Las reseñas tienen rating de 1-5 estrellas
- Los dueños de tienda pueden responder a reseñas

Por favor diseña el schema completo con RLS policies
```

**El agente te dará:**
1. Schema de tabla `product_reviews`
2. Constraints y validaciones
3. Políticas RLS apropiadas
4. Índices para performance
5. Código TypeScript para el cliente

### Debuggear Problema de Performance

**Escenario:** Query de dashboard muy lento

```
@supabase-expert el dashboard de admin está tardando mucho en cargar.
El query principal es este:

[pega el query SQL o código TypeScript]

Ayúdame a optimizarlo
```

**El agente:**
1. Analizará el query con EXPLAIN
2. Identificará cuellos de botella
3. Sugerirá índices específicos
4. Mostrará el query optimizado
5. Comparará performance antes/después

### Migrar Funcionalidad Existente

**Escenario:** Mover lógica de cliente a servidor

```
@supabase-expert actualmente calculamos el total del carrito en el
cliente, pero queremos moverlo a una función de base de datos para
seguridad. La lógica actual es:

[pega código TypeScript]

Ayúdame a crear una función PostgreSQL para esto
```

**El agente:**
1. Creará función SQL equivalente
2. Agregará validaciones
3. Incluirá manejo de errores
4. Mostrará cómo llamarla desde TypeScript
5. Agregará tests

## 🔧 Integración con MCP Supabase

El agente tiene acceso al servidor MCP de Supabase que le permite:

- **Consultar schema actual**: Ver estructura de tablas
- **Analizar datos**: Hacer queries de análisis
- **Revisar políticas**: Verificar RLS policies
- **Inspeccionar índices**: Ver índices existentes
- **Validar constraints**: Revisar constraints actuales

Esto significa que el agente puede **ver el estado real de tu base de datos** y dar recomendaciones específicas para tu proyecto.

## 📊 Patrones del Proyecto

El agente conoce los patrones específicos de este proyecto:

### Multi-tenancy
Todas las tablas están scoped por `store_id`:
```sql
WHERE store_id = current_store_id
```

### Estructura de Órdenes
```
orders (cabecera)
  └── order_items (líneas)
       └── menu_items (productos)
```

### RLS Policies
- **Store owners**: Acceso completo a su tienda
- **Customers**: Solo lectura de items disponibles
- **Anonymous**: Solo lectura de catálogo público

### Realtime
- Notificaciones de órdenes por tienda
- Filtrado por `store_id`
- Manejo de reconexión

## 🎓 Ejemplos Avanzados

### 1. Crear Feature Completo: Programa de Fidelidad

```
@supabase-expert diseña un programa de puntos de fidelidad donde:

1. Los clientes ganan 1 punto por cada $10 gastados
2. Los puntos se acumulan por tienda (no globales)
3. Los puntos se pueden canjear por descuentos
4. Hay diferentes niveles (Bronce, Plata, Oro) basados en puntos
5. El dueño de la tienda puede configurar las recompensas

Necesito schema completo, RLS, funciones para calcular puntos,
y código TypeScript para el cliente.
```

### 2. Migración Compleja: Reestructurar Extras

```
@supabase-expert actualmente los extras de productos están guardados
como JSONB en menu_items. Necesito migrarlos a una tabla separada
product_extras manteniendo todos los datos existentes.

Ayúdame a crear una migración segura que:
- Cree la nueva tabla
- Migre los datos existentes
- Mantenga compatibilidad durante la transición
- No cause downtime
```

### 3. Performance Audit Completo

```
@supabase-expert haz un audit completo de performance de las tablas:
- orders
- order_items
- menu_items

Identifica:
- Índices faltantes
- Queries lentos comunes
- Políticas RLS ineficientes
- Oportunidades de desnormalización
```

## 🚨 Límites del Agente

El agente **NO puede**:
- Ejecutar cambios directamente en producción
- Acceder a datos sensibles de clientes
- Bypasear políticas de seguridad
- Usar service role key en cliente

El agente **SIEMPRE**:
- Prioriza seguridad sobre conveniencia
- Respeta aislamiento multi-tenant
- Sigue best practices de PostgreSQL
- Documenta sus recomendaciones

## 📚 Recursos Adicionales

Cuando uses el agente, también puedes consultar:

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Schema actual**: `src/integrations/supabase/types.ts`
- **Migraciones**: Carpeta `supabase/migrations/` (si existe)

## 💡 Tips para Mejores Resultados

1. **Sé específico**: Describe exactamente qué necesitas
2. **Incluye contexto**: Menciona tablas relacionadas
3. **Muestra código actual**: Si estás modificando algo existente
4. **Define criterios**: Performance, seguridad, features específicos
5. **Pregunta por alternativas**: El agente puede sugerir diferentes enfoques

## 🔄 Workflow Recomendado

1. **Diseño**: Usa el agente para diseñar schema y políticas
2. **Revisión**: Revisa las recomendaciones con el equipo
3. **Testing**: Prueba en desarrollo primero
4. **Migración**: Crea migration file
5. **Deployment**: Aplica en staging, luego producción
6. **Monitoreo**: Usa el agente para verificar performance

---

**Creado:** 2025-11-29  
**Versión:** 1.0.0  
**Última actualización:** 2025-11-29
