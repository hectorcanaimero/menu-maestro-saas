import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, List, Search as SearchIcon, ArrowUpDown } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { SearchBar } from "./SearchBar";
import { useDebounce } from "@/hooks/useDebounce";

type SortOption = "default" | "price-asc" | "price-desc" | "name-asc" | "name-desc" | "newest";

export const ProductGrid = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const searchQuery = searchParams.get("search") || "";
  const sortParam = searchParams.get("sort") as SortOption || "default";
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [sortBy, setSortBy] = useState<SortOption>(sortParam);
  const debouncedSearchQuery = useDebounce(localSearchQuery, 400);
  const { store } = useStore();

  // Update URL when debounced search query changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (debouncedSearchQuery) {
      newParams.set("search", debouncedSearchQuery);
    } else {
      newParams.delete("search");
    }
    setSearchParams(newParams, { replace: true });
  }, [debouncedSearchQuery]);

  // Sync local search with URL on mount/category change
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Sync sort with URL
  useEffect(() => {
    setSortBy(sortParam);
  }, [sortParam]);

  // Update URL when sort changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (sortBy && sortBy !== "default") {
      newParams.set("sort", sortBy);
    } else {
      newParams.delete("sort");
    }
    setSearchParams(newParams, { replace: true });
  }, [sortBy]);

  const { data: products, isLoading } = useQuery({
    queryKey: ["menu-items", categoryFilter, debouncedSearchQuery, sortBy, store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from("menu_items")
        .select("*")
        .eq("store_id", store.id)
        .eq("is_available", true)
        .eq("is_featured", false);

      if (categoryFilter) {
        query = query.eq("category_id", categoryFilter);
      }

      // Add search filter with case-insensitive ILIKE
      if (debouncedSearchQuery) {
        query = query.or(
          `name.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%`
        );
      }

      // Apply sorting
      switch (sortBy) {
        case "price-asc":
          query = query.order("price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("price", { ascending: false });
          break;
        case "name-asc":
          query = query.order("name", { ascending: true });
          break;
        case "name-desc":
          query = query.order("name", { ascending: false });
          break;
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        default:
          query = query.order("display_order", { ascending: true });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
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

  const hasSearchQuery = debouncedSearchQuery.trim().length > 0;
  const noResults = !products || products.length === 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Search Bar */}
      <SearchBar
        value={localSearchQuery}
        onChange={setLocalSearchQuery}
        placeholder="Buscar por nombre o descripción..."
        className="w-full"
      />

      {/* Section Header with Sort and View Toggle */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              {categoryFilter ? "Productos" : "Todos los Productos"}
            </h2>
            {hasSearchQuery && (
              <p className="text-sm text-muted-foreground mt-1">
                Resultados para: "{debouncedSearchQuery}"
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-full h-9 md:h-8"
            >
              <LayoutGrid className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-full h-9 md:h-8"
            >
              <List className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Lista</span>
            </Button>
          </div>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-[240px] h-10 md:h-9 text-sm">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Orden predeterminado</SelectItem>
              <SelectItem value="price-asc">Precio: Menor a Mayor</SelectItem>
              <SelectItem value="price-desc">Precio: Mayor a Menor</SelectItem>
              <SelectItem value="name-asc">Nombre: A - Z</SelectItem>
              <SelectItem value="name-desc">Nombre: Z - A</SelectItem>
              <SelectItem value="newest">Más recientes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* No Results Message */}
      {noResults && (
        <div className="text-center py-12">
          <SearchIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          {hasSearchQuery ? (
            <>
              <p className="text-lg font-medium mb-2">No se encontraron productos</p>
              <p className="text-muted-foreground">
                No hay productos que coincidan con "{debouncedSearchQuery}"
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setLocalSearchQuery("")}
              >
                Limpiar búsqueda
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground text-lg">No hay productos disponibles en este momento.</p>
          )}
        </div>
      )}

      {/* Products Grid */}
      {!noResults && (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
              : "flex flex-col gap-3 sm:gap-4"
          }
        >
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
      )}
    </div>
  );
};
