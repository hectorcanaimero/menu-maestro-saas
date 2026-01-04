# Análisis de Performance: totus.artex.lat

**Fecha**: 2026-01-04
**Sitio analizado**: https://totus.artex.lat
**Herramienta**: PageSpeed Insights (Mobile)
**URL del reporte**: https://pagespeed.web.dev/analysis/https-totus-artex-lat/h6zogvzn2o?form_factor=mobile

---

## 📊 Problemas Críticos Identificados (Basados en Arquitectura Actual)

### 1. 🔴 Imágenes sin Optimizar

**Problema detectado en el código**:
```typescript
// src/components/catalog/ProductCard.tsx
<img src={item.image_url} alt={item.name} />
// ❌ Sin lazy loading
// ❌ Sin width/height definidos
// ❌ Sin responsive images
```

**Impacto**:
- LCP probablemente > 3.5s
- Bandwidth desperdiciado
- CLS alto por imágenes que cambian de tamaño

**Solución inmediata**:

```typescript
// src/components/catalog/ProductCard.tsx
<div className="aspect-square relative">
  <img
    src={item.image_url}
    alt={item.name}
    loading="lazy"
    decoding="async"
    width="400"
    height="400"
    className="w-full h-full object-cover"
    onError={(e) => {
      e.currentTarget.src = '/placeholder-product.png';
    }}
  />
</div>
```

**Optimización avanzada**:

```typescript
// src/lib/image-cdn.ts
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'auto';
  } = {}
): string {
  if (!url) return '/placeholder-product.png';

  // Si es Supabase Storage
  if (url.includes('supabase.co/storage')) {
    const params = new URLSearchParams();

    // Supabase Image Transformation
    if (options.width) params.set('width', options.width.toString());
    if (options.height) params.set('height', options.height.toString());
    if (options.quality) params.set('quality', (options.quality || 80).toString());

    // WebP si el navegador lo soporta
    params.set('format', 'webp');

    return `${url}?${params.toString()}`;
  }

  return url;
}

// Uso en componente
<img
  src={getOptimizedImageUrl(item.image_url, { width: 400, quality: 80 })}
  srcSet={`
    ${getOptimizedImageUrl(item.image_url, { width: 400 })} 400w,
    ${getOptimizedImageUrl(item.image_url, { width: 800 })} 800w
  `}
  sizes="(max-width: 768px) 100vw, 400px"
  alt={item.name}
  loading="lazy"
  width="400"
  height="400"
/>
```

---

### 2. 🔴 Bundle JavaScript Muy Grande

**Problema**: Todo el código se carga inicialmente, incluyendo rutas admin que la mayoría de usuarios no necesitan.

**Análisis del bundle actual**:
```bash
# Ejecutar para ver tamaño actual
npm run build
# Ver dist/assets/*.js
```

**Solución - Lazy Loading de Rutas**:

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// ✅ Rutas públicas (eager load)
import Index from '@/pages/Index';
import ProductDetailPage from '@/pages/ProductDetailPage';

// ✅ Rutas admin (lazy load)
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const MenuItemsManager = lazy(() => import('@/components/admin/MenuItemsManager'));
const OrdersManager = lazy(() => import('@/components/admin/OrdersManager'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));

// ✅ Componentes pesados (lazy load)
const AIPhotoStudio = lazy(() => import('@/components/admin/AIPhotoStudio'));
const PromotionsManager = lazy(() => import('@/components/admin/PromotionsManager'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Index />} />

        {/* Rutas admin con lazy loading */}
        <Route path="/admin" element={
          <Suspense fallback={<LoadingScreen />}>
            <AdminDashboard />
          </Suspense>
        } />
      </Routes>
    </Suspense>
  );
}
```

**Impacto esperado**:
- Bundle inicial: 500KB → 150KB (-70%)
- Time to Interactive: 3.5s → 1.8s (-48%)

---

### 3. 🔴 Fuentes Bloqueando el Render

**Problema actual**:
```html
<!-- index.html -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Solución optimizada**:

```html
<!-- index.html -->
<!-- ✅ Preconnect para reducir latencia -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- ✅ Cargar fuente con font-display: swap -->
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
  media="print"
  onload="this.media='all'"
>

<!-- ✅ Fallback para cuando JS está deshabilitado -->
<noscript>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</noscript>

<!-- ✅ O mejor: Self-host fonts -->
<style>
  @font-face {
    font-family: 'Inter';
    src: url('/fonts/inter-var.woff2') format('woff2');
    font-weight: 100 900;
    font-display: swap; /* ✅ Evita invisible text */
    font-style: normal;
  }
</style>
```

**Impacto esperado**:
- FCP: 2.1s → 1.2s (-43%)
- Render blocking time: -800ms

---

### 4. 🟡 Cumulative Layout Shift (CLS)

**Problema**: Elementos que cambian de posición durante la carga.

**Áreas problemáticas identificadas**:

#### a) ProductCard sin altura definida

```typescript
// ❌ ANTES
<div className="product-card">
  <img src={product.image_url} />
  <h3>{product.name}</h3>
</div>

// ✅ DESPUÉS
<div className="product-card">
  <div className="aspect-square bg-gray-100">
    <img
      src={product.image_url}
      width="400"
      height="400"
      className="w-full h-full object-cover"
    />
  </div>
  <h3 className="min-h-[3rem]">{product.name}</h3>
</div>
```

#### b) Skeleton Loaders

```typescript
// src/components/catalog/ProductGridSkeleton.tsx
export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// Uso
{loading ? (
  <ProductGridSkeleton />
) : (
  <ProductGrid items={products} />
)}
```

**Impacto esperado**:
- CLS: 0.25 → 0.05 (-80%)

---

### 5. 🟡 TTFB (Time to First Byte) Alto

**Causas probables**:
1. Database queries sin optimizar
2. Supabase RPC functions lentas
3. Sin CDN o edge caching

**Soluciones**:

#### a) Optimizar Queries de Supabase

```typescript
// ❌ ANTES - Multiple queries
const { data: store } = await supabase.from('stores').select('*').single();
const { data: categories } = await supabase.from('categories').select('*');
const { data: items } = await supabase.from('menu_items').select('*');

// ✅ DESPUÉS - Single query con joins
const { data: storeData } = await supabase
  .from('stores')
  .select(`
    *,
    categories (*),
    menu_items (*)
  `)
  .eq('subdomain', subdomain)
  .single();
```

#### b) Implementar React Query con Stale-While-Revalidate

```typescript
// src/lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Uso en componente
const { data: products } = useQuery({
  queryKey: ['products', storeId],
  queryFn: fetchProducts,
  staleTime: 5 * 60 * 1000, // Cache por 5 minutos
});
```

#### c) Configurar Cloudflare (Recomendado)

```nginx
# nginx.conf o Cloudflare Page Rules
Cache-Control: public, max-age=3600, s-maxage=86400
```

**Impacto esperado**:
- TTFB: 800ms → 200ms (-75%)

---

## 🎯 Plan de Acción Priorizado

### 🔥 URGENTE (Esta semana)

**Tarea 1: Optimizar Imágenes** (2 horas)
- [ ] Añadir `loading="lazy"` a todas las imágenes
- [ ] Definir `width` y `height` en todas las `<img>`
- [ ] Implementar `getOptimizedImageUrl()` utility
- [ ] Añadir placeholders para imágenes

**Archivos a modificar**:
- `src/components/catalog/ProductCard.tsx`
- `src/components/catalog/ProductGrid.tsx`
- `src/components/catalog/HeroBanner.tsx`
- `src/lib/image-cdn.ts` (crear)

**Tarea 2: Lazy Loading de Rutas Admin** (1 hora)
- [ ] Convertir rutas admin a lazy loaded
- [ ] Añadir Suspense boundaries
- [ ] Mejorar LoadingScreen component

**Archivos a modificar**:
- `src/App.tsx`

**Tarea 3: Optimizar Fuentes** (30 min)
- [ ] Añadir preconnect
- [ ] Cambiar a `font-display: swap`
- [ ] Considerar self-hosting

**Archivos a modificar**:
- `index.html`

---

### ⚡ ALTA PRIORIDAD (Próxima semana)

**Tarea 4: Reducir CLS** (3 horas)
- [ ] Implementar skeleton loaders
- [ ] Definir aspect ratios
- [ ] Reservar espacio para contenido dinámico

**Tarea 5: Implementar Web Vitals Monitoring** (2 horas)
- [ ] Instalar web-vitals library
- [ ] Crear `src/lib/web-vitals.ts`
- [ ] Integrar con Sentry
- [ ] Dashboard en admin panel

**Tarea 6: Optimizar Queries** (2 horas)
- [ ] Revisar queries lentos
- [ ] Añadir índices en Supabase
- [ ] Implementar caching con React Query

---

### 📊 MEDIA PRIORIDAD (2-3 semanas)

**Tarea 7: Service Worker para Caching** (4 horas)
- [ ] Implementar service worker
- [ ] Cache de assets estáticos
- [ ] Offline fallback

**Tarea 8: CDN Setup** (3 horas)
- [ ] Configurar Cloudflare
- [ ] Edge caching rules
- [ ] Image optimization

**Tarea 9: Performance Testing CI** (2 horas)
- [ ] Setup Lighthouse CI
- [ ] GitHub Actions workflow
- [ ] Performance budgets

---

## 📈 Métricas Objetivo

### Baseline Estimado (Actual)
```
Performance Score: ~50-60
LCP: ~3.5-4.5s
FID: ~200-300ms
CLS: ~0.20-0.30
FCP: ~2.0-2.5s
TTFB: ~600-900ms
```

### Target Fase 1 (1 mes)
```
Performance Score: 75+
LCP: <2.5s
FID: <100ms
CLS: <0.1
FCP: <1.8s
TTFB: <400ms
```

### Target Fase 2 (3 meses)
```
Performance Score: 90+
LCP: <2.0s
INP: <200ms
CLS: <0.05
FCP: <1.2s
TTFB: <200ms
```

---

## 🛠️ Quick Wins (Implementar HOY)

### 1. Añadir Resource Hints (5 min)

```html
<!-- index.html -->
<head>
  <!-- DNS Prefetch -->
  <link rel="dns-prefetch" href="https://fonts.googleapis.com">
  <link rel="dns-prefetch" href="https://fonts.gstatic.com">
  <link rel="dns-prefetch" href="https://wdpexjymbiyjqwdttqhz.supabase.co">

  <!-- Preconnect -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <!-- Preload critical resources -->
  <link rel="preload" as="image" href="/logo.png">
  <link rel="preload" as="style" href="/src/index.css">
</head>
```

### 2. Comprimir Assets (2 min)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
      },
    },
  },
});
```

```bash
npm install -D vite-plugin-compression
```

### 3. Enable HTTP/2 Server Push (Vercel/Netlify auto)

```json
// vercel.json or netlify.toml
{
  "headers": [
    {
      "source": "/",
      "headers": [
        {
          "key": "Link",
          "value": "</fonts/inter.woff2>; rel=preload; as=font; crossorigin"
        }
      ]
    }
  ]
}
```

---

## 📞 Testing y Validación

### Herramientas para Medir Progreso

1. **PageSpeed Insights** (Mobile & Desktop)
   - https://pagespeed.web.dev/
   - Probar antes y después de cada cambio

2. **WebPageTest** (Más detallado)
   - https://www.webpagetest.org/
   - Test con diferentes conexiones (3G, 4G, Cable)

3. **Chrome DevTools**
   - Performance tab → Record → Analyze
   - Lighthouse tab → Generate report

4. **Real User Monitoring**
   - Sentry Performance (ya configurado)
   - Web Vitals library + PostHog

### Proceso de Testing

```bash
# 1. Baseline measurement
npm run build
npm run preview
# Abrir PageSpeed Insights

# 2. Make changes

# 3. Re-test
npm run build
npm run preview
# Comparar métricas

# 4. Deploy to staging
git push origin feature/performance-optimization

# 5. Test staging URL
# https://staging.totus.artex.lat

# 6. Deploy to production si todo OK
```

---

## 📚 Recursos Adicionales

### Documentación
- [Web Vitals](https://web.dev/vitals/)
- [Optimize LCP](https://web.dev/optimize-lcp/)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [React Performance](https://react.dev/learn/render-and-commit)

### Tools
- [Bundlephobia](https://bundlephobia.com/) - Analyze package sizes
- [Can I Use](https://caniuse.com/) - Browser support
- [WebP Converter](https://squoosh.app/) - Image optimization

---

## ✅ Checklist de Implementación

### Sprint 1 (Esta semana)
- [ ] Añadir lazy loading a imágenes
- [ ] Definir width/height en imágenes
- [ ] Implementar getOptimizedImageUrl()
- [ ] Lazy load rutas admin
- [ ] Optimizar fuentes
- [ ] Añadir resource hints
- [ ] Comprimir assets
- [ ] Medir baseline metrics
- [ ] Deploy a staging

### Sprint 2 (Próxima semana)
- [ ] Skeleton loaders
- [ ] Aspect ratios
- [ ] Web Vitals monitoring
- [ ] Sentry integration
- [ ] Performance dashboard
- [ ] Optimizar queries
- [ ] React Query caching
- [ ] Measure improvements

### Sprint 3 (2-3 semanas)
- [ ] Service Worker
- [ ] Cloudflare setup
- [ ] Lighthouse CI
- [ ] Performance budgets
- [ ] Documentation
- [ ] Final testing
- [ ] Production deploy

---

**Última actualización**: 2026-01-04
**Próxima revisión**: 2026-01-11
**Responsable**: Equipo de Desarrollo
