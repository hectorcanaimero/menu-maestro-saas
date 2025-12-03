# 🗺️ Configuración de Google Maps API

Este documento explica cómo configurar Google Maps API para habilitar las funcionalidades de geocodificación y cálculo de distancias en el módulo de delivery.

---

## 📋 Prerequisitos

1. Cuenta de Google Cloud Platform (GCP)
2. Método de pago configurado en GCP (requerido incluso para el free tier)

---

## 🔧 Paso 1: Crear Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Click en **"Select a project"** → **"New Project"**
3. Nombre del proyecto: `pideai-delivery` (o el que prefieras)
4. Click en **"Create"**

---

## 🔑 Paso 2: Habilitar APIs Necesarias

En tu proyecto de Google Cloud, necesitas habilitar 3 APIs:

### 1. Geocoding API
Para convertir direcciones a coordenadas (lat/lng)

1. Ve a: https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com
2. Selecciona tu proyecto
3. Click en **"Enable"**

### 2. Distance Matrix API
Para calcular distancias y tiempos de viaje

1. Ve a: https://console.cloud.google.com/apis/library/distance-matrix-backend.googleapis.com
2. Selecciona tu proyecto
3. Click en **"Enable"**

### 3. Directions API
Para obtener rutas (polylines) en el mapa

1. Ve a: https://console.cloud.google.com/apis/library/directions-backend.googleapis.com
2. Selecciona tu proyecto
3. Click en **"Enable"**

---

## 🎫 Paso 3: Crear API Key

1. Ve a [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click en **"Create Credentials"** → **"API Key"**
3. Se generará una API key: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
4. Click en **"Restrict Key"** (MUY IMPORTANTE para seguridad)

---

## 🔒 Paso 4: Restringir la API Key (Seguridad)

### Opción A: Restricción por IP (Recomendado para Supabase Edge Functions)

1. En la configuración de tu API Key
2. Ve a **"API restrictions"**
3. Selecciona **"Restrict key"**
4. Marca solo las APIs que necesitas:
   - ✅ Geocoding API
   - ✅ Distance Matrix API
   - ✅ Directions API
5. Ve a **"Application restrictions"**
6. Selecciona **"IP addresses"**
7. Agrega las IPs de Supabase (depende de tu región):
   - Si usas Supabase hosted, consulta sus rangos de IP
   - Si usas local development: `127.0.0.1`

### Opción B: Sin restricciones (Solo para desarrollo)

⚠️ **NO uses esta opción en producción**

1. Deja **"Application restrictions"** en **"None"**
2. En **"API restrictions"**, selecciona las 3 APIs mencionadas

---

## 🔐 Paso 5: Configurar en Supabase

### Opción A: Via Dashboard de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com/)
2. Ve a **Settings** → **Edge Functions**
3. En **Secrets**, agrega:
   - Key: `GOOGLE_MAPS_API_KEY`
   - Value: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` (tu API key)

### Opción B: Via Supabase CLI

```bash
# Asegúrate de estar logueado
supabase login

# Link tu proyecto local con el proyecto en Supabase
supabase link --project-ref tu-project-ref

# Configurar el secret
supabase secrets set GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🧪 Paso 6: Desplegar Edge Functions

Las edge functions que usan Google Maps API son:

1. **`geocode-address`** - Nueva función para geocodificación
2. **`calculate-delivery-distance`** - Función existente para calcular distancias

### Desplegar ambas funciones:

```bash
# Navegar a la raíz del proyecto
cd /Users/al3jandro/project/pideai/app

# Desplegar función de geocodificación (NUEVA)
supabase functions deploy geocode-address

# Re-desplegar función de cálculo de distancia (para usar el secret)
supabase functions deploy calculate-delivery-distance
```

---

## ✅ Paso 7: Verificar que Funciona

### Test 1: Geocodificación (desde el navegador)

1. Login como admin en tu app
2. Ve a `/admin/delivery`
3. Click en tab **"Configuración"**
4. En **"Ubicación de la Tienda"**:
   - Ingresa una dirección: `Av. Francisco de Miranda, Caracas, Venezuela`
   - Click en **"Obtener Coordenadas"**
5. ✅ Deberías ver un toast: `Coordenadas obtenidas: 10.500000, -66.850000`
6. ✅ Los campos de Latitud y Longitud se llenan automáticamente
7. ✅ La dirección se formatea según Google Maps

### Test 2: Geocodificación (via curl)

```bash
# Obtener tu anon key de Supabase
ANON_KEY="tu-anon-key"
PROJECT_URL="https://tu-proyecto.supabase.co"

# Llamar a la función
curl -X POST "${PROJECT_URL}/functions/v1/geocode-address" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"address": "Av. Francisco de Miranda, Caracas"}'
```

**Respuesta esperada:**
```json
{
  "lat": 10.5000,
  "lng": -66.8500,
  "formatted_address": "Av. Francisco de Miranda, Caracas, Venezuela",
  "place_id": "ChIJ..."
}
```

### Test 3: Cálculo de Distancia (via curl)

```bash
curl -X POST "${PROJECT_URL}/functions/v1/calculate-delivery-distance" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "store_lat": 10.4806,
    "store_lng": -66.9036,
    "delivery_lat": 10.5000,
    "delivery_lng": -66.8500,
    "base_delivery_price": 2.00,
    "price_per_km": 0.50,
    "max_delivery_distance_km": 15
  }'
```

**Respuesta esperada:**
```json
{
  "distance_km": 5.23,
  "duration_minutes": 18,
  "delivery_price": 4.62,
  "formatted_distance": "5.2 km",
  "formatted_duration": "18 mins",
  "route_polyline": "encoded_polyline_string...",
  "within_delivery_range": true
}
```

---

## 💰 Costos de Google Maps API

### Free Tier (Mensual)
Google ofrece **$200 USD** de crédito gratis cada mes, que incluye:

**Geocoding API:**
- **40,000 requests gratis/mes**
- Después: $5 USD por cada 1,000 requests

**Distance Matrix API:**
- **40,000 elements gratis/mes**
- Después: $5 USD por cada 1,000 elements

**Directions API:**
- **40,000 directions gratis/mes**
- Después: $5 USD por cada 1,000 directions

### Ejemplo de Uso Real

Para un restaurante con **100 entregas/día**:

**Uso diario:**
- Geocoding: 1 request al configurar dirección de tienda (una sola vez)
- Distance Matrix: 100 requests (1 por entrega)
- Directions: 100 requests (1 por entrega)

**Uso mensual (30 días):**
- Geocoding: ~1 request
- Distance Matrix: ~3,000 requests
- Directions: ~3,000 requests

**Total:** ~6,000 requests/mes = **100% GRATIS** (bien dentro del límite de 40,000)

---

## 🔍 Troubleshooting

### Error: "Google Maps API key not configured"

**Causa:** El secret no está configurado en Supabase

**Solución:**
```bash
supabase secrets set GOOGLE_MAPS_API_KEY=tu-api-key
```

### Error: "This API project is not authorized to use this API"

**Causa:** La API no está habilitada en Google Cloud

**Solución:**
1. Ve a Google Cloud Console
2. Habilita las APIs mencionadas en el Paso 2

### Error: "API key not valid"

**Causa:** La API key está mal copiada o fue revocada

**Solución:**
1. Verifica que la API key esté completa (sin espacios)
2. Genera una nueva API key si es necesario
3. Actualiza el secret en Supabase

### Error: "REQUEST_DENIED"

**Causa:** Las restricciones de la API key están bloqueando la request

**Solución:**
1. Ve a Google Cloud Console → Credentials
2. Edita tu API key
3. Relaja las restricciones temporalmente para debugging
4. Verifica que las 3 APIs estén marcadas en "API restrictions"

### Error: "ZERO_RESULTS" al geocodificar

**Causa:** La dirección no fue encontrada por Google Maps

**Solución:**
1. Verifica que la dirección sea válida
2. Incluye ciudad y país en la dirección
3. Intenta con direcciones más específicas

---

## 🚀 Uso en la Aplicación

### Geocodificación de Direcciones

**Ubicación en el Admin:**
1. `/admin/delivery` → Tab "Configuración"
2. Sección "Ubicación de la Tienda"
3. Ingresar dirección completa
4. Click en "Obtener Coordenadas"

**Código (ya implementado):**
```typescript
// src/pages/admin/AdminDelivery.tsx
const handleGeocodeAddress = async () => {
  const { data, error } = await supabase.functions.invoke('geocode-address', {
    body: { address: deliverySettings.store_address_full },
  });

  setDeliverySettings({
    ...deliverySettings,
    store_lat: data.lat,
    store_lng: data.lng,
    store_address_full: data.formatted_address,
  });
};
```

### Cálculo de Distancia (Próxima Fase)

**Se integrará en el checkout:**
```typescript
// Al cliente ingresar su dirección
const calculateDelivery = async (customerAddress) => {
  // 1. Geocodificar dirección del cliente
  const geocoded = await supabase.functions.invoke('geocode-address', {
    body: { address: customerAddress },
  });

  // 2. Calcular distancia
  const distance = await supabase.functions.invoke('calculate-delivery-distance', {
    body: {
      store_lat: store.store_lat,
      store_lng: store.store_lng,
      delivery_lat: geocoded.data.lat,
      delivery_lng: geocoded.data.lng,
      base_delivery_price: store.base_delivery_price,
      price_per_km: store.price_per_km,
      max_delivery_distance_km: store.max_delivery_distance_km,
    },
  });

  // 3. Mostrar precio y tiempo al cliente
  if (!distance.data.within_delivery_range) {
    toast.error('Tu dirección está fuera del rango de entrega');
    return;
  }

  setDeliveryPrice(distance.data.delivery_price);
  setEstimatedTime(distance.data.duration_minutes);
};
```

---

## 📝 Resumen de Archivos Modificados/Creados

### Nuevos archivos:
- ✅ `supabase/functions/geocode-address/index.ts` - Edge function para geocodificación
- ✅ `docs/GOOGLE_MAPS_SETUP.md` - Este documento

### Archivos modificados:
- ✅ `src/pages/admin/AdminDelivery.tsx` - Implementación de geocodificación real

### Archivos existentes (sin cambios):
- ✅ `supabase/functions/calculate-delivery-distance/index.ts` - Ya existía

---

## 🎯 Próximos Pasos

1. ✅ **Configurar Google Maps API** (esta guía)
2. ⏳ **Integrar geocodificación en checkout** - Para calcular precio automáticamente
3. ⏳ **Mostrar rutas en mapa** - Usar polylines en TrackOrder
4. ⏳ **App PWA para motoristas** - Tracking GPS automático

---

## 🔗 Referencias Útiles

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Geocoding API Guide](https://developers.google.com/maps/documentation/geocoding)
- [Distance Matrix API Guide](https://developers.google.com/maps/documentation/distance-matrix)
- [Directions API Guide](https://developers.google.com/maps/documentation/directions)
- [Pricing Calculator](https://mapsplatform.google.com/pricing/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Documentado por:** Claude Code
**Fecha:** 2 de Diciembre, 2025
**Versión:** 1.0.0
