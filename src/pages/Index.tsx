import { Header } from "@/components/catalog/Header";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CategoriesSection } from "@/components/catalog/CategoriesSection";
import { Footer } from "@/components/catalog/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Store as StoreIcon } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Minus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useStoreTheme } from "@/hooks/useStoreTheme";
import { StoreHoursDisplay } from "@/components/catalog/StoreHoursDisplay";

const Index = () => {
  const { items, updateQuantity, removeItem, totalItems, totalPrice } = useCart();
  const { store, loading: storeLoading } = useStore();
  const navigate = useNavigate();
  
  // Apply store theme colors
  useStoreTheme();

  // Fetch featured products
  const { data: featuredProducts } = useQuery({
    queryKey: ["featured-products", store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("store_id", store.id)
        .eq("is_available", true)
        .eq("is_featured", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

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
            <Button onClick={() => navigate("/welcome")}>Ver PideAI</Button>
            <Button variant="outline" onClick={() => navigate("/create-store")}>Crear mi tienda</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      {/* Categories Horizontal Scroll */}
      <CategoriesSection />

      <div className="container mx-auto px-4">
        {/* Store Status - Mobile Only */}
        {store && (
          <div className="md:hidden py-4 flex justify-center">
            <StoreHoursDisplay storeId={store.id} forceStatus={store.force_status} />
          </div>
        )}
        
        {/* Featured Section */}
        {featuredProducts && featuredProducts.length > 0 && (
          <section className="mb-12">
            <div className="flex justify-between items-center pt-4 mb-6">
              <h2 className="text-2xl font-bold text-foreground">Destacados</h2>
            </div>

            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {featuredProducts.map((product) => (
                  <CarouselItem
                    key={product.id}
                    className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
                  >
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={Number(product.price)}
                      image_url={product.image_url}
                      description={product.description}
                      layout="grid"
                      compact={true}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
            </Carousel>
          </section>
        )}
        {/* All Products Section with Grid/List Toggle */}
        <section id="productos">
          <ProductGrid />
        </section>
      </div>

      {/* Footer */}
      <Footer />

      {/* Floating Cart Button with Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
          >
            <ShoppingCart className="h-6 w-6" />
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs">
                {totalItems}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Carrito de Compras</SheetTitle>
          </SheetHeader>

          <div className="mt-8 flex flex-col h-full">
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">Tu carrito está vacío</p>
                <p className="text-sm text-muted-foreground mt-2">Agrega productos para comenzar</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {items.map((item) => {
                    const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
                    const itemTotal = (item.price + extrasTotal) * item.quantity;

                    return (
                      <div key={item.cartItemId || item.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border bg-card">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0" />
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base">{item.name}</h4>

                          {/* Extras display */}
                          {item.extras && item.extras.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.extras.map((extra) => (
                                <p key={extra.id} className="text-xs text-muted-foreground">
                                  + {extra.name} <span className="font-medium">(${extra.price.toFixed(2)})</span>
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Price display */}
                          <div className="mt-1 sm:mt-2">
                            <p className="text-xs sm:text-sm font-semibold" style={{ color: `hsl(var(--price-color, var(--foreground)))` }}>
                              ${itemTotal.toFixed(2)}
                              {item.quantity > 1 && (
                                <span className="text-muted-foreground font-normal ml-1">
                                  (${(item.price + extrasTotal).toFixed(2)} c/u)
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Quantity controls */}
                          <div className="flex items-center gap-2 mt-2 sm:mt-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.cartItemId || item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 ml-auto"
                              onClick={() => removeItem(item.cartItemId || item.id)}
                              aria-label="Eliminar item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4 mt-4 space-y-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span style={{ color: `hsl(var(--price-color, var(--foreground)))` }}>${totalPrice.toFixed(2)}</span>
                  </div>

                  <Button className="w-full" size="lg" onClick={() => navigate("/checkout")}>
                    Realizar Pedido
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Index;
