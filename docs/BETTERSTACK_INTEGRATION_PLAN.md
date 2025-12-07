# Resumen Ejecutivo: Integración con Better Stack

**Proyecto:** PideAI - Plataforma Multi-tenant de Pedidos
**Fecha:** 2025-12-06
**Versión:** 1.0

---

## 🎯 Objetivo

Integrar Better Stack (formerly Logtail) como solución unificada de monitoreo, logging y observabilidad para mejorar la detección temprana de errores, reducir el tiempo de resolución de incidentes (MTTR) y optimizar la experiencia del usuario en producción.

---

## 📊 Contexto Actual

### Herramientas Actuales

| Herramienta | Uso Actual | Limitaciones |
|-------------|-----------|--------------|
| **Sentry** | Error tracking y performance monitoring | - Solo errores frontend<br>- No incluye logs de sistema<br>- Limitado a errores de JavaScript |
| **Chatwoot** | Soporte al cliente en tiempo real | - Solo chat<br>- No integrado con logs técnicos |
| **Supabase Logs** | Logs de Edge Functions | - UI limitada<br>- Sin alertas<br>- Retención corta (7 días) |

### Problemas Identificados

1. **Fragmentación:** Los logs están dispersos entre Sentry, Supabase y navegador
2. **Sin correlación:** No podemos rastrear un error desde el frontend hasta la edge function
3. **Alertas limitadas:** Solo errores de Sentry, no hay alertas de sistema
4. **Retención corta:** Logs de Supabase se borran después de 7 días
5. **Sin métricas de negocio:** No rastreamos KPIs críticos como tiempo de generación de imágenes AI

---

## 💡 Por Qué Better Stack

### Ventajas Competitivas

| Característica | Better Stack | Alternativas |
|----------------|--------------|--------------|
| **Precio** | $20/mes (50GB) | Datadog: $150/mes, New Relic: $100/mes |
| **Setup** | < 30 min | Datadog/NR: 2-4 horas |
| **UI/UX** | Moderna, intuitiva | Datadog/NR: Compleja, curva de aprendizaje alta |
| **Logs + Uptime** | Incluido | Datadog: productos separados |
| **SQL Queries** | Sí | Datadog: No, Elasticsearch DSL |

### Casos de Uso Reales

1. **Gemini API Errors:** Detectar cuando la API de Gemini falla y alertar automáticamente
2. **Performance Degradation:** Alertar si las imágenes AI tardan más de 30s en generarse
3. **Order Pipeline:** Rastrear el flujo completo de una orden (frontend → edge function → DB → WhatsApp)
4. **Store Downtime:** Monitorear uptime de todas las tiendas multi-tenant
5. **User Experience:** Correlacionar errores de Sentry con logs de backend

---

## 🏗️ Arquitectura de Integración

```
┌─────────────────┐
│   React App     │
│  (Frontend)     │
│                 │
│  - Sentry       │──┐
│  - Browser Logs │  │
└─────────────────┘  │
                     │
                     ▼
              ┌──────────────┐
              │ Better Stack │
              │   Platform   │
              └──────────────┘
                     ▲
                     │
┌─────────────────┐  │
│ Supabase Edge   │  │
│   Functions     │──┘
│                 │
│ - Gemini API    │
│ - Order Mgmt    │
│ - WhatsApp      │
└─────────────────┘
```

### Componentes a Integrar

1. **Frontend (React)**
   - Browser console logs → Better Stack
   - Errores de Sentry → Better Stack (vía webhook)
   - Performance metrics (Core Web Vitals)

2. **Backend (Supabase Edge Functions)**
   - Logs estructurados con contexto
   - Métricas de latencia de API
   - Errores y excepciones

3. **External APIs**
   - Gemini API response times
   - WhatsApp API status
   - Payment gateway logs

4. **Uptime Monitoring**
   - Health checks de tiendas
   - API endpoints críticos
   - Edge functions availability

---

## 📋 Plan de Implementación

### Fase 1: Setup Básico (Semana 1)

**Duración:** 2-3 días
**Esfuerzo:** 8 horas

#### Tareas

1. **Crear cuenta Better Stack**
   - Plan: Developer ($20/mes, 50GB logs)
   - Obtener API key y source tokens

2. **Integrar Edge Functions**
   - Instalar `@logtail/node` en Edge Functions
   - Configurar logger estructurado
   - Enviar logs de `enhance-product-image`

3. **Configurar Uptime Monitors**
   - Monitor principal: `https://totus.pideai.com`
   - Health checks cada 1 minuto
   - Alertas por email/Slack

**Entregables:**
- ✅ Logs de Edge Functions visibles en Better Stack
- ✅ Uptime monitor activo
- ✅ Primera alerta de prueba funcionando

---

### Fase 2: Logging Avanzado (Semana 2)

**Duración:** 3-4 días
**Esfuerzo:** 12 horas

#### Tareas

1. **Structured Logging**
   - Definir schema de logs estándar
   - Agregar contexto: `store_id`, `user_id`, `trace_id`
   - Logs con niveles: `debug`, `info`, `warn`, `error`

2. **Frontend Integration**
   - Agregar `@logtail/browser` al React app
   - Capturar errores no manejados
   - Enviar Core Web Vitals

3. **Correlación de Eventos**
   - Implementar `trace_id` único por request
   - Propagar trace_id de frontend a backend
   - Logs correlacionados en Better Stack

**Entregables:**
- ✅ Logs estructurados con contexto completo
- ✅ Trazabilidad end-to-end de requests
- ✅ Frontend enviando logs a Better Stack

---

### Fase 3: Alertas y Dashboards (Semana 3)

**Duración:** 3-4 días
**Esfuerzo:** 10 horas

#### Tareas

1. **Alertas Críticas**
   - Gemini API error rate > 5%
   - Image generation time > 30s
   - Order pipeline failures
   - Store downtime > 2 minutos

2. **Dashboards Operacionales**
   - Dashboard de AI Studio (imágenes generadas, errores, latencia)
   - Dashboard de Orders (volumen, errores, WhatsApp delivery)
   - Dashboard de Stores (uptime, performance)

3. **Integración con Sentry**
   - Webhook de Sentry → Better Stack
   - Correlacionar errores de Sentry con logs de backend
   - Dashboard unificado de errores

**Entregables:**
- ✅ 5-7 alertas críticas configuradas
- ✅ 3 dashboards operacionales
- ✅ Sentry integrado con Better Stack

---

### Fase 4: Métricas de Negocio (Semana 4)

**Duración:** 2-3 días
**Esfuerzo:** 8 horas

#### Tareas

1. **Custom Metrics**
   - AI images generated per day
   - Average order processing time
   - WhatsApp delivery success rate
   - Peak traffic hours per store

2. **Business Insights**
   - Store performance comparison
   - AI credits usage trends
   - Order failure root causes

3. **Optimización de Costos**
   - Log sampling para logs de bajo valor
   - Retención diferenciada (errors: 90d, info: 30d)
   - Optimizar volumen de logs

**Entregables:**
- ✅ Métricas de negocio visibles
- ✅ Insights accionables para product
- ✅ Costos optimizados < $30/mes

---

## 💰 Análisis Costo-Beneficio

### Costos

| Item | Costo Mensual | Costo Anual |
|------|---------------|-------------|
| Better Stack (Developer) | $20 | $240 |
| Tiempo de implementación | ~$400 (40h × $10/h) | - |
| Mantenimiento mensual | ~$50 (5h × $10/h) | $600 |
| **Total Año 1** | - | **$1,240** |
| **Total Años Siguientes** | - | **$840/año** |

### Beneficios

| Beneficio | Impacto Cuantificable |
|-----------|----------------------|
| **Reducción MTTR** | De 2 horas → 30 minutos (75% mejora) |
| **Prevención de Downtime** | $500/hora × 5 horas/año ahorradas = **$2,500/año** |
| **Detección temprana de bugs** | 3-5 bugs críticos prevenidos = **$1,500/año** |
| **Optimización de costos AI** | Detectar API abuse, ahorrar 10% = **$200/año** |
| **Mejor customer experience** | Menos tickets de soporte = **$300/año** |
| **Total Beneficios Año 1** | **$4,500/año** |

### ROI

```
ROI = (Beneficios - Costos) / Costos × 100
ROI = ($4,500 - $1,240) / $1,240 × 100 = 263%
```

**Retorno de inversión:** 263% en el primer año
**Payback period:** ~3.3 meses

---

## 🎯 Métricas de Éxito

### KPIs Técnicos

| Métrica | Baseline Actual | Meta (3 meses) |
|---------|----------------|----------------|
| MTTR (Mean Time To Resolution) | 2 horas | 30 minutos |
| Error Detection Time | 1-4 horas | < 5 minutos |
| Log Retention | 7 días | 90 días (errors) |
| Incident Response Time | Manual | Automático + alerta |
| Correlación de eventos | 0% | 90%+ |

### KPIs de Negocio

| Métrica | Baseline Actual | Meta (3 meses) |
|---------|----------------|----------------|
| AI API Uptime | 95%? | 99.5% |
| Order Success Rate | 90%? | 97% |
| Customer Support Tickets (bugs) | 10/mes | 3/mes |
| Downtime Cost | $500/mes | $100/mes |

---

## ⚠️ Riesgos y Mitigaciones

### Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Volumen de logs excede 50GB** | Media | Alto | - Sampling de logs de bajo valor<br>- Filtrar logs verbosos<br>- Upgrade a plan superior si ROI lo justifica |
| **Latencia por logging** | Baja | Medio | - Logs asíncronos<br>- Buffering local<br>- Monitorear overhead |
| **Vendor lock-in** | Media | Medio | - Logs en formato estándar (JSON)<br>- Abstracción con interfaz de logger<br>- Plan de migración documentado |
| **Curva de aprendizamiento** | Baja | Bajo | - Documentación interna<br>- Training sessions<br>- Runbooks |

---

## 📚 Recursos Necesarios

### Equipo

| Rol | Horas Estimadas | Responsabilidades |
|-----|-----------------|-------------------|
| **Backend Developer** | 24h | Edge functions, structured logging, APIs |
| **Frontend Developer** | 12h | Browser logging, Sentry integration |
| **DevOps/SRE** | 8h | Uptime monitors, alertas, dashboards |
| **Product Manager** | 4h | Definir métricas de negocio, dashboards |

### Herramientas

- Better Stack account (Developer plan)
- Acceso a Supabase (Edge Functions, secrets)
- Acceso a Sentry (webhooks)
- Slack o email para alertas

---

## 📅 Timeline

```
Semana 1: Setup Básico
├─ Día 1-2: Crear cuenta, configurar Edge Functions
├─ Día 3-4: Uptime monitors, primera alerta
└─ Día 5: Testing y documentación

Semana 2: Logging Avanzado
├─ Día 1-2: Structured logging schema
├─ Día 3-4: Frontend integration
└─ Día 5: Correlación y testing

Semana 3: Alertas y Dashboards
├─ Día 1-2: Configurar alertas críticas
├─ Día 3-4: Crear dashboards
└─ Día 5: Integración Sentry

Semana 4: Métricas de Negocio
├─ Día 1-2: Custom metrics
├─ Día 3-4: Business insights
└─ Día 5: Optimización de costos
```

**Duración total:** 4 semanas
**Esfuerzo total:** ~40 horas

---

## 🚀 Quick Wins (Primeros 7 días)

Resultados tangibles en la primera semana:

1. ✅ **Visibilidad total de Edge Functions** - Ver todos los logs de Gemini API en un solo lugar
2. ✅ **Uptime monitoring** - Saber si el sitio está caído antes que los usuarios
3. ✅ **Primera alerta crítica** - Notificación automática si Gemini API falla
4. ✅ **Logs centralizados** - No más búsqueda en múltiples herramientas
5. ✅ **SQL queries** - Analizar patrones de errores fácilmente

---

## 📖 Próximos Pasos

### Inmediatos (Esta semana)

1. [ ] Revisar y aprobar este documento
2. [ ] Crear cuenta en Better Stack (Developer plan)
3. [ ] Obtener approval de presupuesto ($20/mes)
4. [ ] Asignar developer para Fase 1

### Semana 1

1. [ ] Kickoff meeting con equipo
2. [ ] Configurar primer source en Better Stack
3. [ ] Integrar `enhance-product-image` edge function
4. [ ] Configurar primer uptime monitor

---

## 📞 Contacto y Soporte

**Better Stack:**
- Documentación: https://betterstack.com/docs
- Soporte: support@betterstack.com
- Status page: https://status.betterstack.com

**Equipo Interno:**
- Lead Developer: [Nombre]
- DevOps: [Nombre]
- Product Manager: [Nombre]

---

## 🎓 Recursos de Aprendizaje

### Documentación Técnica

1. [Better Stack Quick Start](https://betterstack.com/docs/logs/getting-started/)
2. [Logging Best Practices](https://betterstack.com/docs/logs/best-practices/)
3. [Uptime Monitoring Guide](https://betterstack.com/docs/uptime/)
4. [Alerting Setup](https://betterstack.com/docs/uptime/alerting/)

### Ejemplos de Código

- [Deno Edge Functions + Logtail](https://github.com/logtail/logtail-js/tree/master/packages/node)
- [React + Browser Logging](https://github.com/logtail/logtail-js/tree/master/packages/browser)
- [Sentry Integration](https://betterstack.com/docs/logs/integrations/sentry/)

---

## 📊 Anexos

### A. Ejemplo de Log Estructurado

```json
{
  "level": "info",
  "timestamp": "2025-12-06T10:30:45.123Z",
  "message": "Gemini image generated successfully",
  "context": {
    "store_id": "totus-123",
    "user_id": "user-456",
    "trace_id": "trace-789",
    "menu_item_id": "item-abc",
    "style": "top_view",
    "aspect_ratio": "1:1"
  },
  "metrics": {
    "duration_ms": 8432,
    "image_size_kb": 245,
    "api_cost_usd": 0.039
  },
  "metadata": {
    "model": "gemini-2.5-flash-image",
    "function": "enhance-product-image",
    "version": "2.0.0"
  }
}
```

### B. Ejemplo de Dashboard SQL Query

```sql
-- Top 5 errores más frecuentes (últimas 24h)
SELECT
  context.function,
  message,
  COUNT(*) as count
FROM logs
WHERE
  level = 'error'
  AND dt >= NOW() - INTERVAL 24 HOUR
GROUP BY context.function, message
ORDER BY count DESC
LIMIT 5
```

### C. Plan de Migración (Si necesario)

En caso de necesitar migrar de Better Stack a otra plataforma:

1. **Exportar logs** - Better Stack permite exportación en JSON
2. **Cambiar logger** - Interfaz abstracta permite swap sin cambios en código
3. **Migrar dashboards** - SQL queries son portables
4. **Actualizar alertas** - Reconfigurar en nueva plataforma

**Tiempo estimado de migración:** 2-3 días

---

**Documento preparado por:** Claude AI (Orchestrator Agent)
**Fecha de última actualización:** 2025-12-06
**Versión:** 1.0
**Estado:** Borrador para revisión
