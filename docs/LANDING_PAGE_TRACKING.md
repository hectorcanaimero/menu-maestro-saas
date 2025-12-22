# Landing Page Tracking - PostHog Events

## 📊 Eventos Implementados en Welcome.tsx

### 1. Page View Events

#### `landing_page_viewed`
- **Cuándo se dispara**: Al cargar la página Welcome
- **Propiedades**: ninguna
- **Uso**: Contar total de visitas a la landing

```typescript
posthog.capture('landing_page_viewed');
```

#### `landing_section_viewed`
- **Cuándo se dispara**: Cuando una sección es visible (50% en viewport)
- **Propiedades**:
  - `section`: ID de la sección (`features`, etc.)
- **Uso**: Medir engagement y scroll depth

```typescript
posthog.capture('landing_section_viewed', {
  section: 'features'
});
```

### 2. CTA Click Events

#### `landing_cta_clicked`
- **Cuándo se dispara**: Al hacer click en cualquier CTA de la landing
- **Propiedades**:
  - `cta_type`: Tipo de CTA clickeado
  - `section`: Sección donde está el CTA
- **Valores posibles de cta_type**:
  - `hero_crear_tienda`: CTA principal del hero
  - `hero_iniciar_sesion`: CTA secundario del hero
  - `final_crear_tienda`: CTA principal de cierre
  - `final_ver_demo`: CTA secundario de cierre

```typescript
posthog.capture('landing_cta_clicked', {
  cta_type: 'hero_crear_tienda',
  section: 'hero'
});
```

### 3. Feature Interaction Events

#### `feature_card_hovered`
- **Cuándo se dispara**: Al hacer hover sobre una tarjeta de feature
- **Propiedades**:
  - `feature_title`: Título del feature
  - `feature_index`: Índice del feature (0-3)
- **Uso**: Identificar qué features generan más interés

```typescript
posthog.capture('feature_card_hovered', {
  feature_title: '0% de Comisión',
  feature_index: 0
});
```

---

## 🎯 Funnels a Crear en PostHog

### Funnel 1: Landing → Registro Completo
**Objetivo**: Medir conversión total desde landing hasta registro exitoso

```
1. landing_page_viewed
2. landing_cta_clicked (cta_type = hero_crear_tienda OR final_crear_tienda)
3. store_creation_started (evento del formulario de crear tienda)
4. store_created (evento de éxito)
```

**Meta**:
- Baseline: TBD (medir primero)
- Target Fase 1: +2-3% absoluto
- Target Fase 2: +4-6% absoluto

### Funnel 2: Hero CTA Performance
**Objetivo**: Comparar efectividad de CTAs en hero vs final

```
Hero Flow:
1. landing_page_viewed
2. landing_cta_clicked (cta_type = hero_crear_tienda)
3. store_creation_started

Final Flow:
1. landing_section_viewed (section = features)
2. landing_cta_clicked (cta_type = final_crear_tienda)
3. store_creation_started
```

**Análisis**: Comparar tasas de conversión de ambos flujos

### Funnel 3: Feature Engagement → Conversión
**Objetivo**: Validar si interactuar con features aumenta conversión

```
1. landing_page_viewed
2. feature_card_hovered (cualquier feature)
3. landing_cta_clicked
4. store_created
```

**Hipótesis**: Usuarios que interactúan con features tienen mayor probabilidad de convertir

---

## 📈 Dashboards Sugeridos

### Dashboard 1: Landing Page Overview

**Métricas Clave**:
- Total de vistas de landing (último mes)
- Tasa de conversión landing → registro
- Bounce rate (% que no pasan del hero)
- Scroll depth promedio

**Gráficos**:
1. **Funnel principal** (landing → clic → registro → creación)
2. **Línea de tiempo** de vistas y conversiones
3. **Breakdown de CTAs** clickeados (hero vs final)
4. **Heatmap de features** más interactuantes

### Dashboard 2: A/B Testing Performance

**Comparación Pre vs Post cambios**:
- Conversión baseline (antes de cambios Sofía)
- Conversión post-implementación
- Delta absoluto y relativo
- Significancia estadística

**Segmentación**:
- Por dispositivo (mobile vs desktop)
- Por fuente de tráfico (orgánico, directo, referral)
- Por hora del día / día de semana

### Dashboard 3: Feature Interest Analysis

**Preguntas a responder**:
- ¿Qué feature genera más hovers?
- ¿Usuarios que interactúan con features convierten más?
- ¿Hay features que generan abandono?

**Métricas**:
- Hovers por feature (conteo)
- Tasa de conversión por feature interactuado
- Tiempo en sección de features

---

## 🔬 Experimentos Sugeridos (A/B Tests)

### Experimento 1: Headlines en Hero

**Variantes a testear**:
- **Variante A** (actual): "Tu tienda de pedidos online. Sin comisiones del 30%."
- **Variante B**: "Deja de pagar comisiones. Tu restaurante, tu tienda, tus clientes."
- **Variante C**: "Pedidos online para tu restaurante en menos de 1 hora"

**Métrica primaria**: Tasa de clic en hero_crear_tienda
**Métrica secundaria**: Conversión a registro completo
**Tamaño de muestra**: Mínimo 1000 visitantes por variante
**Duración**: 2 semanas

### Experimento 2: CTA Copy

**Variantes a testear**:
- **Variante A** (actual): "Crear Mi Tienda Gratis" + "Sin tarjeta de crédito"
- **Variante B**: "Empezar Gratis Ahora" + "Sin compromiso"
- **Variante C**: "Probar 30 días gratis" + "Cancela cuando quieras"

**Métrica primaria**: Click-through rate del CTA
**Métrica secundaria**: Tasa de completación del formulario

### Experimento 3: Trust Bar Positioning

**Variantes a testear**:
- **Variante A** (actual): Trust bar después del hero
- **Variante B**: Trust bar dentro del hero (abajo del subheadline)
- **Variante C**: Sin trust bar

**Métrica primaria**: Tasa de scroll hacia features
**Métrica secundaria**: Conversión total

### Experimento 4: Feature Order

**Variantes a testear**:
- **Variante A** (actual): 0% Comisión → Tu Dominio → Activo en Minutos → Panel Total
- **Variante B**: Activo en Minutos → 0% Comisión → Tu Dominio → Panel Total
- **Variante C**: Tu Dominio → Panel Total → 0% Comisión → Activo en Minutos

**Métrica primaria**: Feature hovers por posición
**Métrica secundaria**: Conversión por orden mostrado

---

## 🎨 Eventos Adicionales Recomendados (Próxima Fase)

### Scroll Depth Tracking
```typescript
// Disparar en 25%, 50%, 75%, 100% de scroll
posthog.capture('landing_scroll_depth', {
  depth_percentage: 75
});
```

### Time on Page
```typescript
// Disparar al abandonar la página
posthog.capture('landing_time_on_page', {
  seconds: 45,
  engaged: true // Si hubo interacción
});
```

### Exit Intent
```typescript
// Disparar cuando el mouse sale del viewport
posthog.capture('landing_exit_intent', {
  last_section_viewed: 'features',
  time_on_page: 30
});
```

### Trust Element Clicks
```typescript
// Si agregas elementos clickeables en trust bar
posthog.capture('trust_element_clicked', {
  element_type: 'testimonial' | 'stat' | 'logo'
});
```

---

## 📋 Checklist de Implementación PostHog

### Eventos ✅
- [x] `landing_page_viewed`
- [x] `landing_section_viewed`
- [x] `landing_cta_clicked`
- [x] `feature_card_hovered`
- [ ] `store_creation_started` (siguiente paso - formulario)
- [ ] `store_created` (siguiente paso - formulario)

### Funnels 📊
- [ ] Crear Funnel 1: Landing → Registro Completo
- [ ] Crear Funnel 2: Hero vs Final CTA
- [ ] Crear Funnel 3: Feature Engagement

### Dashboards 📈
- [ ] Dashboard: Landing Page Overview
- [ ] Dashboard: A/B Testing Performance
- [ ] Dashboard: Feature Interest Analysis

### Insights 🔍
- [ ] Configurar Insight: Conversión semanal
- [ ] Configurar Insight: Top features por hovers
- [ ] Configurar Insight: Bounce rate por sección
- [ ] Configurar Insight: Device breakdown

---

## 🎯 KPIs y Metas

### Métricas Baseline (Pre-cambios Sofía)
**Medir durante 1 semana antes de deploy**:
- [ ] Visitas totales a /welcome: ____ visitantes
- [ ] Tasa de conversión landing → clic en CTA: ____%
- [ ] Tasa de conversión landing → registro: ____%
- [ ] Bounce rate: ____%
- [ ] Tiempo promedio en página: ____ segundos
- [ ] Scroll depth promedio: ____%

### Metas Post-Implementación

#### Fase 1 (Cambios Críticos) - Semana 1-2
- **Meta 1**: Aumentar CTR del hero CTA en +50% (ej: 5% → 7.5%)
- **Meta 2**: Reducir bounce rate en -20% (ej: 60% → 48%)
- **Meta 3**: Aumentar scroll depth promedio en +30% (ej: 40% → 52%)
- **Meta 4**: Aumentar conversión landing → registro en +2-3% absoluto

#### Fase 2 (Optimizaciones) - Semana 3-4
- **Meta 5**: Aumentar conversión total en +4-6% absoluto vs baseline
- **Meta 6**: Aumentar engagement con features (>30% de usuarios interactúan)
- **Meta 7**: Tiempo en página >60 segundos (usuarios engaged)

### Criterios de Éxito
- ✅ **Éxito total**: Conversión mejora >5% absoluto vs baseline
- ⚠️ **Éxito parcial**: Conversión mejora 2-5% absoluto
- ❌ **Sin impacto**: Conversión mejora <2% absoluto (iterar)

---

## 🔄 Proceso de Monitoreo

### Diario (Primeros 7 días)
1. Revisar total de vistas y conversiones
2. Verificar que eventos se están capturando correctamente
3. Monitorear errores o anomalías en los datos

### Semanal (Semanas 2-4)
1. Comparar métricas vs baseline
2. Analizar qué CTAs funcionan mejor
3. Revisar features con más engagement
4. Identificar patrones de abandono

### Mensual (Ongoing)
1. Análisis profundo de funnels
2. Proponer nuevos experimentos A/B
3. Optimizaciones basadas en data
4. Documentar aprendizajes

---

## 📚 Recursos Adicionales

### PostHog Queries Útiles

**Query 1: Tasa de conversión por CTA**
```sql
-- Eventos: landing_cta_clicked → store_created
-- Breakdown: cta_type
-- Visualization: Funnel
```

**Query 2: Features más populares**
```sql
-- Evento: feature_card_hovered
-- Breakdown: feature_title
-- Visualization: Bar chart
```

**Query 3: Scroll depth distribution**
```sql
-- Evento: landing_section_viewed
-- Count unique users per section
-- Visualization: Funnel horizontal
```

### Links Relevantes
- [PostHog Funnels Documentation](https://posthog.com/docs/user-guides/funnels)
- [PostHog A/B Testing Guide](https://posthog.com/docs/user-guides/experimentation)
- [Landing Page Best Practices](https://www.optimizely.com/optimization-glossary/landing-page-optimization/)

---

**Versión**: 1.0
**Fecha**: 2024-12-22
**Autor**: Sofía (Marketing Agent)
**Última actualización**: Implementación inicial de eventos en Welcome.tsx
