# Migración del Estudio Fotográfico: Lovable AI Gateway → Gemini API Directa

**Fecha:** 2025-12-06
**Estado:** Plan de Migración
**Autor:** Claude Code

---

## 📋 Resumen Ejecutivo

Actualmente, la edge function `enhance-product-image` usa **Lovable AI Gateway** como intermediario para acceder a **Gemini 2.5 Flash Image**. Esta migración propone conectar directamente a la **API oficial de Google Gemini** para:

1. ✅ **Reducir costos** - Eliminar capa intermedia
2. ✅ **Mejor control** - Acceso directo a todas las funcionalidades
3. ✅ **Actualización a modelos nuevos** - Soporte para Gemini 3 Pro Image (Nano Banana Pro)
4. ✅ **Mayor flexibilidad** - Control total sobre parámetros

---

## 🔍 Comparativa de Soluciones

### Actual: Lovable AI Gateway

**Endpoint:** `https://ai.gateway.lovable.dev/v1/chat/completions`

**Pros:**
- ✅ Abstracción sencilla (formato OpenAI-like)
- ✅ Ya configurado y funcionando

**Contras:**
- ❌ Costo adicional por capa intermedia
- ❌ Dependencia de terceros (Lovable)
- ❌ Formato no estándar de respuesta
- ❌ Limitación a modelos que Lovable soporte

**Código actual:**
```typescript
const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash-image-preview',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: fullPrompt },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    }],
    modalities: ['image', 'text'],
  }),
});

// Extraer imagen
const generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
```

---

### Propuesta: Google Gemini API (Directa)

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`

**Pros:**
- ✅ Conexión directa con Google (sin intermediarios)
- ✅ Costo optimizado ($0.039 por imagen)
- ✅ Acceso a modelos más avanzados (Gemini 3 Pro Image)
- ✅ Soporte oficial de Google
- ✅ Documentación completa
- ✅ Control granular de parámetros (aspect ratio, resolución)

**Contras:**
- ⚠️ Requiere API Key de Google Cloud
- ⚠️ Formato de respuesta diferente (base64 inline)
- ⚠️ Cambios en la edge function

**Código propuesto:**
```typescript
const apiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  {
    method: 'POST',
    headers: {
      'x-goog-api-key': GEMINI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: fullPrompt },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64ImageData  // Imagen original en base64
            }
          }
        ]
      }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio || '1:1',
          imageSize: '2K'  // 1K, 2K, 4K disponibles
        }
      }
    }),
  }
);

// Extraer imagen generada
const generatedImageData = apiResponse.candidates[0].content.parts.find(
  part => part.inlineData
)?.inlineData.data;
```

---

## 🔄 Modelos Disponibles

### Gemini 2.5 Flash Image ("Nano Banana")
- **Modelo ID:** `gemini-2.5-flash-image`
- **Velocidad:** Rápido (⚡ Flash)
- **Resolución:** Hasta 1K (1024px)
- **Costo:** $0.039 por imagen
- **Uso recomendado:** Generación rápida, volumen alto, presupuesto limitado

### Gemini 3 Pro Image ("Nano Banana Pro") 🆕
- **Modelo ID:** `gemini-3-pro-image-preview`
- **Velocidad:** Más lento
- **Resolución:** Hasta 4K (4096px)
- **Costo:** $0.134-$0.24 por imagen (según resolución)
- **Uso recomendado:** Máxima calidad, imágenes de producto premium
- **Características avanzadas:**
  - 94% precisión en renderizado de texto
  - Grounding con Google Search
  - Control avanzado de iluminación y composición

---

## 🏗️ Plan de Implementación

### Fase 1: Preparación (15 min)

**1.1 Obtener API Key de Google AI Studio**
1. Ir a [Google AI Studio](https://aistudio.google.com/)
2. Crear nuevo proyecto o usar existente
3. Generar API Key
4. Configurar límites de uso y facturación

**1.2 Configurar Secret en Supabase**
```bash
# Establecer variable de entorno en Supabase
supabase secrets set GEMINI_API_KEY=<tu_api_key>

# Remover LOVABLE_API_KEY (opcional, después de migrar)
# supabase secrets unset LOVABLE_API_KEY
```

---

### Fase 2: Migración de Edge Function (30 min)

**2.1 Crear nueva versión de la función**

Archivo: `supabase/functions/enhance-product-image/index.ts`

Cambios principales:
1. Cambiar endpoint de Lovable a Gemini
2. Adaptar formato de request
3. Adaptar formato de response (base64 inline → URL de storage)
4. Agregar soporte para selección de modelo (Flash vs Pro)
5. Agregar configuración de resolución

**2.2 Manejo de imágenes**

Diferencia clave:
- **Lovable:** Acepta URL de imagen directamente
- **Gemini:** Requiere imagen en base64

Necesitamos:
```typescript
// Descargar imagen original y convertir a base64
const imageResponse = await fetch(imageUrl);
const imageBuffer = await imageResponse.arrayBuffer();
const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
```

---

### Fase 3: Testing (20 min)

**3.1 Pruebas locales**
```bash
# Ejecutar función localmente
supabase functions serve enhance-product-image

# Probar con curl
curl -X POST http://localhost:54321/functions/v1/enhance-product-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://...",
    "style": "realistic",
    "menuItemId": "test",
    "menuItemName": "Pizza",
    "storeId": "test-store",
    "aspectRatio": "1:1"
  }'
```

**3.2 Pruebas de modelos**
- ✅ Gemini 2.5 Flash (rápido, económico)
- ✅ Gemini 3 Pro (alta calidad)
- ✅ Diferentes aspect ratios (1:1, 4:5, 9:16)
- ✅ Diferentes estilos (realistic, premium, etc.)

**3.3 Validar costos**
- Monitorear uso de tokens
- Comparar costos con Lovable

---

### Fase 4: Deploy (10 min)

```bash
# Deploy de la función actualizada
supabase functions deploy enhance-product-image
```

---

### Fase 5: Actualizar Frontend (Opcional)

Si queremos dar opción al usuario de elegir el modelo:

```typescript
// En PhotoStudioDialog.tsx
const [modelQuality, setModelQuality] = useState<'fast' | 'pro'>('fast');

// Al llamar la edge function
const response = await supabase.functions.invoke('enhance-product-image', {
  body: {
    imageUrl,
    style,
    menuItemId,
    menuItemName,
    storeId,
    aspectRatio,
    model: modelQuality === 'pro' ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
  }
});
```

---

## 💰 Análisis de Costos

### Lovable AI Gateway (Actual)
- **Modelo:** Gemini 2.5 Flash Image
- **Costo estimado:** $0.05-$0.10 por imagen (incluye markup)
- **Facturación:** A través de Lovable

### Google Gemini API (Propuesta)

**Gemini 2.5 Flash Image:**
- $30 por 1M output tokens
- 1 imagen = 1290 tokens
- **Costo: $0.039 por imagen** ✅ ~50% más barato

**Gemini 3 Pro Image (4K):**
- Aproximadamente $0.24 por imagen
- **Uso:** Solo para imágenes premium que requieran máxima calidad

**Ahorro estimado:**
- 100 imágenes/mes: $1-$6/mes
- 1000 imágenes/mes: $10-$60/mes
- 10000 imágenes/mes: $100-$600/mes

---

## 🚧 Consideraciones y Riesgos

### Limitaciones de Quota
- **Default quota:** 15 requests per minute (RPM)
- **Solución:** Configurar queue o rate limiting en edge function
- **Escalamiento:** Solicitar aumento de quota a Google

### Manejo de Errores
```typescript
// Errores comunes
- 400: Prompt inválido o imagen corrupta
- 429: Rate limit exceeded
- 500: Error interno de Google
```

### Fallback Strategy
Mantener código de Lovable comentado por 1-2 semanas por si necesitamos rollback.

---

## 📊 Métricas de Éxito

Post-migración, monitorear:
- ✅ Tasa de éxito de generación (>95%)
- ✅ Tiempo de respuesta (<10s promedio)
- ✅ Costos reales vs estimados
- ✅ Calidad percibida de imágenes
- ✅ Errores y rate limits

---

## 🔗 Recursos y Referencias

**Documentación oficial:**
- [Gemini Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Gemini Models Overview](https://ai.google.dev/gemini-api/docs/models)
- [Vertex AI Gemini 3 Pro Image](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/3-pro-image)

**Artículos y guías:**
- [Introducing Gemini 2.5 Flash Image](https://developers.googleblog.com/en/introducing-gemini-2-5-flash-image/)
- [Developers can build with Nano Banana Pro](https://blog.google/technology/developers/gemini-3-pro-image-developers/)
- [Nano Banana Pro Tutorial](https://www.datacamp.com/tutorial/nano-banana-pro)

**Comparativas:**
- [Nano Banana Pro Review by Simon Willison](https://simonwillison.net/2025/Nov/20/nano-banana-pro/)
- [Complete Developer Guide 2025](https://www.cursor-ide.com/blog/gemini-3-pro-image-api)

---

## ✅ Checklist de Migración

- [ ] Obtener API Key de Google AI Studio
- [ ] Configurar secret `GEMINI_API_KEY` en Supabase
- [ ] Crear nueva versión de edge function
- [ ] Implementar conversión de imagen a base64
- [ ] Adaptar formato de request/response
- [ ] Agregar selección de modelo (Flash vs Pro)
- [ ] Testing local
- [ ] Testing en staging
- [ ] Deploy a producción
- [ ] Monitorear métricas durante 1 semana
- [ ] Remover código de Lovable si todo funciona
- [ ] Documentar cambios en changelog

---

## 🎯 Decisión Recomendada

**✅ RECOMIENDO LA MIGRACIÓN** por las siguientes razones:

1. **Ahorro de costos** (30-50%)
2. **Mayor control** sobre la generación
3. **Acceso a modelos más avanzados** (Gemini 3 Pro)
4. **Mejor soporte** (documentación oficial de Google)
5. **Independencia** (sin dependencia de Lovable)

**Riesgo:** Bajo (función bien documentada, fácil rollback)
**Esfuerzo:** Medio (1-2 horas de trabajo)
**Beneficio:** Alto (costos + features + control)

---

## 📞 Próximos Pasos

1. **Aprobar plan de migración**
2. **Crear branch:** `feature/migrate-to-gemini-api`
3. **Implementar cambios**
4. **Testing exhaustivo**
5. **Deploy gradual** (primero en dev/staging)
6. **Monitoreo post-deploy**
