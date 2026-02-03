import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { CartItem } from '@/contexts/CartContext';

interface StockValidationItem {
  menu_item_id: string;
  name: string;
  requested: number;
  available: number;
}

interface StockValidationResult {
  valid: boolean;
  items: StockValidationItem[];
}

/**
 * Hook for validating cart items against available stock.
 * Only validates for non-food stores with stock tracking enabled.
 */
export function useStockValidation() {
  const { store } = useStore();

  /**
   * Validates that all cart items have sufficient stock.
   * Returns { valid: true } if all items pass, or { valid: false, items: [...] }
   * with the list of items that have insufficient stock.
   */
  const validateStock = async (items: CartItem[]): Promise<StockValidationResult> => {
    // Skip validation for food businesses (they don't track stock)
    if (!store?.id || store.is_food_business) {
      return { valid: true, items: [] };
    }

    // No items to validate
    if (items.length === 0) {
      return { valid: true, items: [] };
    }

    try {
      // Prepare cart items for RPC call
      const cartItems = items.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity
      }));

      // Call the RPC function to validate stock
      const { data, error } = await supabase.rpc('validate_cart_stock', {
        p_store_id: store.id,
        p_items: cartItems
      });

      if (error) {
        console.error('Stock validation error:', error);
        // Fail open - don't block checkout on validation errors
        return { valid: true, items: [] };
      }

      return data as StockValidationResult;
    } catch (error) {
      console.error('Stock validation exception:', error);
      // Fail open - don't block checkout on exceptions
      return { valid: true, items: [] };
    }
  };

  /**
   * Check if a single product has sufficient stock for the requested quantity.
   * Returns the available stock if tracking is enabled, or null if not tracked.
   */
  const checkProductStock = async (
    productId: string,
    requestedQuantity: number
  ): Promise<{ sufficient: boolean; available: number | null }> => {
    // Skip for food businesses
    if (!store?.id || store.is_food_business) {
      return { sufficient: true, available: null };
    }

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('track_stock, stock_quantity')
        .eq('id', productId)
        .single();

      if (error || !data) {
        return { sufficient: true, available: null };
      }

      // If not tracking stock, always sufficient
      if (!data.track_stock || data.stock_quantity === null) {
        return { sufficient: true, available: null };
      }

      return {
        sufficient: data.stock_quantity >= requestedQuantity,
        available: data.stock_quantity
      };
    } catch (error) {
      console.error('Product stock check error:', error);
      return { sufficient: true, available: null };
    }
  };

  return {
    validateStock,
    checkProductStock,
    isStockEnabled: store?.is_food_business === false
  };
}
