# Agentes Especializados - Menu Maestro

Este proyecto incluye **6 agentes especializados** que pueden ayudarte con diferentes aspectos del desarrollo.

## 🤖 Agentes Disponibles

### 0. 🎯 Orchestrator Agent (`@orchestrator`) ⭐ NUEVO

**Especialidad:** Coordinación y Planificación Multi-Agente

**Cuándo usar:**
- **SIEMPRE que tengas una solicitud compleja** (feature, bug, optimización)
- Quieres que se coordinen múltiples agentes automáticamente
- No estás seguro qué agente usar
- Necesitas un workflow end-to-end

**Qué hace:**
1. **Analiza** tu solicitud (feature, bug, etc.)
2. **Planifica** qué agentes necesita y en qué orden
3. **Coordina** la ejecución secuencial de agentes
4. **Supervisa** el progreso con TodoWrite
5. **Reporta** resultado final completo

**Capacidades:**
- ✅ Planificación inteligente de tareas
- ✅ Coordinación de múltiples agentes
- ✅ Tracking de progreso (TodoWrite)
- ✅ Decisión automática de prioridades
- ✅ Workflow optimizado

**Ejemplo de uso:**
```
@orchestrator implementa un sistema de cupones de descuento completo
```

```
@orchestrator hay un bug donde los clientes no pueden confirmar órdenes con delivery
```

```
@orchestrator optimiza el dashboard de admin que está muy lento
```

**Workflow típico:**
1. Tú: "Quiero [feature/bug/optimización]"
2. Orchestrator: Analiza y crea plan
3. Orchestrator: Invoca @supabase → @security → @developer → @posthog
4. Orchestrator: Te reporta resultado completo

**Ventajas:**
- 🎯 Un solo comando para tareas complejas
- 🔄 Workflow automático optimizado
- ✅ No olvida ningún paso crítico
- 📊 Tracking de progreso visible
- 🚀 Más rápido que invocar agentes manualmente

---

### 0.5. 🎨 UX Validator Agent (`@ux-validator`) ⭐ NUEVO

**Especialidad:** Validación de Experiencia de Usuario y Usabilidad

**Cuándo usar:**
- **AUTOMÁTICAMENTE** después de que @developer cree/modifique una interfaz
- Validar accesibilidad y usabilidad de componentes
- Revisar diseño mobile-first y responsiveness
- Analizar flujos de usuario y friction points
- Evaluar consistencia visual y UX patterns

**Qué hace:**
1. **Analiza** la interfaz creada/modificada
2. **Valida** usabilidad, accesibilidad (WCAG), mobile-first
3. **Identifica** friction points y problemas de UX
4. **Provee** insights accionables y sugerencias de mejora
5. **Reporta** score de UX con recomendaciones priorizadas

**Capacidades:**
- ✅ Análisis de usabilidad y flujos de usuario
- ✅ Validación WCAG 2.1 (A, AA, AAA)
- ✅ Mobile-first design review (touch targets, font sizes)
- ✅ Análisis de consistencia visual
- ✅ Evaluación de cognitive load
- ✅ Review de microinteracciones
- ✅ Performance UX (loading states, feedback)
- ✅ Cross-device compatibility

**Criterios de evaluación:**
- **Usabilidad** (1-10): Facilidad de uso, claridad, eficiencia
- **Accesibilidad** (1-10): WCAG compliance, keyboard nav, screen readers
- **Mobile-First** (1-10): Touch targets, responsive, gestures
- **Consistencia** (1-10): Design system, patterns, branding
- **Performance UX** (1-10): Loading states, feedback, animations

**Ejemplo de uso:**
```
@developer crea el componente OrderTrackingCard
[Developer implementa]

@ux-validator valida el componente OrderTrackingCard recién creado
```

**Output típico:**
```markdown
## 🎨 UX Validation Report: OrderTrackingCard

### Scores
- Usabilidad: 8/10
- Accesibilidad: 6/10
- Mobile-First: 9/10
- Consistencia: 7/10
- Performance UX: 8/10

### ✅ Fortalezas
- Touch targets > 44px ✓
- Responsive design bien implementado ✓
- Loading states presentes ✓

### ⚠️ Issues Críticos (P1)
1. Falta aria-label en botón de tracking
2. Contraste de texto insuficiente (3.2:1, necesita 4.5:1)

### 💡 Sugerencias de Mejora (P2)
1. Agregar skeleton loading state
2. Mejorar feedback visual al tocar botones
3. Considerar vibration API para notificaciones

### 🎯 Recomendaciones
- Priorizar issues P1 antes de merge
- Considerar agregar tests de accesibilidad
```

**Workflow automático:**
Cuando @orchestrator o el usuario invoca @developer para crear UI:
1. @developer implementa la interfaz
2. @ux-validator se activa automáticamente
3. Valida y reporta insights
4. @developer ajusta si hay issues P1

---

### 1. 👨‍💻 Developer Agent (`@developer`)

**Especialidad:** Desarrollo Full-Stack Mobile-First

**Cuándo usar:**
- Implementar features completas con tests
- Resolver issues de GitHub
- Crear componentes responsivos (mobile-first)
- Optimizar UI/UX para móvil (80%+ usuarios)

**Capacidades:**
- ✅ React + TypeScript + Vite
- ✅ Supabase integration
- ✅ shadcn/ui components
- ✅ Mobile-first responsive design
- ✅ Multi-tenant architecture
- ✅ Testing (Vitest + React Testing Library)

**Workflow:**
1. Analiza el issue en GitHub
2. Crea plan detallado con TodoWrite
3. Implementa con tests
4. Valida (build + lint + tests)
5. Documenta y cierra el issue

**Ejemplo de uso:**
```
@developer implementa el issue #56 para split de componentes grandes.
Asegúrate de mantener mobile-first y agregar tests.
```

**Prioridades:**
- P1-critical → P2-high → P3-medium → P4-low
- Bugs primero, luego features
- Siempre mobile-first (44px touch targets, 16px font inputs)

---

### 2. 📊 PostHog Agent (`@posthog`)

**Especialidad:** Analytics, Funnels, Insights

**Cuándo usar:**
- Analizar conversión y abandono
- Crear dashboards y funnels
- Optimizar tracking de eventos
- Obtener insights de comportamiento de usuarios

**Capacidades:**
- ✅ Crear funnels y trends en PostHog
- ✅ Analizar datos de conversión
- ✅ Configurar dashboards
- ✅ Query eventos con MCP
- ✅ Breakdowns por device, store, order_type

**Eventos actuales:**
- `product_added_to_cart` ✅
- `product_removed_from_cart` ✅
- `cart_viewed` ✅
- `checkout_started` ✅
- `checkout_step_completed` (steps 1-3) ✅
- `order_placed` ✅

**Funnels configurados:**
1. Cart Abandonment Funnel
2. Checkout Conversion Funnel
3. Cart Value Analysis
4. Device Performance

**Ejemplo de uso:**
```
@posthog analiza la conversión del checkout y dime dónde está
el mayor drop-off. Compara delivery vs pickup.
```

```
@posthog crea un dashboard para analizar el comportamiento de
usuarios mobile vs desktop
```

**Acceso MCP:**
- PostHog Project ID: 185811
- Dashboard principal: https://us.i.posthog.com/project/185811/dashboard/806454

---

### 3. 🗄️ Supabase Agent (`@supabase`)

**Especialidad:** Base de Datos, RLS, Migraciones

**Cuándo usar:**
- Diseñar schema y migraciones
- Crear/optimizar queries SQL
- Configurar RLS policies
- Debuggear problemas de performance
- Implementar Edge Functions
- Configurar Storage policies

**Capacidades:**
- ✅ PostgreSQL queries y optimización
- ✅ Row Level Security (RLS) policies
- ✅ Database migrations
- ✅ Indexes y performance tuning
- ✅ Supabase Edge Functions (Deno)
- ✅ Storage bucket policies
- ✅ Realtime subscriptions

**Schema actual:**
- `stores` - Tiendas (multi-tenant root)
- `categories` - Categorías por tienda
- `menu_items` - Productos/platos
- `orders` - Órdenes de clientes
- `order_items` - Items de órdenes
- `customers` - Información de clientes
- `delivery_zones` - Zonas de entrega
- `product_extras` - Extras de productos
- `payment_methods` - Métodos de pago
- `store_hours` - Horarios de tienda

**Ejemplo de uso:**
```
@supabase necesito agregar una tabla para tracking de inventario
por producto. Debe llevar historial de cambios de stock.
```

```
@supabase este query de órdenes está tardando 3 segundos:
[pega query]. Ayúdame a optimizarlo.
```

```
@supabase revisa las políticas RLS de la tabla orders y asegura
que cada tienda solo vea sus propias órdenes
```

**Acceso MCP:**
- Puede inspeccionar schema actual
- Analizar políticas RLS
- Revisar índices existentes
- Consultar constraints

---

### 4. 🔒 Security & QA Agent (`@security`)

**Especialidad:** Security Audits, Code Quality, Testing Strategy

**Cuándo usar:**
- Auditar código antes de merge/release
- Revisar vulnerabilidades de seguridad
- Validar aislamiento multi-tenant
- Diseñar estrategia de testing
- Verificar compliance (WCAG, GDPR)
- Review de features críticas

**Capacidades:**
- ✅ Security audits (XSS, SQL injection, CSRF)
- ✅ Multi-tenant isolation validation
- ✅ Code quality reviews (TypeScript, React patterns)
- ✅ Testing strategy (unit, integration, E2E)
- ✅ Accessibility audits (WCAG 2.1)
- ✅ Performance analysis (Lighthouse, bundle size)
- ✅ Dependency audits (npm audit)

**Áreas críticas:**
- **Multi-tenant security:** Detectar leaks entre tiendas
- **File uploads:** Validar tipo, tamaño, contenido
- **Input sanitization:** Prevenir XSS/injection
- **RLS policies:** Verificar políticas correctas
- **Credentials:** Detectar secrets hardcoded
- **CSRF protection:** Validar tokens

**Ejemplo de uso:**
```
@security haz un audit completo antes del release v3.1
Prioriza multi-tenant isolation y file uploads
```

```
@developer implementó el sistema de cupones
@security revisa la implementación para vulnerabilidades
```

```
@security diseña la estrategia de testing para el checkout flow
incluyendo edge cases y security tests
```

**Issues relacionados:**
- #51 - TypeScript Strict Mode (eliminar 'any')
- #53 - Error Boundaries
- #55 - Server-side File Validation
- #58 - CSRF Protection
- #59 - Input Sanitization
- #63 - Accessibility (WCAG)

**Workflow:**
1. Pre-implementation: Revisa diseño, sugiere mejoras
2. Pre-merge: Audita código, identifica vulnerabilidades
3. Post-deploy: Monitorea errores, valida security

---

### 5. 🚀 DevOps Agent (`@devops`) ⭐ NUEVO

**Especialidad:** Docker Swarm, CI/CD, Multi-tenant Infrastructure

**Cuándo usar:**
- Configurar/actualizar Docker y GitHub Actions
- Deploy a staging/production
- Configurar Traefik routing
- Gestionar Portainer stacks
- Escalar/monitorear servicios
- Troubleshooting de infraestructura

**Capacidades:**
- ✅ Docker Swarm orchestration
- ✅ GitHub Actions CI/CD pipelines
- ✅ Multi-tenant Traefik configuration
- ✅ Portainer stack management
- ✅ Zero-downtime deployments
- ✅ Rollback strategies
- ✅ Health monitoring
- ✅ SSL/TLS con Let's Encrypt

**Infraestructura:**
- **Orchestration:** Docker Swarm (3+ replicas)
- **Reverse Proxy:** Traefik 2.x (wildcard SSL)
- **Management:** Portainer
- **Registry:** GitHub Container Registry
- **CI/CD:** GitHub Actions
- **Routing:** Subdomain-based (tienda1.pideai.com)

**Ejemplo de uso:**
```
@devops configura GitHub Actions para build automático
```

```
@devops crea stack de Portainer para production con 3 replicas
```

```
@devops deploy versión v1.2.0 a staging primero, luego production
```

**Estructura que crea:**
```
portainer/
├── production/
│   ├── stack.yml
│   ├── .env
│   └── README.md
├── staging/
│   ├── stack.yml
│   └── .env
└── scripts/
    ├── deploy.sh
    ├── rollback.sh
    └── health-check.sh
```

**Workflows:**
- `.github/workflows/docker-build.yml` - Build & push images
- `.github/workflows/deploy-portainer.yml` - Deploy automation

---

## 🎯 Cuándo Usar Cada Agente

### Implementar Nueva Feature

**Escenario:** Agregar sistema de reseñas de productos

1. **@supabase** - Diseña schema, RLS policies, migraciones
2. **@security** - Revisa diseño, valida security (input sanitization, RLS)
3. **@developer** - Implementa UI, componentes, integración con tests
4. **@ux-validator** - Valida la interfaz de reseñas (usabilidad, accesibilidad)
5. **@security** - Audita implementación antes de merge
6. **@posthog** - Configura tracking de eventos de reseñas

### Optimizar Performance

**Escenario:** Dashboard de admin muy lento

1. **@security** - Analiza bundle size, identifica problemas
2. **@supabase** - Analiza queries, sugiere índices
3. **@developer** - Implementa optimizaciones (React.memo, lazy loading)
4. **@posthog** - Mide impacto con performance metrics
5. **@security** - Valida que optimizaciones no afecten security

### Analizar Conversión

**Escenario:** Muchos usuarios abandonan el checkout

1. **@posthog** - Identifica dónde abandonan, breakdowns
2. **@developer** - Implementa mejoras UX basadas en datos
3. **@supabase** - Optimiza queries si hay problemas de latencia

### Resolver Bug

**Escenario:** Los clientes no pueden confirmar órdenes

1. **@developer** - Analiza código, identifica el bug
2. **@supabase** - Verifica RLS policies, constraints DB
3. **@security** - Valida que el fix no introduce vulnerabilidades
4. **@posthog** - Mide tasa de error antes/después del fix

## 🔄 Workflow Multi-Agente

### Feature Completa: Programa de Fidelidad

```
Tú: Quiero implementar un programa de puntos de fidelidad

@supabase diseña el schema completo para un programa de puntos donde:
- Los clientes ganan 1 punto por cada $10
- Puntos por tienda (multi-tenant)
- Niveles: Bronce, Plata, Oro
- Dueños configuran recompensas

[Supabase crea schema, RLS, funciones PostgreSQL]

@developer implementa la UI para:
- Ver puntos acumulados
- Historial de puntos
- Canjear recompensas
- Admin: configurar programa

[Developer crea componentes mobile-first con tests]

@posthog configura tracking para:
- points_earned
- points_redeemed
- loyalty_level_achieved
- Funnel de canje de recompensas

[PostHog crea dashboard de engagement]
```

## 📋 Limitaciones y Reglas

### Todos los Agentes

✅ **PUEDEN:**
- Leer archivos del proyecto
- Ejecutar comandos de desarrollo
- Crear/modificar archivos
- Hacer commits (con aprobación)

❌ **NO PUEDEN:**
- Ejecutar cambios en producción directamente
- Acceder a datos sensibles de clientes
- Bypasear políticas de seguridad
- Push a main sin revisión (si está protegido)

### Específicas por Agente

**@developer:**
- ✅ Implementa solo lo que pide el issue
- ❌ No hace over-engineering
- ✅ Siempre mobile-first
- ❌ No omite tests

**@posthog:**
- ✅ Usa MCP para datos reales
- ❌ No inventa métricas
- ✅ Compara con benchmarks
- ❌ No sugiere tracking innecesario

**@supabase:**
- ✅ Prioriza seguridad multi-tenant
- ❌ No usa service role key en cliente
- ✅ Documenta migraciones
- ❌ No bypasea RLS

## 🎓 Ejemplos Avanzados

### 1. Migración Compleja

```
Tú: Necesito migrar los extras de JSONB a tabla separada

@supabase crea una migración segura que:
- Cree product_extras table
- Migre datos existentes de menu_items.extras (JSONB)
- Mantenga compatibilidad durante transición
- No cause downtime

[Supabase crea migration con rollback plan]

@developer actualiza el código para:
- Usar nueva tabla en lugar de JSONB
- Mantener backward compatibility
- Actualizar tests

[Developer refactoriza con tests]

@posthog verifica que no haya degradación:
- Compara product_added_to_cart antes/después
- Mide latencia de carga de productos
- Alerta si hay drop en conversión
```

### 2. Audit de Performance

```
Tú: El proyecto está lento, hagan un audit completo

@supabase analiza:
- Queries lentos (EXPLAIN ANALYZE)
- Índices faltantes
- RLS policies ineficientes
- Oportunidades de desnormalización

@developer analiza:
- Componentes sin React.memo
- Renders innecesarios
- Bundle size grande
- Images sin optimizar

@posthog mide:
- Page load time por ruta
- Time to interactive
- FCP, LCP, CLS (Core Web Vitals)
- Conversión vs performance
```

### 3. Nueva Feature End-to-End

```
Tú: Implementar cupones de descuento

@supabase:
- Table: coupons (code, discount, valid_from, valid_to, store_id)
- RLS: Solo store owners editan sus cupones
- Function: apply_coupon(order_id, coupon_code)
- Validation: Check expiry, usage limits

@developer:
- Componente: CouponInput (mobile-optimized)
- Admin: CouponManager (CRUD)
- Validación client-side
- Integrar en checkout (step 3)
- Tests completos

@posthog:
- Evento: coupon_applied
- Evento: coupon_failed
- Dashboard: Coupon performance
- Funnel: Checkout con/sin cupón
- Breakdown: Performance por código
```

## 🚀 Quick Start

### Invocar un Agente

Simplemente menciona `@agente` seguido de tu solicitud:

```
@developer implementa el issue #54 sobre extracción de business logic

@posthog analiza la conversión del último mes

@supabase optimiza el query de órdenes del dashboard
```

### Combinar Agentes

Puedes invocar múltiples agentes en secuencia:

```
@supabase diseña el schema para favoritos de productos
[espera respuesta]

@developer implementa la UI basada en el schema que dio supabase
[espera respuesta]

@posthog configura tracking para favoritos
```

## 📚 Documentación Adicional

- **Orchestrator Agent**: [.claude/prompts/orchestrator-agent.md](.claude/prompts/orchestrator-agent.md) ⭐
- **Developer Agent**: [.claude/prompts/developer-agent.md](.claude/prompts/developer-agent.md)
- **PostHog Agent**: [.claude/prompts/posthog-agent.md](.claude/prompts/posthog-agent.md)
- **Supabase Agent**: [.claude/supabase-agent.md](.claude/supabase-agent.md)
- **Security Agent**: [.claude/prompts/security-agent.md](.claude/prompts/security-agent.md)
- **DevOps Agent**: [.claude/prompts/devops-agent.md](.claude/prompts/devops-agent.md) ⭐
- **Proyecto**: [CLAUDE.md](../CLAUDE.md)
- **Docker**: [DOCKER.md](../DOCKER.md)
- **Portainer**: [PORTAINER-DEPLOY.md](../PORTAINER-DEPLOY.md)

---

**Última actualización:** 2025-12-02
**Versión:** 4.1.0
**Total agentes:** 7 (Orchestrator, UX Validator, Developer, PostHog, Supabase, Security, DevOps)
