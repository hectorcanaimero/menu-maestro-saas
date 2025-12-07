# Guía Rápida: Migración a Gemini API

**Tiempo estimado:** 15-30 minutos

---

## 🚀 Pasos de Migración

### 1. Obtener API Key de Google (5 min)

1. Ve a [Google AI Studio](https://aistudio.google.com/)
2. Click en "Get API key"
3. Copia tu API key

### 2. Configurar Secret en Supabase (2 min)

```bash
# Opción A: Usando CLI
npx supabase secrets set GEMINI_API_KEY=<tu_api_key_aqui>

# Opción B: Usando Dashboard
# 1. Ir a https://supabase.com/dashboard/project/<tu-project>/settings/vault
# 2. Click "New secret"
# 3. Name: GEMINI_API_KEY
# 4. Value: <tu_api_key>
```

### 3. Actualizar Edge Function (5 min)

```bash
# 1. Respaldar versión actual
cp supabase/functions/enhance-product-image/index.ts supabase/functions/enhance-product-image/index-lovable-backup.ts

# 2. Reemplazar con nueva versión
cp supabase/functions/enhance-product-image/index-gemini.ts supabase/functions/enhance-product-image/index.ts
```

### 4. Testing Local (5 min)

```bash
# Iniciar función localmente
npx supabase functions serve enhance-product-image

# En otra terminal, probar
curl -X POST http://localhost:54321/functions/v1/enhance-product-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/pizza.jpg",
    "style": "realistic",
    "menuItemId": "test-123",
    "menuItemName": "Pizza Margherita",
    "storeId": "test-store",
    "aspectRatio": "1:1",
    "model": "gemini-2.5-flash-image"
  }'
```

### 5. Deploy (2 min)

```bash
# Deploy a producción
npx supabase functions deploy enhance-product-image

# Verificar
npx supabase functions list
```

---

## ✅ Verificación

**Desde el frontend:**
1. Ir al módulo de productos
2. Seleccionar una imagen
3. Abrir "Estudio Fotográfico"
4. Generar imagen con cualquier estilo
5. Verificar que se genera correctamente

**Logs:**
```bash
# Ver logs en tiempo real
npx supabase functions logs enhance-product-image --follow
```

---

## 🔄 Rollback (Si algo falla)

```bash
# Restaurar versión anterior
cp supabase/functions/enhance-product-image/index-lovable-backup.ts supabase/functions/enhance-product-image/index.ts

# Re-deploy
npx supabase functions deploy enhance-product-image

# Restaurar secret (si es necesario)
npx supabase secrets set LOVABLE_API_KEY=<tu_lovable_key>
```

---

## 📊 Diferencias Clave

| Aspecto | Lovable (Antes) | Gemini API (Ahora) |
|---------|----------------|-------------------|
| **Endpoint** | ai.gateway.lovable.dev | generativelanguage.googleapis.com |
| **API Key** | LOVABLE_API_KEY | GEMINI_API_KEY |
| **Modelos** | Solo Flash | Flash + Pro (4K) |
| **Costo** | ~$0.05-0.10 | $0.039-0.24 |
| **Input** | URL directa | Base64 |
| **Output** | URL base64 | Base64 inline |

---

## 🆕 Nuevas Funcionalidades

### Seleccionar Modelo

```typescript
// Modelo rápido (más barato)
{
  model: 'gemini-2.5-flash-image',
  resolution: '1K'
}

// Modelo premium (mejor calidad)
{
  model: 'gemini-3-pro-image-preview',
  resolution: '4K'
}
```

### Resoluciones Disponibles

- `1K` - 1024px (Rápido, económico)
- `2K` - 2048px (Balanceado)
- `4K` - 4096px (Solo Pro, máxima calidad)

---

## ⚠️ Puntos Importantes

1. **Migración de tabla `ai_enhancement_history`:**
   ```sql
   -- Agregar columnas nuevas (ya incluidas en la función)
   ALTER TABLE ai_enhancement_history
   ADD COLUMN IF NOT EXISTS model_used TEXT,
   ADD COLUMN IF NOT EXISTS aspect_ratio TEXT,
   ADD COLUMN IF NOT EXISTS resolution TEXT;
   ```

2. **Rate Limits:**
   - Default: 15 RPM (requests per minute)
   - Si necesitas más, solicitar en Google Cloud Console

3. **Costos:**
   - Flash: $0.039/imagen
   - Pro: $0.24/imagen (4K)
   - Monitorear en [Google AI Studio Billing](https://aistudio.google.com/app/billing)

---

## 📞 Soporte

**Si tienes problemas:**
1. Revisar logs: `npx supabase functions logs enhance-product-image`
2. Verificar API Key: `npx supabase secrets list`
3. Verificar quota: [Google AI Studio](https://aistudio.google.com/)

**Documentación:**
- Plan completo: [PHOTO_STUDIO_MIGRATION_PLAN.md](./PHOTO_STUDIO_MIGRATION_PLAN.md)
- API Gemini: https://ai.google.dev/gemini-api/docs/image-generation
