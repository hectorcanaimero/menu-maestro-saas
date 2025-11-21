import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

export const ProductGrid = () => {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: products, isLoading } = useQuery({
    queryKey: ["menu-items", categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from("menu_items")
        .select("*")
        .eq("is_available", true)
        .order("display_order", { ascending: true });

      if (categoryFilter) {
        query = query.eq("category_id", categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No hay productos disponibles en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header with View Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">
          {categoryFilter ? "Productos" : "Todos los Productos"}
        </h2>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-full"
          >
            <LayoutGrid className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Grid</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-full"
          >
            <List className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Lista</span>
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <div className={viewMode === "grid" 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
        : "flex flex-col gap-4"
      }>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            price={Number(product.price)}
            image_url={product.image_url}
            description={product.description}
            layout={viewMode}
          />
        ))}
      </div>
    </div>
  );
};
