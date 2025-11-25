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

const Index = () => {
  const { store, loading: storeLoading } = useStore();
  const navigate = useNavigate();

  // Apply store theme colors
  useStoreTheme();

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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <StoreIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Tienda no encontrada</h1>
          <p className="text-muted-foreground mb-6">Esta tienda no existe o no está activa.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/welcome')}>Ver PideAI</Button>
            <Button variant="outline" onClick={() => navigate('/create-store')}>
              Crear mi tienda
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-0">
      <Header />

      {/* Categories Horizontal Scroll */}
      <CategoriesSection />

      <div className="container mx-auto px-4">
        {/* Store Info Widget */}
        {store && (
          <section className="py-4 md:py-6">
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

        {/* All Products Section with Grid/List Toggle */}
        <section id="productos">
          <ProductGrid />
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
