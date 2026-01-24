import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/contexts/StoreContext';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'react-router-dom';

// Helper function to create URL-friendly slugs
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

export const FeaturedProducts = () => {
  const { store } = useStore();
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");
  const showFeatured = searchParams.get("featured") === "true";
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Hide carousel when a category is selected OR when viewing featured filter
  // Only show when: viewing all products (no filters)
  const shouldShowCarousel = !categorySlug && !showFeatured;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'start',
      slidesToScroll: 1,
      breakpoints: {
        '(min-width: 768px)': { slidesToScroll: 1 },
      },
    },
    [
      Autoplay({
        delay: 3000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    ],
  );

  // Fetch categories to map slug to ID (only when needed)
  const { data: categories } = useQuery({
    queryKey: ['categories', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', store.id);
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id && !!categorySlug && !showFeatured,
  });

  // Get category ID from slug
  const selectedCategoryId = useMemo(() => {
    if (!categorySlug || !categories || showFeatured) return null;
    const category = categories.find(cat => createSlug(cat.name) === categorySlug);
    return category?.id || null;
  }, [categorySlug, categories, showFeatured]);

  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ['featured-menu-items', store?.id, selectedCategoryId, showFeatured],
    queryFn: async () => {
      if (!store?.id) return [];

      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_available', true)
        .eq('is_featured', true);

      // If a specific category is selected (not "featured" filter), filter by category
      if (selectedCategoryId && !showFeatured) {
        query = query.eq('category_id', selectedCategoryId);
      }

      query = query.order('display_order', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id && shouldShowCarousel,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  // Don't render if:
  // 1. Shouldn't show carousel (category selected OR featured filter active)
  // 2. No featured products
  if (!shouldShowCarousel) {
    return null;
  }

  if (!isLoading && (!featuredProducts || featuredProducts.length === 0)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4 mb-4">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2">
        {/* Navigation Buttons - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={scrollNext}
            disabled={!canScrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 sm:gap-4">
          {featuredProducts?.map((product, index) => (
            <div
              key={product.id}
              className="flex-[0_0_65%] sm:flex-[0_0_48%] md:flex-[0_0_32%] lg:flex-[0_0_24%] min-w-0"
            >
              <ProductCard
                id={product.id}
                name={product.name}
                price={Number(product.price)}
                image_url={product.image_url}
                description={product.description}
                layout="grid"
                categoryId={product.category_id}
                isAvailable={product.is_available ?? true}
                index={index}
                allProducts={featuredProducts.map((p) => ({
                  id: p.id,
                  name: p.name,
                  price: Number(p.price),
                  image_url: p.image_url,
                  description: p.description,
                  categoryId: p.category_id,
                  isAvailable: p.is_available ?? true,
                }))}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
