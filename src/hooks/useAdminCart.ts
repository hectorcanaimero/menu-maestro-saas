/**
 * Admin Cart Hook
 *
 * Temporary cart management for admin when creating orders manually.
 * Similar to CartContext but isolated for admin use.
 */

import { useState, useCallback } from 'react';

export interface AdminCartItemExtra {
  id: string;
  name: string;
  price: number;
}

export interface AdminCartItem {
  id: string; // menu_item_id
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  extras?: AdminCartItemExtra[];
  cartItemId?: string; // Unique ID for cart items with different extras
  categoryId?: string | null;
}

/**
 * Generate a unique cart item ID based on product and extras
 */
const generateCartItemId = (productId: string, extras?: AdminCartItemExtra[]): string => {
  if (!extras || extras.length === 0) {
    return productId;
  }
  // Sort extras by ID to ensure deterministic order
  const sortedExtrasIds = extras
    .map(e => e.id)
    .sort()
    .join(',');
  return `${productId}::${sortedExtrasIds}`;
};

/**
 * Custom hook for managing admin cart
 */
export const useAdminCart = () => {
  const [items, setItems] = useState<AdminCartItem[]>([]);

  /**
   * Add item to cart or increment quantity if it exists
   */
  const addItem = useCallback((item: Omit<AdminCartItem, 'quantity'>) => {
    setItems((current) => {
      const cartItemId = item.cartItemId || generateCartItemId(item.id, item.extras);
      const itemWithId = { ...item, cartItemId };

      const existingIndex = current.findIndex((i) => i.cartItemId === cartItemId);

      if (existingIndex !== -1) {
        // Item exists, increment quantity
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }

      // New item
      return [...current, { ...itemWithId, quantity: 1 }];
    });
  }, []);

  /**
   * Remove item from cart completely
   */
  const removeItem = useCallback((cartItemId: string) => {
    setItems((current) => current.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  /**
   * Update quantity of an item
   */
  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) => current.filter((item) => item.cartItemId !== cartItemId));
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      )
    );
  }, []);

  /**
   * Clear entire cart
   */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /**
   * Calculate total number of items
   */
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  /**
   * Calculate total price including extras
   */
  const totalPrice = items.reduce((sum, item) => {
    const extrasPrice = item.extras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
    return sum + (item.price + extrasPrice) * item.quantity;
  }, 0);

  /**
   * Calculate subtotal (base price without extras)
   */
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  /**
   * Calculate total extras price
   */
  const extrasTotal = items.reduce((sum, item) => {
    const extrasPrice = item.extras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
    return sum + extrasPrice * item.quantity;
  }, 0);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    subtotal,
    extrasTotal,
  };
};
