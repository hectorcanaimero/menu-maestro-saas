# Migración Simplificada: Lovable → Gemini 2.5 Flash

**Modelo único:** Gemini 2.5 Flash Image (Nano Banana)
**Costo:** $0.039 por imagen (50% más barato que Lovable)
**Tiempo:** 15 minutos

---

## 🎯 Por qué Migrar

| Antes (Lovable) | Ahora (Gemini) |
|----------------|----------------|
| $0.05-0.10/imagen | **$0.039/imagen** ✅ |
| Intermediario third-party | **Directo con Google** ✅ |
| Dependencia externa | **Control total** ✅ |
| Formato propietario | **API estándar** ✅ |

**Ahorro mensual:**
- 100 imágenes: $1-6
- 1000 imágenes: $10-60
- 10000 imágenes: $100-600

---

## 🚀 Pasos de Migración

### 1️⃣ Obtener API Key (3 min)

1. Ir a [Google AI Studio](https://aistudio.google.com/)
2. Click **"Get API key"**
3. Seleccionar proyecto o crear uno nuevo
4. Copiar la API key

### 2️⃣ Configurar en Supabase (2 min)

**Opción A - Usando CLI:**
```bash
npx supabase secrets set GEMINI_API_KEY=tu_api_key_aqui
```

**Opción B - Usando Dashboard:**
1. Ir a: `https://supabase.com/dashboard/project/wdpexjymbiyjqwdttqhz/settings/vault`
2. Click "New secret"
3. Name: `GEMINI_API_KEY`
4. Value: `[tu API key]`
5. Save

### 3️⃣ Actualizar Base de Datos (1 min)

Aplicar migración para agregar campos nuevos:

```bash
npx supabase db push
```

Esto aplicará la migración `20251206_add_gemini_fields_to_ai_history.sql`

### 4️⃣ Actualizar Edge Function (5 min)

**Respaldar versión actual:**
```bash
cd supabase/functions/enhance-product-image
cp index.ts index-lovable-backup.ts
```

**Instalar nueva versión:**
```bash
cp index-gemini.ts index.ts
```

### 5️⃣ Deploy (2 min)

```bash
npx supabase functions deploy enhance-product-image
```

**Verificar:**
```bash
npx supabase functions list
# Debe mostrar: enhance-product-image | Updated
```

### 6️⃣ Probar (2 min)

**Desde la app:**
1. Ir a Admin → Productos
2. Seleccionar un producto con imagen
3. Click "Estudio Fotográfico"
4. Seleccionar cualquier estilo
5. Click "Generar"
6. ✅ La imagen debe generarse correctamente

**Ver logs:**
```bash
npx supabase functions logs enhance-product-image --follow
```

Deberías ver:
```
[Gemini 2.5 Flash] Processing: Pizza Margherita, style: realistic, ratio: 1:1
Converting image to base64...
Calling Gemini API: gemini-2.5-flash-image
Gemini API response received
Enhanced image uploaded: https://...
```

---

## 🔄 Rollback (Si algo falla)

```bash
# 1. Restaurar función anterior
cd supabase/functions/enhance-product-image
cp index-lovable-backup.ts index.ts

# 2. Re-deploy
npx supabase functions deploy enhance-product-image

# 3. Restaurar secret (si es necesario)
npx supabase secrets set LOVABLE_API_KEY=tu_lovable_key
```

---

## 📊 Diferencias Técnicas

### Request Format

**Antes (Lovable):**
```json
{
  "model": "google/gemini-2.5-flash-image-preview",
  "messages": [{
    "role": "user",
    "content": [
      {"type": "text", "text": "..."},
      {"type": "image_url", "image_url": {"url": "https://..."}}
    ]
  }]
}
```

**Ahora (Gemini):**
```json
{
  "contents": [{
    "parts": [
      {"text": "..."},
      {"inline_data": {"mime_type": "image/jpeg", "data": "base64..."}}
    ]
  }],
  "generationConfig": {
    "responseModalities": ["IMAGE"],
    "imageConfig": {"aspectRatio": "1:1"}
  }
}
```

### Response Format

**Antes (Lovable):**
```json
{
  "choices": [{
    "message": {
      "images": [{
        "image_url": {"url": "data:image/png;base64,..."}
      }]
    }
  }]
}
```

**Ahora (Gemini):**
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "inlineData": {
          "mimeType": "image/png",
          "data": "base64..."
        }
      }]
    }
  }]
}
```

---

## ⚙️ Configuración

### Variables de Entorno

```bash
# Nueva (requerida)
GEMINI_API_KEY=AIzaSy...

# Antigua (ya no se usa después de migrar)
# LOVABLE_API_KEY=sk-...
```

### Límites y Cuotas

**Google AI Studio (Free Tier):**
- 15 RPM (requests per minute)
- 1500 RPD (requests per day)
- 1M RPM (requests per month)

**Si necesitas más:**
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Activar facturación
3. Solicitar aumento de quota

---

## 💡 Características

### Aspect Ratios Soportados

- `1:1` - Cuadrado (Instagram feed)
- `4:5` - Vertical (Instagram feed optimizado)
- `9:16` - Vertical (Instagram Stories/Reels)
- `16:9` - Horizontal (Pantallas anchas)

### Estilos Disponibles

- `realistic` - Fotografía profesional de estudio
- `premium` - Lujo con iluminación dorada
- `animated` - Estilo cartoon ilustrado
- `minimalist` - Minimalista escandinavo
- `white_bg` - Fondo blanco e-commerce
- `dark_mode` - Oscuro dramático

### Límites Técnicos

- **Resolución:** Hasta 1K (1024px)
- **Formatos entrada:** JPEG, PNG, WebP, GIF
- **Formato salida:** PNG
- **Tamaño máximo:** ~5MB por imagen

---

## 🐛 Troubleshooting

### Error: "AI service not configured"
**Causa:** Variable `GEMINI_API_KEY` no configurada

**Solución:**
```bash
npx supabase secrets set GEMINI_API_KEY=tu_api_key
```

### Error: "Rate limit exceeded"
**Causa:** Superaste los 15 requests/minuto

**Solución:**
- Esperar 1 minuto
- O solicitar aumento de quota en Google Cloud

### Error: "API key invalid"
**Causa:** API key incorrecta o expirada

**Solución:**
1. Verificar key en [Google AI Studio](https://aistudio.google.com/)
2. Regenerar si es necesario
3. Actualizar en Supabase

### Error: "Failed to fetch image"
**Causa:** URL de imagen original inválida o inaccesible

**Solución:**
- Verificar que la URL sea pública
- Verificar que la imagen exista
- Revisar formato de imagen (debe ser JPEG, PNG, WebP o GIF)

---

## 📈 Monitoreo

### Ver logs en tiempo real
```bash
npx supabase functions logs enhance-product-image --follow
```

### Ver historial de generaciones
```sql
SELECT
  created_at,
  style,
  model_used,
  aspect_ratio,
  resolution
FROM ai_enhancement_history
WHERE store_id = 'tu-store-id'
ORDER BY created_at DESC
LIMIT 10;
```

### Calcular costos
```sql
SELECT
  COUNT(*) as total_images,
  COUNT(*) * 0.039 as estimated_cost_usd
FROM ai_enhancement_history
WHERE
  store_id = 'tu-store-id'
  AND created_at >= NOW() - INTERVAL '30 days';
```

---

## ✅ Checklist de Migración

- [ ] Obtener API Key de Google AI Studio
- [ ] Configurar `GEMINI_API_KEY` en Supabase
- [ ] Aplicar migración de BD (`db push`)
- [ ] Respaldar función actual
- [ ] Copiar nueva función
- [ ] Deploy de función
- [ ] Probar generación de imagen
- [ ] Verificar logs
- [ ] Monitorear costos
- [ ] Documentar para el equipo
- [ ] (Opcional) Remover `LOVABLE_API_KEY` después de 1 semana

---

## 📞 Soporte

**Documentación:**
- [Gemini Image Generation API](https://ai.google.dev/gemini-api/docs/image-generation)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

**Quota Management:**
- [Google AI Studio](https://aistudio.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)

**Plan Completo:**
- Ver [PHOTO_STUDIO_MIGRATION_PLAN.md](./PHOTO_STUDIO_MIGRATION_PLAN.md) para detalles técnicos adicionales

---

## 🎉 Beneficios Post-Migración

✅ **Ahorro inmediato de costos** (30-50%)
✅ **Mayor control** sobre generación de imágenes
✅ **Sin dependencias** de terceros
✅ **API estable** respaldada por Google
✅ **Mismo frontend** - sin cambios necesarios
✅ **Historial completo** con modelo usado
✅ **Fácil rollback** si es necesario
