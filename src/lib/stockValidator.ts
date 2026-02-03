import { supabase } from '@/integrations/supabase/client';

/**
 * Validates if there's enough stock for a product
 * ONLY APPLIES TO NON-FOOD STORES (is_food_business = false)
 * @param productId - The product ID to check
 * @param requestedQuantity - The quantity the user wants to order
 * @returns Object with isValid, availableStock, and message
 */
export async function validateStock(
  productId: string,
  requestedQuantity: number
): Promise<{
  isValid: boolean;
  availableStock: number | null;
  message?: string;
}> {
  try {
    // Fetch product stock information and store type
    const { data: product, error } = await supabase
      .from('menu_items')
      .select(`
        track_stock,
        stock_quantity,
        name,
        stores!inner (
          is_food_business
        )
      `)
      .eq('id', productId)
      .single();

    if (error || !product) {
      return {
        isValid: false,
        availableStock: null,
        message: 'No se pudo verificar el inventario del producto',
      };
    }

    // IMPORTANT: Stock validation ONLY applies to non-food stores
    // Food stores (is_food_business = true) always allow orders regardless of stock
    const isFoodStore = (product as any).stores?.is_food_business ?? true;

    if (isFoodStore) {
      // Food stores always pass validation
      return {
        isValid: true,
        availableStock: null,
      };
    }

    // For non-food stores, check if stock tracking is enabled
    if (!product.track_stock) {
      return {
        isValid: true,
        availableStock: null,
      };
    }

    // If stock is null or undefined, treat as unlimited
    if (product.stock_quantity === null || product.stock_quantity === undefined) {
      return {
        isValid: true,
        availableStock: null,
      };
    }

    const availableStock = product.stock_quantity;

    // Check if product is out of stock
    if (availableStock <= 0) {
      return {
        isValid: false,
        availableStock: 0,
        message: `${product.name} está agotado`,
      };
    }

    // Check if requested quantity exceeds available stock
    if (requestedQuantity > availableStock) {
      return {
        isValid: false,
        availableStock,
        message: `Solo quedan ${availableStock} unidades de ${product.name}`,
      };
    }

    // Stock is sufficient
    return {
      isValid: true,
      availableStock,
    };
  } catch (error) {
    console.error('Error validating stock:', error);
    return {
      isValid: false,
      availableStock: null,
      message: 'Error al verificar el inventario',
    };
  }
}

/**
 * Validates stock for multiple cart items
 * Returns array of validation results for each item
 */
export async function validateCartStock(
  items: Array<{ id: string; quantity: number; name: string }>
): Promise<
  Array<{
    productId: string;
    productName: string;
    isValid: boolean;
    availableStock: number | null;
    requestedQuantity: number;
    message?: string;
  }>
> {
  const validations = await Promise.all(
    items.map(async (item) => {
      const result = await validateStock(item.id, item.quantity);
      return {
        productId: item.id,
        productName: item.name,
        isValid: result.isValid,
        availableStock: result.availableStock,
        requestedQuantity: item.quantity,
        message: result.message,
      };
    })
  );

  return validations;
}
