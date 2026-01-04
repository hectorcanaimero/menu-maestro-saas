# Plan de Acción: Web Vitals & Performance Optimization

**Fecha de Creación**: 2026-01-04
**Responsable**: Equipo de Desarrollo
**Objetivo**: Implementar monitoreo de Web Vitals y optimizar el rendimiento de la aplicación para mejorar la experiencia de usuario y SEO

---

## 📊 Core Web Vitals

Los Core Web Vitals son métricas clave de Google para medir la experiencia de usuario:

### Métricas Principales

1. **LCP (Largest Contentful Paint)** - Rendimiento de carga
   - 🎯 Objetivo: < 2.5 segundos
   - ⚠️ Necesita mejora: 2.5 - 4.0 segundos
   - ❌ Pobre: > 4.0 segundos

2. **FID (First Input Delay)** / **INP (Interaction to Next Paint)**
   - 🎯 Objetivo: < 100ms (FID) / < 200ms (INP)
   - ⚠️ Necesita mejora: 100-300ms (FID) / 200-500ms (INP)
   - ❌ Pobre: > 300ms (FID) / > 500ms (INP)

3. **CLS (Cumulative Layout Shift)** - Estabilidad visual
   - 🎯 Objetivo: < 0.1
   - ⚠️ Necesita mejora: 0.1 - 0.25
   - ❌ Pobre: > 0.25

### Métricas Secundarias

4. **FCP (First Contentful Paint)** - Primera pintura con contenido
5. **TTFB (Time to First Byte)** - Tiempo hasta el primer byte

---

## 🎯 Fase 1: Implementación de Monitoreo (1 día)

### 1.1 Instalar y Configurar Web Vitals

**Archivos a crear/modificar:**

#### 📄 `src/lib/web-vitals.ts` (NUEVO)

```typescript
import { onCLS, onFCP, onFID, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';

interface WebVitalMetric extends Metric {
  navigationType?: string;
}

/**
 * Send Web Vitals to analytics platforms
 */
function sendToAnalytics(metric: WebVitalMetric) {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      navigationType: metric.navigationType,
    });
  }

  // Send to Sentry for performance monitoring
  Sentry.metrics.distribution(metric.name, metric.value, {
    unit: 'millisecond',
    tags: {
      rating: metric.rating,
      navigation_type: metric.navigationType || 'unknown',
    },
  });

  // Send to PostHog for analytics
  posthog.capture('web_vital', {
    metric_name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navigation_type: metric.navigationType,
  });

  // Custom event for Google Analytics (if integrated)
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
}

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals() {
  // Core Web Vitals
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);

  // New metric replacing FID
  onINP(sendToAnalytics);

  // Additional metrics
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);

  console.log('[Web Vitals] Monitoring initialized');
}

/**
 * Get current Web Vitals scores
 */
export async function getWebVitals(): Promise<Record<string, number>> {
  return new Promise((resolve) => {
    const vitals: Record<string, number> = {};

    const collectMetric = (metric: Metric) => {
      vitals[metric.name] = metric.value;

      if (Object.keys(vitals).length === 6) {
        resolve(vitals);
      }
    };

    onCLS(collectMetric);
    onFID(collectMetric);
    onLCP(collectMetric);
    onINP(collectMetric);
    onFCP(collectMetric);
    onTTFB(collectMetric);

    // Timeout after 5 seconds
    setTimeout(() => resolve(vitals), 5000);
  });
}

// TypeScript declaration for gtag
declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
  }
}
```

#### 📄 `src/main.tsx` (MODIFICAR)

```typescript
// ... existing imports ...
import { initWebVitals } from '@/lib/web-vitals';

// ... existing code ...

// Initialize Web Vitals monitoring
if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_WEB_VITALS === 'true') {
  initWebVitals();
}

// ... rest of the file
```

#### 📄 `.env` (AÑADIR)

```bash
# Web Vitals Configuration
# Enable in development for testing (default: false)
VITE_ENABLE_WEB_VITALS=false
```

#### 📄 `.env.production` (AÑADIR)

```bash
# Web Vitals Configuration
VITE_ENABLE_WEB_VITALS=true
```

### 1.2 Dashboard de Monitoreo en Admin

#### 📄 `src/components/admin/PerformanceDashboard.tsx` (NUEVO)

```typescript
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { getWebVitals } from '@/lib/web-vitals';

interface VitalMetric {
  name: string;
  value: number;
  unit: string;
  threshold: { good: number; needsImprovement: number };
}

export function PerformanceDashboard() {
  const [vitals, setVitals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVitals = async () => {
      const data = await getWebVitals();
      setVitals(data);
      setLoading(false);
    };
    loadVitals();
  }, []);

  const metrics: VitalMetric[] = [
    {
      name: 'LCP',
      value: vitals.LCP || 0,
      unit: 'ms',
      threshold: { good: 2500, needsImprovement: 4000 },
    },
    {
      name: 'FID',
      value: vitals.FID || 0,
      unit: 'ms',
      threshold: { good: 100, needsImprovement: 300 },
    },
    {
      name: 'CLS',
      value: vitals.CLS || 0,
      unit: '',
      threshold: { good: 0.1, needsImprovement: 0.25 },
    },
    {
      name: 'INP',
      value: vitals.INP || 0,
      unit: 'ms',
      threshold: { good: 200, needsImprovement: 500 },
    },
    {
      name: 'FCP',
      value: vitals.FCP || 0,
      unit: 'ms',
      threshold: { good: 1800, needsImprovement: 3000 },
    },
    {
      name: 'TTFB',
      value: vitals.TTFB || 0,
      unit: 'ms',
      threshold: { good: 800, needsImprovement: 1800 },
    },
  ];

  const getRating = (metric: VitalMetric) => {
    if (metric.value <= metric.threshold.good) return 'good';
    if (metric.value <= metric.threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'needs-improvement':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'good':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'poor':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return <div>Cargando métricas de rendimiento...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Core Web Vitals</h2>
        <p className="text-muted-foreground">
          Métricas de rendimiento de tu aplicación
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => {
          const rating = getRating(metric);
          return (
            <Card key={metric.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                {getRatingIcon(rating)}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metric.name === 'CLS'
                    ? metric.value.toFixed(3)
                    : Math.round(metric.value)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {metric.unit}
                  </span>
                </div>
                <Badge className={`mt-2 ${getRatingColor(rating)}`}>
                  {rating === 'good' && '🎯 Excelente'}
                  {rating === 'needs-improvement' && '⚠️ Necesita mejora'}
                  {rating === 'poor' && '❌ Pobre'}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>¿Qué significan estas métricas?</CardTitle>
          <CardDescription>
            Guía rápida de Core Web Vitals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <strong>LCP (Largest Contentful Paint)</strong>
            <p className="text-muted-foreground">
              Tiempo que tarda en cargar el contenido principal de la página. Objetivo: {'<'} 2.5s
            </p>
          </div>
          <div>
            <strong>FID (First Input Delay)</strong>
            <p className="text-muted-foreground">
              Tiempo de respuesta a la primera interacción del usuario. Objetivo: {'<'} 100ms
            </p>
          </div>
          <div>
            <strong>CLS (Cumulative Layout Shift)</strong>
            <p className="text-muted-foreground">
              Estabilidad visual - mide los saltos inesperados de contenido. Objetivo: {'<'} 0.1
            </p>
          </div>
          <div>
            <strong>INP (Interaction to Next Paint)</strong>
            <p className="text-muted-foreground">
              Nueva métrica que reemplaza FID - mide la latencia de todas las interacciones. Objetivo: {'<'} 200ms
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🚀 Fase 2: Optimizaciones de Performance (1-2 semanas)

### 2.1 Optimización de Imágenes

**Problema**: Las imágenes sin optimizar son la causa #1 de LCP lento.

**Solución**:

#### a) Lazy Loading de Imágenes

```typescript
// src/components/catalog/ProductCard.tsx
<img
  src={product.image_url}
  alt={product.name}
  loading="lazy" // ✅ Native lazy loading
  decoding="async" // ✅ Async image decoding
  width="300"
  height="200"
  className="..."
/>
```

#### b) Responsive Images con srcset

```typescript
<img
  src={product.image_url}
  srcSet={`
    ${product.image_url}?w=400 400w,
    ${product.image_url}?w=800 800w,
    ${product.image_url}?w=1200 1200w
  `}
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  alt={product.name}
  loading="lazy"
/>
```

#### c) Preload de Imágenes Críticas

```html
<!-- index.html -->
<link rel="preload" as="image" href="/logo.png" />
<link rel="preload" as="image" href="/hero-banner.jpg" />
```

#### d) Implementar Image CDN (Cloudinary o imgix)

```typescript
// src/lib/image-optimizer.ts
export function optimizeImage(url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
}) {
  if (!url) return url;

  // Si es Supabase Storage
  if (url.includes('supabase.co')) {
    const params = new URLSearchParams();
    if (options.width) params.set('width', options.width.toString());
    if (options.height) params.set('height', options.height.toString());
    if (options.quality) params.set('quality', options.quality.toString());

    return `${url}?${params.toString()}`;
  }

  // Si es Cloudinary (ejemplo)
  if (url.includes('cloudinary')) {
    const transforms = [
      options.width && `w_${options.width}`,
      options.height && `h_${options.height}`,
      options.quality && `q_${options.quality}`,
      options.format && `f_${options.format}`,
    ].filter(Boolean).join(',');

    return url.replace('/upload/', `/upload/${transforms}/`);
  }

  return url;
}
```

### 2.2 Code Splitting y Lazy Loading de Componentes

**Problema**: El bundle inicial es muy grande.

**Solución**:

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// ✅ Lazy load de rutas admin
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const MenuItemsManager = lazy(() => import('@/pages/admin/MenuItemsManager'));
const OrdersManager = lazy(() => import('@/pages/admin/OrdersManager'));

// ✅ Lazy load de componentes pesados
const AIPhotoStudio = lazy(() => import('@/components/admin/AIPhotoStudio'));
const PromotionsManager = lazy(() => import('@/components/admin/PromotionsManager'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        {/* ... otras rutas */}
      </Routes>
    </Suspense>
  );
}
```

### 2.3 Optimización de Fuentes

**Problema**: Las fuentes bloquean el render.

**Solución**:

```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
>

<!-- O mejor aún, usar font-display: swap -->
<style>
  @font-face {
    font-family: 'Inter';
    src: url('/fonts/inter.woff2') format('woff2');
    font-display: swap; /* ✅ Evita FOIT (Flash of Invisible Text) */
  }
</style>
```

### 2.4 Prefetch y Preload de Recursos

```typescript
// src/lib/resource-hints.ts
export function prefetchRoute(path: string) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);
}

// En componentes
useEffect(() => {
  // Prefetch admin routes cuando el usuario está autenticado
  if (isAuthenticated) {
    prefetchRoute('/admin');
    prefetchRoute('/admin/menu-items');
  }
}, [isAuthenticated]);
```

### 2.5 Optimización de React Query

```typescript
// src/lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: 1,
      // ✅ Prefetch en background
      refetchOnMount: 'always',
    },
  },
});
```

### 2.6 Reducir CLS (Layout Shift)

**Problema**: Elementos que cambian de posición durante la carga.

**Solución**:

```typescript
// ✅ Definir tamaños de contenedores
<div className="aspect-video"> {/* 16:9 ratio */}
  <img src={product.image_url} className="w-full h-full object-cover" />
</div>

// ✅ Skeleton loaders
{loading ? (
  <Skeleton className="h-48 w-full" />
) : (
  <ProductCard product={product} />
)}

// ✅ Reservar espacio para contenido dinámico
<div className="min-h-[200px]">
  {dynamicContent}
</div>
```

### 2.7 Service Worker para Caching

```typescript
// public/service-worker.js
const CACHE_NAME = 'pideai-v1';
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/scripts/main.js',
  '/images/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

---

## 📈 Fase 3: Monitoreo Continuo (Ongoing)

### 3.1 Integrar con Sentry Performance

```typescript
// src/main.tsx
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% de transacciones
  tracePropagationTargets: ['localhost', /^https:\/\/.*\.pideai\.com/],

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 3.2 Configurar Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://www.pideai.com
            https://demo.pideai.com
          uploadArtifacts: true
          temporaryPublicStorage: true
```

### 3.3 PostHog Dashboard para Web Vitals

```typescript
// En PostHog, crear dashboard con queries:
// - Avg LCP by page
// - P75 FID by device
// - CLS distribution
// - Performance score trends
```

---

## 🎯 Objetivos y Métricas de Éxito

### Objetivos a Corto Plazo (1 mes)

- ✅ LCP < 2.5s en 75% de las páginas
- ✅ FID < 100ms en 75% de las interacciones
- ✅ CLS < 0.1 en 75% de las sesiones
- ✅ Performance Score de Lighthouse > 80

### Objetivos a Medio Plazo (3 meses)

- ✅ LCP < 2.0s en 90% de las páginas
- ✅ INP < 200ms en 90% de las interacciones
- ✅ CLS < 0.05 en 90% de las sesiones
- ✅ Performance Score de Lighthouse > 90

### KPIs de Negocio Impactados

- 📈 Tasa de conversión (+10-20% esperado)
- 📈 Tiempo en sitio (+15% esperado)
- 📈 SEO ranking (mejora en rankings de Google)
- 📉 Bounce rate (-20% esperado)

---

## 📋 Checklist de Implementación

### Semana 1: Setup y Monitoreo

- [ ] Instalar y configurar web-vitals library
- [ ] Crear `src/lib/web-vitals.ts`
- [ ] Integrar con Sentry Performance
- [ ] Integrar con PostHog
- [ ] Crear PerformanceDashboard component
- [ ] Añadir ruta `/admin/performance` en AdminLayout
- [ ] Configurar environment variables
- [ ] Deploy a staging y verificar métricas

### Semana 2: Optimización de Imágenes

- [ ] Implementar lazy loading en todas las imágenes
- [ ] Añadir `width` y `height` a todas las `<img>`
- [ ] Crear utility `optimizeImage()`
- [ ] Implementar responsive images con srcset
- [ ] Preload de imágenes críticas (logo, hero)
- [ ] Evaluar integración con Cloudinary/imgix
- [ ] Medir impacto en LCP

### Semana 3: Code Splitting

- [ ] Lazy load de rutas admin
- [ ] Lazy load de componentes pesados (AIPhotoStudio, etc.)
- [ ] Implementar Suspense boundaries
- [ ] Mejorar LoadingScreen component
- [ ] Analizar bundle size con `vite-bundle-visualizer`
- [ ] Reducir bundle inicial < 200KB

### Semana 4: Optimizaciones Finales

- [ ] Optimizar fuentes (preconnect, font-display: swap)
- [ ] Implementar resource hints (prefetch, preload)
- [ ] Añadir skeleton loaders donde falta
- [ ] Revisar y reducir CLS en todas las páginas
- [ ] Configurar Service Worker
- [ ] Setup Lighthouse CI
- [ ] Realizar pruebas A/B

---

## 🛠️ Herramientas y Recursos

### Herramientas de Testing

- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

### Documentación

- [Web Vitals](https://web.dev/vitals/)
- [Optimize LCP](https://web.dev/optimize-lcp/)
- [Optimize FID](https://web.dev/optimize-fid/)
- [Optimize CLS](https://web.dev/optimize-cls/)
- [Vite Performance](https://vitejs.dev/guide/performance.html)

### Librerías Útiles

- `web-vitals` - Medición de métricas ✅ (ya instalado)
- `react-lazy-load-image-component` - Lazy loading avanzado
- `@next/bundle-analyzer` - Análisis de bundle (alternativa para Vite)
- `workbox` - Service Worker toolkit

---

## 💡 Recomendaciones Adicionales

1. **Monitoreo RUM (Real User Monitoring)**
   - Implementar Sentry Performance para datos reales
   - Segmentar métricas por: dispositivo, país, navegador

2. **Budget de Performance**
   ```json
   // package.json
   {
     "performance": {
       "budgets": [
         { "path": "dist/**/*.js", "maxSize": "200kb" },
         { "path": "dist/**/*.css", "maxSize": "50kb" }
       ]
     }
   }
   ```

3. **Progressive Web App (PWA)**
   - Implementar Service Worker
   - Añadir manifest.json completo
   - Cachear assets críticos

4. **CDN y Edge Caching**
   - Considerar Cloudflare o Fastly
   - Configurar cache headers apropiados
   - Edge functions para lógica dinámica

5. **Database Query Optimization**
   - Añadir índices en queries lentos
   - Implementar cache de resultados frecuentes
   - Optimizar RPC functions en Supabase

---

## 📞 Contacto y Soporte

Para dudas sobre este plan de acción:
- **Documentación**: Ver `/docs/WEB_VITALS_ACTION_PLAN.md`
- **Issues**: Crear issue en GitHub con label `performance`
- **Dashboard**: Ver métricas en `/admin/performance`

---

**Última actualización**: 2026-01-04
**Próxima revisión**: 2026-02-04
