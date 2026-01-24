import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from './ProductCard';
import { QuickViewModal } from './QuickViewModal';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutGrid, List, Search as SearchIcon, Loader2 } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { SearchBar } from './SearchBar';
import { useDebounce } from '@/hooks/useDebounce';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'newest';

const PRODUCTS_PER_PAGE = 12;

// Helper function to create URL-friendly slugs (same as CategoriesSection)
const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const ProductGrid = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get('category');
  const showFeatured = searchParams.get('featured') === 'true';
  const searchQuery = searchParams.get('search') || '';
  const sortParam = (searchParams.get('sort') as SortOption) || 'default';
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [sortBy, setSortBy] = useState<SortOption>(sortParam);
  const debouncedSearchQuery = useDebounce(localSearchQuery, 400);
  const { store } = useStore();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch categories to map slug to ID
  const { data: categories } = useQuery({
    queryKey: ['categories', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase.from('categories').select('*').eq('store_id', store.id);
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  // Get category ID from slug
  const categoryFilter = useMemo(() => {
    if (!categorySlug || !categories) return null;
    const category = categories.find((cat) => createSlug(cat.name) === categorySlug);
    return category?.id || null;
  }, [categorySlug, categories]);

  // Update URL when debounced search query changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (debouncedSearchQuery) {
      newParams.set('search', debouncedSearchQuery);
    } else {
      newParams.delete('search');
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
    if (sortBy && sortBy !== 'default') {
      newParams.set('sort', sortBy);
    } else {
      newParams.delete('sort');
    }
    setSearchParams(newParams, { replace: true });
  }, [sortBy]);

  // Fetch products with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['menu-items', categoryFilter, showFeatured, debouncedSearchQuery, sortBy, store?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!store?.id) return { products: [], hasMore: false };

      const from = pageParam * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE - 1;

      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_available', true)
        .range(from, to);

      if (showFeatured) {
        query = query.eq('is_featured', true);
      }

      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter);
      }

      // Add search filter with case-insensitive ILIKE
      if (debouncedSearchQuery) {
        query = query.or(`name.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'name-asc':
          query = query.order('name', { ascending: true });
          break;
        case 'name-desc':
          query = query.order('name', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('display_order', { ascending: true });
      }

      const { data: products, error } = await query;
      if (error) throw error;

      // Check if there are more products to load
      const hasMore = products && products.length === PRODUCTS_PER_PAGE;

      return { products: products || [], hasMore };
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    enabled: !!store?.id,
    initialPageParam: 0,
  });

  // Flatten all pages into a single array
  const products = data?.pages.flatMap((page) => page.products) || [];

  // Intersection Observer to trigger loading more products
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before reaching the bottom
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
      {/* <SearchBar
        value={localSearchQuery}
        onChange={setLocalSearchQuery}
        placeholder="Buscar por nombre o descripción..."
        className="w-full"
      /> */}

      {/* Section Header with Sort and View Toggle */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-end sm:items-center gap-3">
          <div>
            {hasSearchQuery && (
              <p className="text-sm text-muted-foreground mt-1">Resultados para: "{debouncedSearchQuery}"</p>
            )}
          </div>
          <div className="flex justify-content-between gap-2 w-full">
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
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-full h-9 md:h-8"
            >
              <LayoutGrid className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-full h-9 md:h-8"
            >
              <List className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Lista</span>
            </Button>
          </div>
        </div>
      </div>

      {/* No Results Message */}
      {noResults && (
        <div className="text-center py-12">
          <SearchIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          {hasSearchQuery ? (
            <>
              <p className="text-lg font-medium mb-2">No se encontraron productos</p>
              <p className="text-muted-foreground">No hay productos que coincidan con "{debouncedSearchQuery}"</p>
              <Button variant="outline" className="mt-4" onClick={() => setLocalSearchQuery('')}>
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
        <>
          <QuickViewModal />
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'
                : 'flex flex-col gap-3 sm:gap-4'
            }
          >
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={Number(product.price)}
                image_url={product.image_url}
                description={product.description}
                layout={viewMode}
                categoryId={product.category_id}
                index={index}
                allProducts={products.map((p) => ({
                  id: p.id,
                  name: p.name,
                  price: Number(p.price),
                  image_url: p.image_url,
                  description: p.description,
                  categoryId: p.category_id,
                }))}
              />
            ))}
          </div>

          {/* Infinite Scroll Trigger & Loading Indicator */}
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Cargando más productos...</span>
              </div>
            )}
            {!hasNextPage && products.length > 0 && (
              <p className="text-sm text-muted-foreground">No hay más productos para mostrar</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
