import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom";

export const CategoriesSection = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
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
