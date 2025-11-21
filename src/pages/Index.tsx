import { Header } from "@/components/catalog/Header";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CategoriesSection } from "@/components/catalog/CategoriesSection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Minus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const { items, updateQuantity, removeItem, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();

  // Fetch featured products (first 3)
  const { data: featuredProducts } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_available", true)
        .order("display_order", { ascending: true })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      {/* Categories Horizontal Scroll */}
      <CategoriesSection />

      <div className="container mx-auto px-4">
        {/* Featured Section */}
        {featuredProducts && featuredProducts.length > 0 && (
          <section className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-foreground">Destacados</h2>
              <Button variant="ghost" size="sm" className="text-primary">
                Ver todo
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={Number(product.price)}
                  image_url={product.image_url}
                  description={product.description}
                  layout="list"
                  compact
                />
              ))}
            </div>
          </section>
        )}
      </div>
      {/* All Products Section with Grid/List Toggle */}
      <section id="productos">
        <ProductGrid />
      </section>

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
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 rounded-lg border bg-card">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover rounded" />
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-foreground font-semibold mt-1">${item.price.toFixed(2)}</p>

                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 ml-auto"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mt-4 space-y-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-foreground">${totalPrice.toFixed(2)}</span>
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
