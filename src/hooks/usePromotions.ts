import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
  product_ids: string[] | null;
  category_ids: string[] | null;
}

/**
 * Hook to fetch active promotions for the current store
 * Automatically filters by:
 * - is_active = true
 * - start_date <= now (or null)
 * - end_date > now (or null)
 */
export function usePromotions() {
  const { store } = useStore();

  return useQuery({
    queryKey: ['promotions', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gt.${now}`);

      if (error) {
        console.error('Error fetching promotions:', error);
        throw error;
      }

      return (data || []) as Promotion[];
    },
    enabled: !!store?.id,
  });
}

/**
 * Get applicable promotions for a specific product
 */
export function useProductPromotions(productId: string, categoryId?: string | null) {
  const { data: promotions } = usePromotions();

  if (!promotions) return [];

  return promotions.filter((promo) => {
    // Store-wide promotion (no product_ids or category_ids)
    if (
      (!promo.product_ids || promo.product_ids.length === 0) &&
      (!promo.category_ids || promo.category_ids.length === 0)
    ) {
      return true;
    }

    // Product-specific promotion
    if (promo.product_ids && promo.product_ids.includes(productId)) {
      return true;
    }

    // Category-specific promotion
    if (categoryId && promo.category_ids && promo.category_ids.includes(categoryId)) {
      return true;
    }

    return false;
  });
}

/**
 * Calculate the best discount for a product
 * Returns the promotion with the highest discount value
 */
export function getBestPromotion(
  promotions: Promotion[],
  originalPrice: number
): { promotion: Promotion; discountedPrice: number; savings: number } | null {
  if (!promotions || promotions.length === 0) return null;

  let bestPromotion: Promotion | null = null;
  let maxSavings = 0;

  for (const promo of promotions) {
    let savings = 0;
    if (promo.type === 'percentage') {
      savings = (originalPrice * promo.value) / 100;
    } else {
      savings = promo.value;
    }

    if (savings > maxSavings) {
      maxSavings = savings;
      bestPromotion = promo;
    }
  }

  if (!bestPromotion) return null;

  const discountedPrice = Math.max(0, originalPrice - maxSavings);

  return {
    promotion: bestPromotion,
    discountedPrice,
    savings: maxSavings,
  };
}
