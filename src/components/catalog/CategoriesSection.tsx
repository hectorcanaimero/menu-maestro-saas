import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { Star } from 'lucide-react';
import { useMemo } from 'react';
import posthog from 'posthog-js';
import { useScrollDirection } from '@/hooks/useScrollDirection';

// Helper function to create URL-friendly slugs
const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove consecutive hyphens
};

export const CategoriesSection = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategorySlug = searchParams.get('category');
  const showFeatured = searchParams.get('featured') === 'true';
  const { store } = useStore();
  const { scrollDirection, isAtTop } = useScrollDirection();

  // Fetch categories with product count
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories-with-products', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];

      // Get categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', store.id)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      if (!categoriesData) return [];

      // Get product counts per category (only available products)
      const { data: productsData, error: productsError } = await supabase
        .from('menu_items')
        .select('category_id')
        .eq('store_id', store.id)
        .eq('is_available', true);

      if (productsError) throw productsError;

      // Count products per category
      const productCounts = new Map<string, number>();
      productsData?.forEach((product) => {
        if (product.category_id) {
          const count = productCounts.get(product.category_id) || 0;
          productCounts.set(product.category_id, count + 1);
        }
      });

      // Filter categories that have at least one product
      return categoriesData.filter((category) => (productCounts.get(category.id) || 0) > 0);
    },
    enabled: !!store?.id,
  });

  // Check if there are featured products
  const { data: hasFeaturedProducts } = useQuery({
    queryKey: ['has-featured-products', store?.id],
    queryFn: async () => {
      if (!store?.id) return false;
      const { count, error } = await supabase
        .from('menu_items')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('is_available', true)
        .eq('is_featured', true);

      if (error) return false;
      return (count || 0) > 0;
    },
    enabled: !!store?.id,
  });

  // Create a map of slug -> category ID for lookup
  const categorySlugMap = useMemo(() => {
    if (!categories) return new Map();
    const map = new Map<string, string>();
    categories.forEach((cat) => {
      const slug = createSlug(cat.name);
      map.set(slug, cat.id);
    });
    return map;
  }, [categories]);

  // Get the selected category ID from the slug
  const selectedCategoryId = useMemo(() => {
    if (!selectedCategorySlug) return null;
    return categorySlugMap.get(selectedCategorySlug) || null;
  }, [selectedCategorySlug, categorySlugMap]);

  const handleCategoryClick = (categoryName: string, categoryId: string) => {
    const slug = createSlug(categoryName);
    if (selectedCategorySlug === slug) {
      setSearchParams({});
    } else {
      setSearchParams({ category: slug });

      // Track category_viewed event in PostHog
      try {
        if (store?.id) {
          posthog.capture('category_viewed', {
            store_id: store.id,
            store_name: store.name,
            category_id: categoryId,
            category_name: categoryName,
            category_slug: slug,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('[PostHog] Error tracking category_viewed:', error);
      }
    }
  };

  const handleFeaturedClick = () => {
    if (showFeatured) {
      setSearchParams({});
    } else {
      setSearchParams({ featured: 'true' });
    }
  };

  if (isLoading || !categories || categories.length === 0) {
    return null;
  }

  return (
    <section
      className={`sticky z-40 bg-background border-b border-border py-3 md:py-4 transition-all duration-300 ${
        scrollDirection === 'down' && !isAtTop ? 'top-14 shadow-md' : 'top-14 md:top-16'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide md:scrollbar-default" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          <Button
            variant={!selectedCategorySlug && !showFeatured ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchParams({})}
            className={`rounded-full whitespace-nowrap ${
              !selectedCategorySlug && !showFeatured
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted'
            }`}
          >
            Todos
          </Button>
          {hasFeaturedProducts && (
            <Button
              variant={showFeatured ? 'default' : 'outline'}
              size="sm"
              onClick={handleFeaturedClick}
              className={`rounded-full whitespace-nowrap ${
                showFeatured ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
              }`}
            >
              <Star className="w-4 h-4 mr-1" />
              Destacados
            </Button>
          )}
          {categories.map((category) => {
            const slug = createSlug(category.name);
            return (
              <Button
                key={category.id}
                variant={selectedCategorySlug === slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryClick(category.name, category.id)}
                className={`rounded-full whitespace-nowrap ${
                  selectedCategorySlug === slug ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                }`}
              >
                {category.name}
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
