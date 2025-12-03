# Feature: Sistema de Suscripción y Facturación en Dashboard Admin

## 📋 Resumen

Se ha implementado un módulo completo de gestión de suscripciones en el panel de administración (`/admin/subscription`) que permite a las tiendas:

1. ✅ Ver el estado de su suscripción actual
2. ✅ Subir comprobantes de pago
3. ✅ Solicitar upgrade de planes
4. ✅ Comprar créditos AI adicionales
5. ✅ Gestionar módulos adicionales (WhatsApp y Delivery)
6. ✅ Módulos WhatsApp y Delivery incluidos durante trial de 30 días

## 🎯 Archivos Creados

### Componentes React

1. **`src/components/admin/SubscriptionManager.tsx`**
   - Componente principal con tabs para: Estado, Uso, Módulos y Facturación
   - Muestra alertas de trial, pagos pendientes y suscripciones vencidas
   - Estadísticas de uso con barras de progreso
   - Integración completa con el sistema de suscripciones

2. **`src/components/admin/PaymentProofUpload.tsx`**
   - Modal para subir comprobantes de pago
   - Soporte para múltiples métodos de pago
   - Validación de campos requeridos
   - Instrucciones claras para el usuario

3. **`src/components/admin/CreditsManager.tsx`**
   - Interfaz para comprar créditos AI adicionales
   - Paquetes predefinidos con bonos
   - Opción de cantidad personalizada
   - Resumen de compra con detalles

### Páginas

4. **`src/pages/admin/AdminSubscription.tsx`**
   - Página principal del módulo de suscripción
   - Layout admin con navegación integrada

### Migraciones SQL

5. **`supabase/migrations/20251202150000_enable_modules_during_trial.sql`**
   - Habilita automáticamente módulos WhatsApp y Delivery durante trial
   - Trigger para nuevas suscripciones
   - Función actualizada de creación de suscripciones

6. **`APPLY_TRIAL_MODULES_MANUALLY.sql`**
   - Script SQL manual para aplicar en Supabase SQL Editor
   - Necesario si las migraciones automáticas fallan

## 🚀 Cómo Usar

### Para Desarrolladores

1. **Acceder al módulo:**
   ```
   Navegar a: /admin/subscription
   ```

2. **Menú lateral:**
   - Se agregó el ítem "Suscripción" con icono de tarjeta de crédito
   - Ubicado antes de "Configuración"

### Para Usuarios de Tienda

#### Tab "Estado"
- Ver plan actual y fecha de vencimiento
- Ver días restantes de trial
- Botones para actualizar plan y subir comprobante
- Estadísticas rápidas de productos, órdenes y créditos AI

#### Tab "Uso"
- Barras de progreso detalladas de uso
- Productos, categorías, órdenes y créditos AI
- Alertas cuando se acerca al límite (>80%)
- Botón para comprar más créditos

#### Tab "Módulos"
- Estado de módulos WhatsApp y Delivery
- Durante trial: Módulos activados gratis
- Después del trial: Opción para solicitar activación
- Precios mensuales claramente indicados

#### Tab "Facturación"
- Información del próximo pago
- Botones de acciones rápidas:
  - Subir comprobante de pago
  - Comprar créditos AI
  - Cambiar de plan
- Métodos de pago aceptados

## 🔧 Configuración Técnica

### Base de Datos

El sistema utiliza las siguientes tablas:

- **`subscriptions`**: Suscripciones de tiendas
  - Campo `enabled_modules` con WhatsApp y Delivery habilitados durante trial

- **`payment_validations`**: Comprobantes de pago
  - Estados: pending, approved, rejected
  - Campo `proof_image_url` para URLs de comprobantes

- **`store_ai_credits`**: Créditos AI
  - `monthly_credits`: Límite mensual del plan
  - `extra_credits`: Créditos comprados adicionalmente

### Funciones y Triggers

1. **`enable_trial_modules()`**: Trigger que habilita módulos automáticamente
2. **`create_store_subscription()`**: Función para crear suscripciones con módulos habilitados

## 📝 Instrucciones de Aplicación Manual

Si las migraciones automáticas fallan, ejecuta manualmente:

1. Abre Supabase Dashboard → SQL Editor
2. Copia el contenido de `APPLY_TRIAL_MODULES_MANUALLY.sql`
3. Ejecuta el script completo
4. Verifica los resultados con la query de verificación incluida

## 🎨 Características Destacadas

### 1. Módulos Incluidos en Trial
- **WhatsApp**: Gratis durante 30 días, luego $15/mes
- **Delivery**: Gratis durante 30 días, luego $20/mes
- Badge verde indicando "Incluido en trial 30 días"
- Alerta informativa explicando el beneficio

### 2. Sistema de Alertas Inteligente
- **Trial terminando**: Aviso 7 días antes con botón de upgrade
- **Pago pendiente**: Info sobre validación en proceso
- **Suscripción vencida**: Alerta roja con botón de renovación

### 3. Gestión de Créditos AI
- Paquetes predefinidos con descuentos (bonos)
- Paquete más popular destacado
- Precio por crédito calculado automáticamente
- Los créditos extra no expiran

### 4. Comprobantes de Pago
- Múltiples métodos: transferencia, PayPal, efectivo, cheque, crypto
- Campo de referencia/transacción
- Instrucciones claras con enlace a Google Drive
- Proceso de validación en 24-48 horas

## 🔒 Seguridad

- ✅ Rutas protegidas con `ProtectedRoute`
- ✅ Validación de store ownership
- ✅ RLS policies en Supabase
- ✅ Funciones SECURITY DEFINER cuando es necesario

## 📱 Responsive Design

- ✅ Diseño mobile-first
- ✅ Grid adaptativo para diferentes pantallas
- ✅ Tabs funcionales en móviles
- ✅ Modales con scroll para contenido largo

## 🎯 Testing

Para probar la feature:

1. **Crear nueva tienda**: Verifica que obtiene trial con módulos habilitados
2. **Ver /admin/subscription**: Verifica que se muestre correctamente
3. **Subir comprobante**: Prueba el flujo de upload
4. **Comprar créditos**: Prueba la solicitud de créditos
5. **Solicitar upgrade**: Prueba cambio de plan

## 📊 Métricas Disponibles

El sistema rastrea:
- Productos actuales vs límite del plan
- Categorías actuales vs límite del plan
- Órdenes del mes vs límite del plan
- Créditos AI usados vs disponibles

## 🚨 Notas Importantes

1. **Validación Manual**: Los comprobantes de pago se validan manualmente por el equipo de plataforma
2. **Trial 30 Días**: Todos los planes nuevos comienzan con 30 días de trial
3. **Módulos Trial**: WhatsApp y Delivery están habilitados gratis durante el trial
4. **Créditos No Expiran**: Los créditos extra comprados no tienen fecha de expiración

## 🔄 Próximos Pasos

Para completar el sistema:

1. ✅ Implementar panel de Platform Admin para validar pagos
2. ✅ Configurar notificaciones por email
3. ✅ Agregar historial de pagos
4. ✅ Implementar renovación automática
5. ✅ Dashboard de métricas de uso

---

**Desarrollado para**: PideAI Platform
**Fecha**: 2 de Diciembre, 2025
**Versión**: 1.0.0
