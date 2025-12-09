# 🎨 TAREA UX: Correcciones Landing Page - PideAI

**Asignado a:** @ux-validator
**Prioridad:** Alta
**Fecha:** 2025-12-09
**Creado por:** @orquestrator

---

## 📋 Resumen Ejecutivo

La landing page actual presenta **información incorrecta y duplicada** que debe corregirse urgentemente. Los planes se están mostrando con datos hardcodeados que se solapan con los datos de la base de datos, y se menciona un trial de "30 días gratis" cuando en realidad ofrecemos un **servicio gratuito permanente**.

---

## ❌ Problemas Identificados

### 1. **"30 días gratis" - INCORRECTO**
**Ubicación:** [LandingHero.tsx:38-43](src/components/landing/LandingHero.tsx#L38-L43)

```tsx
// ❌ INCORRECTO - Línea 38-43
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
  <span className="text-sm font-semibold text-primary">
    <span role="img" aria-label="Celebración">🎉</span> 30 días GRATIS
  </span>
  <span className="text-sm text-muted-foreground">• Sin tarjeta de crédito</span>
</div>
```

**También en línea 80:**
```tsx
// ❌ INCORRECTO - Línea 80
<span className="font-medium">30 días gratis • Cancela cuando quieras</span>
```

**Problema:**
- NO ofrecemos "30 días gratis de prueba"
- Ofrecemos un **plan gratuito permanente** (Plan Free)
- Los planes pagos pueden tener un trial configurado desde la base de datos, pero NO es universal

**Acción Requerida:**
- ✅ **CAMBIAR** el badge a: "🎉 Plan Gratuito Disponible • Sin tarjeta de crédito"
- ✅ **CAMBIAR** línea 80 a: "Plan gratuito disponible • Planes de pago desde $1 al día"

---

### 2. **Planes Hardcodeados vs Base de Datos**
**Ubicación:** [PricingSection.tsx:120-127](src/components/landing/PricingSection.tsx#L120-L127)

**Problema:**
Existe código que mezcla datos hardcodeados con datos de la base de datos:

```tsx
// ⚠️ PROBLEMA - Línea 120-127
<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
  {plans[0]?.trialDays && (
    <>
      Todos los planes incluyen{' '}
      <span className="font-bold text-primary">{plans[0].trialDays} días de prueba gratis</span>.{' '}
    </>
  )}
  Sin tarjeta de crédito requerida. Cancela cuando quieras.
</p>
```

**Acción Requerida:**
- ✅ **SOLO** usar datos de la base de datos (tabla `plans`)
- ✅ Si un plan tiene `trial_duration_days > 0`, mostrar ese valor específicamente en ESE plan
- ✅ NO generalizar "todos los planes incluyen X días"
- ✅ El plan Free NO debe mostrar "prueba gratis", debe decir "Plan Gratuito"

**Ejemplo correcto:**
```tsx
<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
  Plan gratuito disponible para siempre. Planes de pago con opciones flexibles. Sin tarjeta de crédito requerida.
</p>
```

---

### 3. **Integración con Bancos - NO EXISTE**
**Ubicación:** [Features.tsx](src/components/Features.tsx) - Revisar features hardcodeadas

**Problema:**
Si hay alguna mención a "integración bancaria", "pagos con tarjeta integrados" o "procesamiento de pagos", **ES FALSO**.

**Realidad:**
- ✅ **SÍ ofrecemos:** Gestión de delivery
- ✅ **SÍ ofrecemos:** Integración WhatsApp
- ✅ **SÍ ofrecemos:** Códigos QR
- ✅ **SÍ ofrecemos:** Cupones y promociones
- ✅ **SÍ ofrecemos:** Analytics avanzados
- ❌ **NO ofrecemos:** Integración directa con bancos
- ❌ **NO ofrecemos:** Procesamiento de pagos en línea (Stripe, PayPal, etc.)

**Nota:** Los clientes pueden configurar métodos de pago (efectivo, transferencia, Pago Móvil, etc.), pero nosotros **NO procesamos** los pagos.

---

### 4. **Conversión de Monedas - NUEVA FUNCIONALIDAD**

**✅ NUEVA FEATURE DISPONIBLE:**
Desde hoy (2025-12-09) tenemos conversión automática de monedas EUR/USD → VES con tasas del BCV.

**Debe agregarse a Features:**
```tsx
{
  icon: DollarSign, // o Globe
  title: 'Conversión de Monedas',
  description: 'Conversión automática EUR/USD a bolívares venezolanos (VES) con tasas del BCV actualizadas cada hora. Configura tasas manuales si lo prefieres.',
}
```

---

## ✅ Checklist de Correcciones

### Hero Section (`LandingHero.tsx`)
- [ ] Remover badge "30 días GRATIS"
- [ ] Agregar badge "Plan Gratuito Disponible"
- [ ] Cambiar "30 días gratis • Cancela cuando quieras" → "Plan gratuito disponible • Planes de pago desde $1 al día"
- [ ] Verificar que NO mencione "prueba gratis" en ningún lugar

### Pricing Section (`PricingSection.tsx`)
- [ ] Remover texto hardcodeado sobre "X días de prueba gratis"
- [ ] Solo usar datos de la base de datos (`plans` table)
- [ ] Si `trial_duration_days > 0` en un plan específico, mostrarlo SOLO en ese plan
- [ ] Plan Free debe decir "Gratis para Siempre" en lugar de "Prueba Gratis"
- [ ] Verificar que el CTA del plan Free sea "Comenzar Gratis" y NO "Probar X Días Gratis"

### Features Section (`Features.tsx`)
- [ ] Agregar feature "Conversión de Monedas" con descripción correcta
- [ ] Verificar que NO mencione "integración bancaria" o "procesamiento de pagos"
- [ ] Confirmar que todas las features listadas realmente existen

### Validación Final
- [ ] Revisar TODA la landing page en busca de menciones a "30 días", "trial", "prueba"
- [ ] Confirmar que todos los features listados están implementados
- [ ] Verificar que los datos de planes vengan SOLO de la base de datos

---

## 📊 Planes Actuales en Base de Datos

**Referencia:** Tabla `plans` en Supabase

Los planes deben mostrarse EXACTAMENTE como están configurados en la base de datos:

1. **Plan Free** (Gratis para siempre)
   - $0/mes
   - Sin trial (porque ya es gratis)
   - CTA: "Comenzar Gratis"

2. **Plan Business** (u otro nombre según DB)
   - $XX/mes
   - Trial: X días (si `trial_duration_days > 0`)
   - CTA: "Probar X Días Gratis" O "Comenzar Ahora" (según DB)

3. **Plan Enterprise** (u otro nombre según DB)
   - $XX/mes
   - Trial: X días (si `trial_duration_days > 0`)
   - CTA: según configuración en DB

---

## 🎯 Nuevas Features a Destacar

### 1. Conversión de Monedas EUR/USD → VES
- **Estado:** ✅ Implementada (2025-12-09)
- **Ubicación:** Settings → Conversión
- **Features:**
  - Tasas del BCV actualizadas automáticamente cada hora
  - Dual display: precio original arriba, VES abajo
  - Configuración de tasas manuales
  - Selección de moneda activa para checkout
- **Componentes actualizados:** ProductCard, ProductDetail, Checkout, CartSheet, ConfirmOrder

### 2. Funcionalidades Existentes Confirmadas
- ✅ Códigos QR personalizados
- ✅ Integración WhatsApp
- ✅ Cupones de descuento
- ✅ Promociones (2x1, % off, etc.)
- ✅ Gestión de delivery con GPS
- ✅ Analytics avanzados

---

## 📁 Archivos a Modificar

1. **`src/components/landing/LandingHero.tsx`**
   - Líneas 38-43: Badge principal
   - Línea 80: Texto de beneficios

2. **`src/components/landing/PricingSection.tsx`**
   - Líneas 120-127: Descripción de planes
   - Revisar lógica de trials (líneas 66-72)

3. **`src/components/Features.tsx`**
   - Agregar feature "Conversión de Monedas"
   - Validar que todas las features existan

---

## 🚀 Próximos Pasos

1. **@ux-validator** revisa este documento
2. Implementa las correcciones en los archivos especificados
3. Valida cambios en ambiente de desarrollo
4. Crea PR con los cambios
5. **@orquestrator** revisa y aprueba
6. Deploy a producción

---

## 📞 Contacto

Para dudas o clarificaciones:
- **Slack:** @orquestrator
- **Email:** [tu-email]

---

**Última actualización:** 2025-12-09 15:30
**Revisado por:** @orquestrator
**Próxima revisión:** Después de implementación
