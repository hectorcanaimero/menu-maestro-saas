# Guía de Usuario: Módulo de Suscripción

## 🎯 Acceso Rápido

Para acceder al módulo de suscripción:

1. Inicia sesión en tu panel de administración
2. En el menú lateral, busca el ítem **"Suscripción"** (icono de tarjeta 💳)
3. Haz clic para acceder a `/admin/subscription`

## 📊 Pestaña: Estado

### Vista General
- **Plan actual**: Muestra tu plan (Trial, Básico, Pro, Enterprise)
- **Precio mensual**: Costo de tu plan actual
- **Estado**: Badge de color indicando el estado (Trial, Activa, Pago Pendiente, etc.)
- **Período actual**: Fechas de inicio y fin de tu período de facturación

### Alertas Importantes

#### 🟠 Trial Terminando
```
"Tu período de prueba termina en X días"
[Botón: Actualizar ahora]
```
- Aparece 7 días antes de que termine tu trial
- Haz clic en "Actualizar ahora" para elegir un plan de pago

#### 🔵 Pago Pendiente
```
"Hemos recibido tu solicitud de pago.
Nuestro equipo la revisará en las próximas 24-48 horas."
```
- Aparece cuando has subido un comprobante de pago
- El equipo validará tu pago manualmente

#### 🔴 Suscripción Vencida
```
"Tu suscripción ha vencido.
Actualiza tu plan para continuar usando la plataforma."
[Botón: Renovar suscripción]
```
- Aparece cuando no has renovado a tiempo
- Haz clic para renovar inmediatamente

### Estadísticas Rápidas

Tres bloques que muestran:
- **Productos**: 45 / 200
- **Órdenes/mes**: 89 / 500
- **Créditos AI**: 3 disponibles

### Botones de Acción
- **Actualizar Plan / Cambiar Plan**: Abre modal para seleccionar nuevo plan
- **Subir Comprobante**: Abre modal para enviar comprobante de pago

---

## 📈 Pestaña: Uso

Muestra barras de progreso detalladas para cada límite de tu plan:

### 1. Productos
```
Productos
45 / 200 ██████████░░░░░░░░░░ 22.5%
```

### 2. Categorías
```
Categorías
12 / 50 ████░░░░░░░░░░░░░░░░ 24%
```

### 3. Órdenes este mes
```
Órdenes este mes
89 / 500 ███████░░░░░░░░░░░░░ 17.8%
```

### 4. Créditos AI
```
Créditos AI
2 usados / 3 disponibles ████████░░░░░░░░ 66.7%

Límite mensual: 5 créditos
[Comprar más créditos]
```

### ⚠️ Alertas de Límite
Cuando alcanzas el 90% de un límite:
```
⚠️ Límite casi alcanzado. Considera actualizar tu plan.
```

---

## 🔌 Pestaña: Módulos

Gestiona módulos adicionales para tu tienda.

### Durante Trial (30 días)

#### Módulo WhatsApp
```
✓ WhatsApp                    [Activo]
Recibe órdenes por WhatsApp y gestiona conversaciones

✓ Incluido en trial 30 días

$15/mes después del trial
```

#### Módulo Delivery
```
✓ Delivery                    [Activo]
Sistema completo de gestión de entregas

✓ Incluido en trial 30 días

$20/mes después del trial
```

### Después del Trial

Si no has activado un módulo:
```
WhatsApp                      [Inactivo]
Recibe órdenes por WhatsApp...

$15/mes
[Solicitar Activación]
```

### 💡 Información Important
```
Durante tu período de prueba de 30 días, tienes acceso
completo a los módulos de WhatsApp y Delivery sin cargo
adicional. Después del trial, estos módulos se cobrarán
mensualmente si deseas continuar usándolos.
```

---

## 💳 Pestaña: Facturación

### Información del Próximo Pago

```
Próximo Pago
├─ Monto del plan: $29/mes
├─ Fecha de renovación: 15 Ene 2026
└─ Total: $29
```

### Acciones Rápidas

Tres botones principales:

1. **📤 Subir Comprobante de Pago**
   - Envía tu comprobante de pago realizado
   - Validación manual en 24-48 horas

2. **✨ Comprar Créditos AI**
   - Compra paquetes de créditos adicionales
   - Los créditos no expiran

3. **📈 Cambiar de Plan**
   - Upgrade o downgrade de plan
   - Solicitud con comprobante de pago

### Métodos de Pago Aceptados
```
• Transferencia bancaria
• PayPal
• Depósito bancario
• Otros métodos (contacta a soporte)

Los comprobantes se validan manualmente en 24-48 horas
```

---

## 🔄 Flujos de Trabajo

### 1. Subir Comprobante de Pago

**Paso 1**: Haz clic en "Subir Comprobante"

**Paso 2**: Completa el formulario:
```
Monto Pagado (USD) *: [ 29.00 ]
Fecha de Pago *: [ 02/12/2025 ]
Método de Pago *: [ Transferencia Bancaria ▼ ]
Número de Referencia: [ TXN123456 ]
URL del Comprobante *: [ https://drive.google.com/... ]
Notas Adicionales: [ Texto opcional ]
```

**Paso 3**: Sube tu comprobante a Google Drive:
1. Sube tu imagen/PDF del comprobante
2. Configura para que "Cualquiera con el enlace" pueda ver
3. Copia el enlace compartido
4. Pégalo en el campo "URL del Comprobante"

**Paso 4**: Haz clic en "Enviar Comprobante"

**Resultado**:
```
✓ Comprobante enviado
Tu comprobante de pago ha sido enviado para validación.
Te notificaremos cuando sea aprobado.
```

---

### 2. Comprar Créditos AI

**Paso 1**: Haz clic en "Comprar Créditos AI"

**Paso 2**: Selecciona un paquete predefinido:

```
┌─────────────┬─────────────┬─────────────┐
│   10 ✨     │   25 ✨     │   50 ✨     │ ← Más Popular
│   $5        │   $10       │   $18       │
│             │ + 5 bonus   │ + 10 bonus  │
└─────────────┴─────────────┴─────────────┘

┌─────────────┬─────────────┐
│   100 ✨    │   250 ✨    │
│   $30       │   $65       │
│ + 25 bonus  │ + 75 bonus  │
└─────────────┴─────────────┘
```

**O** ingresa cantidad personalizada:
```
Cantidad Personalizada: [ 75 ]
Precio: $30.00 USD ($0.4/crédito)
```

**Paso 3**: (Opcional) Sube comprobante de pago

**Paso 4**: Haz clic en "Solicitar Créditos"

**Resultado**:
```
✓ Solicitud enviada
Tu solicitud de compra de 50 créditos AI está siendo
procesada. Te notificaremos cuando sea aprobada.
```

---

### 3. Solicitar Upgrade de Plan

**Paso 1**: Haz clic en "Actualizar Plan" o "Cambiar Plan"

**Paso 2**: Selecciona un plan disponible:

```
┌──────────────────────────────────────┐
│ Plan Básico                    $29   │
│ Perfecto para comenzar          /mes │
│                                      │
│ Productos: 200                       │
│ Categorías: 50                       │
│ Órdenes/mes: 500                     │
│ Créditos AI/mes: 40                  │
│                                      │
│ ✓ Cocina  ✓ Analytics  +2 más       │
└──────────────────────────────────────┘
```

**Paso 3**: Confirma monto y agrega información:
```
Monto pagado (USD) *: [ 29.00 ]
URL del comprobante: [ https://... ]
Notas adicionales: [ Texto opcional ]
```

**Paso 4**: Lee las instrucciones de pago:
```
1. Realiza el pago del monto correspondiente
2. Guarda el comprobante de pago
3. Sube el comprobante a un servicio en la nube
4. Envía la solicitud y espera aprobación (24-48 horas)
```

**Paso 5**: Haz clic en "Enviar Solicitud"

---

## ❓ Preguntas Frecuentes

### ¿Qué pasa cuando termina mi trial?
Después de 30 días, debes seleccionar un plan de pago para continuar usando la plataforma.

### ¿Los módulos WhatsApp y Delivery son gratis?
Sí, durante el trial de 30 días. Después, se cobran $15/mes (WhatsApp) y $20/mes (Delivery).

### ¿Cuánto tarda la validación de un pago?
Entre 24 y 48 horas hábiles. Recibirás un email cuando sea aprobado.

### ¿Los créditos AI expiran?
Los créditos mensuales se resetean cada mes. Los créditos extra comprados NO expiran.

### ¿Puedo cambiar de plan en cualquier momento?
Sí, puedes solicitar un upgrade o downgrade cuando quieras.

### ¿Qué pasa si no pago a tiempo?
Tu suscripción pasa a estado "Vencida" y no podrás usar la plataforma hasta renovar.

---

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa esta guía primero
2. Contacta a soporte: [soporte@pideai.com](mailto:soporte@pideai.com)
3. Incluye tu ID de tienda y detalles del problema

---

**Última actualización**: 2 de Diciembre, 2025
