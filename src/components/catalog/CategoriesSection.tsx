import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";

export const CategoriesSection = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const { store } = useStore();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("store_id", store.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSearchParams({});
    } else {
      setSearchParams({ category: categoryId });
    }
  };

  if (isLoading || !categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="sticky top-16 z-40 bg-background border-b border-border py-4">
      <div className="container mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            size="sm"
            onClick={() => setSearchParams({})}
            className={`rounded-full whitespace-nowrap ${
              !selectedCategory 
                ? "bg-primary text-primary-foreground" 
                : "bg-background hover:bg-muted"
            }`}
          >
            Todos
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryClick(category.id)}
              className={`rounded-full whitespace-nowrap ${
                selectedCategory === category.id 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-background hover:bg-muted"
              }`}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};
