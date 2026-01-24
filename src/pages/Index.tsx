import { Header } from '@/components/catalog/Header';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { CategoriesSection } from '@/components/catalog/CategoriesSection';
import { Footer } from '@/components/catalog/Footer';
import { Button } from '@/components/ui/button';
import { Store as StoreIcon } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useNavigate } from 'react-router-dom';
import { useStoreTheme } from '@/hooks/useStoreTheme';
import { StoreInfoWidget } from '@/components/catalog/StoreInfoWidget';
import { FeaturedProducts } from '@/components/catalog/FeaturedProducts';
import { FloatingCartButton } from '@/components/cart/FloatingCartButton';
import { FloatingWhatsAppButton } from '@/components/catalog/FloatingWhatsAppButton';
import { CatalogLimitBanner } from '@/components/catalog/CatalogLimitBanner';
import { usePostHogViewLimitStatus } from '@/hooks/usePostHogViewLimitStatus';
import { useSubscription } from '@/hooks/useSubscription';
import { isPostHogAPIConfigured } from '@/lib/posthog-api';
import { isMainDomain } from '@/lib/subdomain-validation';
import { lazy, Suspense, useEffect, useMemo } from 'react';
import posthog from 'posthog-js';

const LandingPage = lazy(() => import('./LandingPage'));

const Index = () => {
  const { store, loading: storeLoading } = useStore();
  const navigate = useNavigate();

  // Apply store theme colors
  useStoreTheme();

  // Check if catalog mode is enabled
  const isCatalogMode = store?.catalog_mode ?? false;

  // Use PostHog for view limits if configured
  const usePostHog = isPostHogAPIConfigured();

  // Get view limit status (only when catalog mode is enabled)
  const { data: viewLimitStatus } = usePostHogViewLimitStatus(store?.id, isCatalogMode && usePostHog);

  // Get subscription and usage stats (for order limits when NOT in catalog mode)
  const { usage } = useSubscription();

  // Determine if catalog should be blurred based on plan limits
  const shouldBlurCatalog = useMemo(() => {
    if (isCatalogMode) {
      // Catalog mode ON: Check view limits
      return viewLimitStatus?.exceeded && !viewLimitStatus?.isUnlimited;
    } else {
      // Catalog mode OFF (e-commerce): Check order limits
      if (!usage?.orders_this_month) return false;

      const { current, limit, unlimited } = usage.orders_this_month;

      // Don't blur if unlimited
      if (unlimited || limit === null || limit === -1) return false;

      // Blur if current orders >= limit
      return current >= limit;
    }
  }, [isCatalogMode, viewLimitStatus, usage]);

  // Track catalog page views (for all stores, not just catalog mode)
  useEffect(() => {
    // Track when store is loaded
    if (store?.id) {
      try {
        // Track in PostHog for analytics and view limits
        // The platform admin will read from PostHog to check limits
        posthog.capture('catalog_page_view', {
          store_id: store.id,
          store_name: store.name,
          subdomain: store.subdomain,
          catalog_mode: isCatalogMode,
          pathname: window.location.pathname,
          url: window.location.href,
        });
      } catch (error) {
        console.error('[PostHog] Error tracking catalog_page_view:', error);
      }
    }
  }, [store?.id, store?.name, store?.subdomain, isCatalogMode]);

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tienda...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    // Show landing page for www.pideai.com
    if (isMainDomain()) {
      return (
        <Suspense
          fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }
        >
          <LandingPage />
        </Suspense>
      );
    }

    // Show store not found for other subdomains
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <StoreIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Tienda no encontrada</h1>
          <p className="text-muted-foreground mb-6">Esta tienda no existe o no está activa.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/create-store')}>Crear mi tienda</Button>
            <Button variant="outline" onClick={() => navigate('/auth')}>
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-0">
      <Header />

      {/* Catalog Limit Banner (80% warning) */}
      {isCatalogMode && viewLimitStatus && !viewLimitStatus.isUnlimited && (
        <CatalogLimitBanner
          percentage={viewLimitStatus.percentage}
          currentViews={viewLimitStatus.currentViews}
          limit={viewLimitStatus.limit!}
          exceeded={viewLimitStatus.exceeded}
        />
      )}

      {/* Main content wrapper with conditional blur */}
      <div className={shouldBlurCatalog ? 'blur-md pointer-events-none select-none' : ''}>
        {/* Categories Horizontal Scroll */}
        <CategoriesSection />

        <div className="container mx-auto px-4">
          {/* Store Info Widget */}
          {store && (
            <section className="pt-4 md:pt-6">
              <StoreInfoWidget
                storeId={store.id}
                storeName={store.name}
                estimatedDeliveryTime={store.estimated_delivery_time}
                address={store.address}
                phone={store.phone}
                email={store.email}
                description={store.description}
                forceStatus={store.force_status}
              />
            </section>
          )}

          {/* Featured Products Section */}
          <FeaturedProducts />

          {/* All Products Section with Grid/List Toggle */}
          <section id="productos">
            <ProductGrid />
          </section>
        </div>
      </div>

      {/* Floating Cart Button */}
      <FloatingCartButton />

      {/* Floating WhatsApp Button (Catalog Mode) */}
      <FloatingWhatsAppButton />

      {/* Footer */}
      <Footer />

      {/* Order Limit Overlay (e-commerce mode - when order limit exceeded) */}
      {/* {!isCatalogMode && shouldBlurCatalog && usage?.orders_this_month && (
        <OrderLimitOverlay
          currentOrders={usage.orders_this_month.current}
          limit={usage.orders_this_month.limit!}
          storeName={store?.name}
        />
      )} */}

      {/* Catalog Blocked Overlay (catalog mode - when soft-limit exceeded) */}
      {/* {isCatalogMode && viewLimitStatus?.hardBlocked && !viewLimitStatus.isUnlimited && (
        <CatalogBlockedOverlay
          currentViews={viewLimitStatus.currentViews}
          limit={viewLimitStatus.limit!}
          softLimit={viewLimitStatus.softLimit!}
          storeName={store?.name}
        />
      )} */}
    </div>
  );
};

export default Index;
