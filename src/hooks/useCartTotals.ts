import { usePromotions, useProductPromotions, getBestPromotion } from './usePromotions';

interface CartItemExtra {
  id: string;
  name: string;
  price: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  extras?: CartItemExtra[];
  cartItemId?: string;
  categoryId?: string | null;
}

/**
 * Calculate cart totals with promotions applied
 */
export function useCartTotals(items: CartItem[]) {
  const { data: allPromotions } = usePromotions();

  const calculateItemTotal = (item: CartItem) => {
    const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
    const basePrice = item.price + extrasTotal;

    // Find applicable promotions for this product
    if (!allPromotions) {
      return {
        originalPrice: basePrice * item.quantity,
        discountedPrice: basePrice * item.quantity,
        savings: 0,
      };
    }

    const productPromotions = allPromotions.filter((promo) => {
      // Store-wide promotion
      if (
        (!promo.product_ids || promo.product_ids.length === 0) &&
        (!promo.category_ids || promo.category_ids.length === 0)
      ) {
        return true;
      }

      // Product-specific promotion
      if (promo.product_ids && promo.product_ids.includes(item.id)) {
        return true;
      }

      // Category-specific promotion
      if (
        item.categoryId &&
        promo.category_ids &&
        promo.category_ids.includes(item.categoryId)
      ) {
        return true;
      }

      return false;
    });

    const bestDeal = getBestPromotion(productPromotions, item.price);

    if (bestDeal) {
      const discountedBasePrice = bestDeal.discountedPrice + extrasTotal;
      return {
        originalPrice: basePrice * item.quantity,
        discountedPrice: discountedBasePrice * item.quantity,
        savings: (basePrice - discountedBasePrice) * item.quantity,
      };
    }

    return {
      originalPrice: basePrice * item.quantity,
      discountedPrice: basePrice * item.quantity,
      savings: 0,
    };
  };

  const totals = items.reduce(
    (acc, item) => {
      const itemTotals = calculateItemTotal(item);
      return {
        originalTotal: acc.originalTotal + itemTotals.originalPrice,
        discountedTotal: acc.discountedTotal + itemTotals.discountedPrice,
        totalSavings: acc.totalSavings + itemTotals.savings,
      };
    },
    { originalTotal: 0, discountedTotal: 0, totalSavings: 0 }
  );

  return totals;
}
