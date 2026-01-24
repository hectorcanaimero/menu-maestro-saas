# Guía Rápida de Acceso a PostHog

## 🌐 Acceso Web

### 1. Login a PostHog

**URL:** https://app.posthog.com (o https://us.posthog.com según región)

**Credenciales:**
- Usa la cuenta que configuraste cuando creaste el proyecto PostHog
- Si no tienes cuenta, regístrate en posthog.com

### 2. Seleccionar Proyecto

Una vez dentro:
1. En la esquina superior izquierda verás el nombre del proyecto
2. Si tienes múltiples proyectos, selecciona el de PideAI
3. El Project ID debe coincidir con el de tu `.env`:
   ```
   VITE_POSTHOG_KEY=phc_XXXXX
   ```

---

## 📊 Acceder a Dashboards Existentes

### Paso 1: Navegar a Dashboards

```
PostHog → Menú Lateral → Dashboards (ícono 📊)
```

### Paso 2: Ver Dashboards Disponibles

Verás una lista de dashboards. Según `POSTHOG_SETUP.md`, deberías tener:

1. **📈 Resumen Ejecutivo**
   - Métricas clave: vistas, carritos, órdenes, ingresos

2. **🎯 Conversión y Funnel**
   - Funnel de ventas
   - Tasa de conversión
   - Abandono de carrito

3. **🛍️ Análisis de Productos**
   - Top 10 productos
   - Productos removidos
   - Ratios

4. **🏪 Rendimiento por Tienda**
   - Vistas por tienda
   - Órdenes por tienda
   - Métodos de pago

5. **👤 Comportamiento de Usuarios**
   - Usuarios únicos
   - Sesiones
   - Paths

### Paso 3: Abrir un Dashboard

Click en cualquier dashboard para ver los insights en tiempo real.

---

## 🆕 Crear Nuevos Dashboards

Si los dashboards no existen aún, necesitas crearlos:

### Método 1: Interfaz Web (Recomendado para principiantes)

1. **Ir a Dashboards**
   ```
   PostHog → Dashboards → "New Dashboard"
   ```

2. **Crear Dashboard**
   - Nombre: "Platform Overview" (o cualquier nombre de los 9 dashboards nuevos)
   - Descripción: "Vista general de la plataforma completa"
   - Tags: "platform", "enterprise"

3. **Agregar Insights**
   - Click "+ New insight"
   - Selecciona tipo: Trends, Funnel, Retention, etc.
   - Configura según las guías en `dashboard-queries/`

4. **Ejemplo de Primer Insight: Total Tiendas Activas**

   ```
   Tipo: Number (Big Number)
   Serie: Unique stores
   Event: order_created
   Math: Unique values
   Property to aggregate: store_id
   Date range: Last 30 days
   ```

   Luego "Save & add to dashboard"

5. **Repetir** para cada insight del dashboard

### Método 2: Usando PostHog API (Para crear múltiples dashboards rápido)

**Necesitarás:**
- Personal API Key de PostHog
- Project ID

**Obtener API Key:**
1. PostHog → Settings (⚙️) → Personal API Keys
2. Click "Create personal API key"
3. Nombre: "Dashboard Creation"
4. Permisos: Write access to dashboards
5. Copia la key (empieza con `phx_`)

**Crear Dashboard vía API:**

```bash
# Ejemplo para crear Dashboard #1: Platform Overview

curl -X POST https://app.posthog.com/api/projects/{PROJECT_ID}/dashboards/ \
  -H "Authorization: Bearer phx_YOUR_PERSONAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Platform Overview",
    "description": "Vista general de toda la plataforma PideAI",
    "tags": ["platform", "overview"]
  }'
```

**Crear Insights dentro del Dashboard:**

Ver ejemplos en `posthog-dashboards/dashboard-configs/` (cuando los creemos)

---

## 🔍 Verificar que PostHog está Recibiendo Eventos

### Opción 1: Live Events (Tiempo Real)

1. **Ir a Events**
   ```
   PostHog → Activity (🔴) → Live Events
   ```

2. **Realizar acciones en tu app**
   - Abre tu app: http://localhost:8080
   - Navega, agrega productos al carrito, etc.

3. **Ver eventos aparecer en tiempo real**
   - Deberías ver eventos como:
     - `catalog_page_view`
     - `product_added_to_cart`
     - `$pageview`
     - etc.

### Opción 2: Events Explorer

1. **Ir a Events**
   ```
   PostHog → Events
   ```

2. **Filtrar por evento específico**
   - En el buscador, escribe el nombre del evento (ej: `order_placed`)
   - Verás todas las ocurrencias de ese evento

3. **Inspeccionar Properties**
   - Click en cualquier evento
   - Verás todas las properties enviadas
   - Verifica que `store_id`, `store_name`, etc. estén presentes

---

## 🎯 Dashboards Nuevos (Los que creamos hoy)

Estos dashboards AÚN NO EXISTEN en tu PostHog. Necesitas crearlos siguiendo las guías:

### Dashboard 1: Platform Overview
**Guía:** `posthog-dashboards/dashboard-queries/01-platform-overview-queries.md`

**10 Insights a crear:**
1. Total Tiendas Activas
2. Total Pedidos Hoy
3. Ingresos Totales (GMV)
4. Usuarios Activos
5. Tasa de Conversión Global
6. Pedidos por Estado
7. Crecimiento de Tiendas
8. Top 10 Tiendas
9. Mapa de Calor Horas Pico
10. Tasa de Retención

### Dashboards 2-9
**Guía:** `DANILO_POSTHOG_DASHBOARDS.md`

2. Análisis de Tiendas
3. Deep Dive de Pedidos
4. Productos y Catálogo
5. Clientes y Lifecycle
6. Suscripciones y Revenue (MRR, ARR, Churn)
7. Módulos y Features
8. Performance Técnico
9. Marketing y Adquisición

---

## 📱 PostHog Mobile App

También puedes ver dashboards desde tu teléfono:

1. **Descargar PostHog App**
   - iOS: App Store
   - Android: Google Play Store

2. **Login** con las mismas credenciales

3. **Ver dashboards** en movimiento

---

## 🔗 Enlaces Directos Útiles

Una vez logeado, estos son shortcuts útiles:

**Dashboards:**
```
https://app.posthog.com/project/{PROJECT_ID}/dashboard
```

**Live Events:**
```
https://app.posthog.com/project/{PROJECT_ID}/events
```

**Insights:**
```
https://app.posthog.com/project/{PROJECT_ID}/insights
```

**Settings:**
```
https://app.posthog.com/project/{PROJECT_ID}/settings
```

---

## ❓ Troubleshooting

### No veo ningún dashboard

**Causa:** Los dashboards no han sido creados aún.

**Solución:**
1. Ve a `POSTHOG_SETUP.md` para crear los 5 dashboards básicos
2. O sigue `IMPLEMENTATION_GUIDE.md` para crear los 9 dashboards empresariales

### No veo eventos en Live Events

**Causa 1:** PostHog no está configurado correctamente

**Solución:**
1. Verifica que `.env` tiene las variables:
   ```
   VITE_POSTHOG_KEY=phc_xxxxx
   VITE_POSTHOG_HOST=https://us.i.posthog.com
   ```
2. Reinicia el servidor dev: `npm run dev`
3. Abre la consola del navegador y busca errores de PostHog

**Causa 2:** Estás en el proyecto equivocado

**Solución:**
1. Verifica el Project ID en PostHog UI (arriba a la izquierda)
2. Compáralo con el que está en tu código

### Los números en dashboards parecen incorrectos

**Causa:** Zona horaria diferente

**Solución:**
1. Ve a Settings → Project Settings
2. Revisa "Timezone"
3. Cámbiala a tu zona horaria local

---

## 📞 Soporte

**PostHog Docs:**
https://posthog.com/docs

**PostHog Community (Slack):**
https://posthog.com/questions

**Nuestros archivos de referencia:**
- `DANILO_POSTHOG_DASHBOARDS.md` - Especificaciones completas
- `POSTHOG_SETUP.md` - Setup existente
- `posthog-dashboards/IMPLEMENTATION_GUIDE.md` - Guía paso a paso
- `posthog-dashboards/events-to-track.md` - Lista de eventos

---

## ✅ Checklist Rápido

```
[ ] Tengo acceso a PostHog (https://app.posthog.com)
[ ] Puedo ver "Live Events" en PostHog
[ ] Veo eventos llegando en tiempo real cuando uso la app
[ ] Puedo ver la lista de Dashboards
[ ] (Opcional) Creé mi primer dashboard "Platform Overview"
[ ] (Opcional) Configuré mi Personal API Key
```

---

## 🚀 Próximos Pasos

1. **Hoy:** Login a PostHog y ver si hay dashboards existentes
2. **Esta semana:** Crear Dashboard #1 (Platform Overview) siguiendo la guía
3. **Este mes:** Crear los 9 dashboards restantes
4. **Ongoing:** Implementar eventos nuevos según `events-to-track.md`
