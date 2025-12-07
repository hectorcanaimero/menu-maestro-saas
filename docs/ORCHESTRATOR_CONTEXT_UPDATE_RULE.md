# Orchestrator Context Update Rule - Implementation

## 📋 Overview

Se ha implementado una nueva regla crítica en el agente `@orchestrator` que establece que **siempre debe actualizar los contextos** de todos los agentes cuando se implementen nuevas funcionalidades o features en la plataforma.

## ✅ Cambios Realizados

### 1. Nueva Regla en "Reglas de Oro"

**Archivo**: `.claude/prompts/orchestrator-agent.md`

Se agregó la regla #9:

```markdown
9. **ACTUALIZA CONTEXTOS cuando agregues nuevas features o funcionalidades** (ver Fase 5)
```

Esta regla obliga al orquestador a actualizar contextos después de implementar cualquier feature.

### 2. Nueva Fase 5: Actualización de Contextos

Se agregó una nueva fase en el workflow principal:

```markdown
### Fase 5: Actualización de Contextos (para nuevas features)

**Cuando se implementa una nueva funcionalidad SIEMPRE:**
1. Actualiza el **Contexto del Proyecto** en este mismo archivo con la nueva feature
2. Revisa y actualiza los contextos de **TODOS los agentes** afectados:
   - `.claude/prompts/developer-agent.md` - Si la feature afecta desarrollo
   - `.claude/prompts/supabase-agent.md` - Si la feature usa DB/Edge Functions
   - `.claude/prompts/security-agent.md` - Si la feature tiene implicaciones de seguridad
   - `.claude/prompts/posthog-agent.md` - Si la feature requiere analytics
   - `.claude/prompts/devops-agent.md` - Si la feature afecta deployment/infra
   - `.claude/prompts/ux-validator-agent.md` - Si la feature tiene componentes de UI
3. Actualiza `CLAUDE.md` si la feature cambia la arquitectura o flujos principales
4. Reporta al usuario qué contextos fueron actualizados
```

### 3. Nuevo Patrón de Workflow: "Context Update"

Se agregó un patrón específico para actualizaciones de contexto:

```markdown
### Context Update (después de nueva feature)
1. @orchestrator → Actualiza propio contexto con la nueva feature
2. @orchestrator → Identifica agentes afectados
3. @orchestrator → Actualiza contextos de cada agente relevante
4. @orchestrator → Actualiza CLAUDE.md si es necesario
5. @orchestrator → Reporta cambios al usuario
```

### 4. Actualización del Mantra

El mantra del orquestador se actualizó para incluir el paso de Context Update:

**Antes:**
```
"Resumen → Confirmación → Análisis → Plan → Ejecución → Validación → Reporte"
```

**Después:**
```
"Resumen → Confirmación → Análisis → Plan → Ejecución → Validación → Reporte → Context Update"
```

### 5. Ejemplo Actualizado

Se actualizó el ejemplo de ejecución completa para incluir la Fase 7 de actualización de contextos:

```markdown
## Fase 7: Actualización de Contextos

Actualizando contextos con la nueva feature "Sistema de Cupones"...

### Contextos Actualizados:
- ✅ `.claude/prompts/orchestrator-agent.md` - Agregado "Sistema de cupones" a características principales
- ✅ `.claude/prompts/developer-agent.md` - Agregado contexto de cupones y ejemplos
- ✅ `.claude/prompts/supabase-agent.md` - Documentadas tablas `coupons` y `coupon_usage`
- ✅ `.claude/prompts/security-agent.md` - Agregadas validaciones específicas de cupones
- ✅ `.claude/prompts/posthog-agent.md` - Documentados eventos de cupones
- ✅ `CLAUDE.md` - Actualizada sección de features con sistema de cupones
```

### 6. Recordatorio en "NUNCA olvides"

Se agregó un segundo punto en la sección final:

```markdown
**NUNCA olvides:**
- El resumen ejecutivo es OBLIGATORIO en cada tarea
- Actualizar contextos después de implementar nuevas features
```

## 🎯 Objetivo de la Regla

Esta regla garantiza que:

1. **Todos los agentes estén sincronizados** con las nuevas funcionalidades del proyecto
2. **No se pierda contexto** entre implementaciones
3. **Los agentes futuros tengan información actualizada** sobre qué features existen
4. **La documentación del proyecto se mantenga al día** automáticamente
5. **Haya trazabilidad** de qué contextos se actualizaron con cada feature

## 📂 Archivos Afectados por esta Regla

Cuando se implemente una nueva feature, el orquestador debe revisar y actualizar según corresponda:

### Siempre actualizar:
- `.claude/prompts/orchestrator-agent.md` - Contexto del Proyecto (sección "Características principales")

### Actualizar según la feature:
- `.claude/prompts/developer-agent.md` - Si involucra desarrollo frontend/backend
- `.claude/prompts/supabase-agent.md` - Si involucra DB, RLS, o Edge Functions
- `.claude/prompts/security-agent.md` - Si tiene implicaciones de seguridad
- `.claude/prompts/posthog-agent.md` - Si requiere tracking o analytics
- `.claude/prompts/devops-agent.md` - Si afecta deployment o infraestructura
- `.claude/prompts/ux-validator-agent.md` - Si tiene componentes de UI/UX
- `CLAUDE.md` - Si cambia arquitectura, rutas, o flujos principales del proyecto

## 🔄 Workflow Completo con Context Update

El workflow completo ahora es:

```
1. Fase 0: Resumen Ejecutivo → Usuario aprueba
2. Fase 1: Análisis
3. Fase 2: Planificación
4. Fase 3: Ejecución (coordinar agentes)
5. Fase 4: Reporte (resultados)
6. Fase 5: Context Update (actualizar todos los contextos) ← NUEVO
```

## ✅ Estado

- ✅ Regla agregada a "Reglas de Oro"
- ✅ Fase 5 agregada al workflow
- ✅ Patrón de workflow "Context Update" creado
- ✅ Mantra actualizado
- ✅ Ejemplo actualizado con Fase 7
- ✅ Recordatorio agregado a "NUNCA olvides"

## 📝 Próximos Pasos

Ahora que la regla está implementada, el orquestador:

1. **Después de implementar cualquier feature**, debe ejecutar la Fase 5
2. **Identificar qué agentes se ven afectados** por la nueva funcionalidad
3. **Actualizar los archivos de prompts** de esos agentes con la nueva información
4. **Reportar al usuario** qué contextos fueron actualizados

## 🎉 Resultado

El agente `@orchestrator` ahora tiene instrucciones explícitas para mantener todos los contextos actualizados automáticamente después de cada implementación de feature, garantizando que todos los agentes especializados estén siempre sincronizados con el estado actual del proyecto.

---

**Implementado**: 2025-12-05
**Archivo**: `.claude/prompts/orchestrator-agent.md`
**Estado**: ✅ Completado
