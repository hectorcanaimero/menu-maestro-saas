import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Utensils, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import ensaladaCesar from "@/assets/ensalada-cesar.jpg";
import carpaccio from "@/assets/carpaccio.jpg";
import filetMignon from "@/assets/filet-mignon.jpg";
import salmon from "@/assets/salmon.jpg";
import tiramisu from "@/assets/tiramisu.jpg";
import cheesecake from "@/assets/cheesecake.jpg";

// Map item names to images
const imageMap: Record<string, string> = {
  "Ensalada César": ensaladaCesar,
  "Carpaccio de Res": carpaccio,
  "Filete Mignon": filetMignon,
  "Salmón Glaseado": salmon,
  "Tiramisú Clásico": tiramisu,
  "Cheesecake de Frutos Rojos": cheesecake,
};

export const MenuSection = () => {
  const { addItem } = useCart();
  
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: menuItems } = useQuery({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const getItemsByCategory = (categoryId: string) => {
    return menuItems?.filter((item) => item.category_id === categoryId) || [];
  };

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-primary/10 rounded-full">
            <Utensils className="w-4 h-4 text-primary" />
            <span className="text-primary font-semibold text-sm tracking-wider uppercase">
              Nuestro Menú
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Menú <span className="bg-gradient-gold bg-clip-text text-transparent">Degustación</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explora nuestra selección de platillos cuidadosamente preparados
          </p>
        </div>

        <Tabs defaultValue={categories?.[0]?.id} className="w-full">
          <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-2 md:grid-cols-4 mb-12 h-auto bg-card border border-border shadow-card-custom">
            {categories?.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="data-[state=active]:bg-gradient-gold data-[state=active]:text-white py-3"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories?.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {getItemsByCategory(category.id).map((item) => (
                  <Card
                    key={item.id}
                    className="group overflow-hidden hover:shadow-elegant transition-all duration-300 border-border/50 hover:border-primary/30"
                  >
                    <div className="flex gap-4 p-6">
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={imageMap[item.name] || ensaladaCesar}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-elegant-dark/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                          <span className="text-2xl font-bold text-primary">
                            ${item.price}
                          </span>
                          {item.is_available ? (
                            <Button
                              size="sm"
                              onClick={() => addItem({
                                id: item.id,
                                name: item.name,
                                price: item.price,
                                image_url: imageMap[item.name] || item.image_url,
                              })}
                              className="gap-2"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Agregar
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                              No disponible
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};
