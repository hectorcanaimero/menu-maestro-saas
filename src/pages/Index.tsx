import { Header } from "@/components/catalog/Header";
import { HeroBanner } from "@/components/catalog/HeroBanner";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CategoriesSection } from "@/components/catalog/CategoriesSection";
import { Footer } from "@/components/catalog/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroBanner />
      
      {/* Featured Products Section */}
      <section id="productos" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Productos Destacados
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Descubre nuestra selección especial de productos de alta calidad
            </p>
          </div>
          <ProductGrid />
        </div>
      </section>

      <CategoriesSection />
      <Footer />
    </div>
  );
};

export default Index;
