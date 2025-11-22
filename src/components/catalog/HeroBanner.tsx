import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import heroImage from "@/assets/hero-restaurant.jpg";
import { useStore } from "@/contexts/StoreContext";

export const HeroBanner = () => {
  const { store } = useStore();
  const bannerImage = store?.banner_url || heroImage;
  
  return (
    <section className="relative h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bannerImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          Descubre Nuestros{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Productos
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Calidad excepcional y diseños únicos para cada ocasión especial
        </p>

        <Button 
          size="lg" 
          className="group bg-primary hover:bg-primary/90 text-lg px-8"
          onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Explorar Productos
          <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </section>
  );
};
