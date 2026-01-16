import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart, CartItem } from './CartContext';
import { mockStore } from '@/test/mocks/supabase';
import * as secureStorage from '@/lib/secureStorage';

// Mock dependencies
vi.mock('@/lib/secureStorage');
vi.mock('@/contexts/StoreContext', () => ({
  useStore: () => ({
    store: mockStore,
    loading: false,
    isStoreOwner: false,
    reloadStore: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
  },
}));

vi.mock('@/lib/sentry-utils', () => ({
  trackCartOperation: vi.fn(),
  captureException: vi.fn(),
}));

describe('CartContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(secureStorage.getSecureItem).mockResolvedValue(null);
  });

  describe('generateCartItemId', () => {
    it('should return product id when no extras', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      await waitFor(() => {
        expect(result.current.items).toEqual([]);
      });

      const item: Omit<CartItem, 'quantity'> = {
        id: 'product-1',
        name: 'Pizza',
        price: 10,
        image_url: null,
      };

      act(() => {
        result.current.addItem(item);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].cartItemId).toBe('product-1');
      });
    });

    it('should generate unique id with extras', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const item: Omit<CartItem, 'quantity'> = {
        id: 'product-1',
        name: 'Pizza',
        price: 10,
        image_url: null,
        extras: [
          { id: 'extra-1', name: 'Cheese', price: 2 },
          { id: 'extra-2', name: 'Pepperoni', price: 3 },
        ],
      };

      act(() => {
        result.current.addItem(item);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
        // Should be product-1::extra-1,extra-2 (sorted)
        expect(result.current.items[0].cartItemId).toBe('product-1::extra-1,extra-2');
      });
    });

    it('should generate same id for same extras in different order', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const item1: Omit<CartItem, 'quantity'> = {
        id: 'product-1',
        name: 'Pizza',
        price: 10,
        image_url: null,
        extras: [
          { id: 'extra-2', name: 'Pepperoni', price: 3 },
          { id: 'extra-1', name: 'Cheese', price: 2 },
        ],
      };

      act(() => {
        result.current.addItem(item1);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].quantity).toBe(1);
      });

      const item2: Omit<CartItem, 'quantity'> = {
        id: 'product-1',
        name: 'Pizza',
        price: 10,
        image_url: null,
        extras: [
          { id: 'extra-1', name: 'Cheese', price: 2 },
          { id: 'extra-2', name: 'Pepperoni', price: 3 },
        ],
      };

      act(() => {
        result.current.addItem(item2);
      });

      // Should increment quantity instead of adding new item
      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].quantity).toBe(2);
      });
    });
  });

  describe('addItem', () => {
    it('should add item to cart', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const item: Omit<CartItem, 'quantity'> = {
        id: 'product-1',
        name: 'Pizza',
        price: 10,
        image_url: null,
      };

      act(() => {
        result.current.addItem(item);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0]).toMatchObject({
          id: 'product-1',
          name: 'Pizza',
          price: 10,
          quantity: 1,
        });
      });
    });

    it('should increment quantity if item already exists', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const item: Omit<CartItem, 'quantity'> = {
        id: 'product-1',
        name: 'Pizza',
        price: 10,
        image_url: null,
      };

      act(() => {
        result.current.addItem(item);
      });

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(1);
      });

      act(() => {
        result.current.addItem(item);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].quantity).toBe(2);
      });
    });

    it('should add item with extras as separate entry', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const item1: Omit<CartItem, 'quantity'> = {
        id: 'product-1',
        name: 'Pizza',
        price: 10,
        image_url: null,
      };

      const item2: Omit<CartItem, 'quantity'> = {
        id: 'product-1',
        name: 'Pizza',
        price: 10,
        image_url: null,
        extras: [{ id: 'extra-1', name: 'Cheese', price: 2 }],
      };

      act(() => {
        result.current.addItem(item1);
        result.current.addItem(item2);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const item: Omit<CartItem, 'quantity'> = {
        id: 'product-1',
        name: 'Pizza',
        price: 10,
        image_url: null,
      };

      act(() => {
        result.current.addItem(item);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      act(() => {
        result.current.removeItem('product-1');
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0);
      });
    });

    it('should remove correct item with extras', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const item1: Omit<CartItem, 'quantity'> = {
        id: 'product-1',
        name: 'Pizza',
        price: 10,
        image_url: null,
      };

      const item2: Omit<CartItem, 'quantity'> = {
        id: 'product-1',
        name: 'Pizza',
        price: 10,
        image_url: null,
        extras: [{ id: 'extra-1', name: 'Cheese', price: 2 }],
      };

      act(() => {
        result.current.addItem(item1);
        result.current.addItem(item2);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      // Remove item with extras
      act(() => {
        result.current.removeItem('product-1::extra-1');
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].extras).toBeUndefined();
      });
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const item: Omit<CartItem, 'quantity'> = {
        id: 'product-1',
        name: 'Pizza',
        price: 10,
        image_url: null,
      };

      act(() => {
        result.current.addItem(item);
      });

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(1);
      });

      act(() => {
        result.current.updateQuantity('product-1', 5);
      });

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(5);
      });
    });

    it('should remove item when quantity is 0 or less', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const item: Omit<CartItem, 'quantity'> = {
        id: 'product-1',
        name: 'Pizza',
        price: 10,
        image_url: null,
      };

      act(() => {
        result.current.addItem(item);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      act(() => {
        result.current.updateQuantity('product-1', 0);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0);
      });
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addItem({ id: '1', name: 'Item 1', price: 10, image_url: null });
        result.current.addItem({ id: '2', name: 'Item 2', price: 20, image_url: null });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      act(() => {
        result.current.clearCart();
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0);
      });
    });
  });

  describe('totalItems', () => {
    it('should calculate total items correctly', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addItem({ id: '1', name: 'Item 1', price: 10, image_url: null });
        result.current.addItem({ id: '1', name: 'Item 1', price: 10, image_url: null });
        result.current.addItem({ id: '2', name: 'Item 2', price: 20, image_url: null });
      });

      await waitFor(() => {
        expect(result.current.totalItems).toBe(3); // 2 + 1
      });
    });
  });

  describe('totalPrice', () => {
    it('should calculate total price without extras', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.addItem({ id: '1', name: 'Item 1', price: 10, image_url: null });
        result.current.addItem({ id: '1', name: 'Item 1', price: 10, image_url: null });
        result.current.addItem({ id: '2', name: 'Item 2', price: 20, image_url: null });
      });

      await waitFor(() => {
        expect(result.current.totalPrice).toBe(40); // (10 * 2) + (20 * 1)
      });
    });

    it('should calculate total price with extras', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const item: Omit<CartItem, 'quantity'> = {
        id: '1',
        name: 'Pizza',
        price: 10,
        image_url: null,
        extras: [
          { id: 'e1', name: 'Cheese', price: 2 },
          { id: 'e2', name: 'Pepperoni', price: 3 },
        ],
      };

      act(() => {
        result.current.addItem(item);
        result.current.addItem(item);
      });

      await waitFor(() => {
        // (10 + 2 + 3) * 2 = 30
        expect(result.current.totalPrice).toBe(30);
      });
    });
  });

  describe('localStorage persistence', () => {
    it('should save cart to secure storage when items change', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const item: Omit<CartItem, 'quantity'> = {
        id: 'product-1',
        name: 'Pizza',
        price: 10,
        image_url: null,
      };

      act(() => {
        result.current.addItem(item);
      });

      await waitFor(() => {
        expect(secureStorage.setSecureItem).toHaveBeenCalledWith('cart', expect.any(Array));
      });
    });

    it('should load cart from secure storage on mount', async () => {
      const savedCart: CartItem[] = [
        {
          id: 'product-1',
          name: 'Pizza',
          price: 10,
          quantity: 2,
          image_url: null,
          cartItemId: 'product-1',
        },
      ];

      vi.mocked(secureStorage.getSecureItem).mockResolvedValue(savedCart);

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      await waitFor(() => {
        expect(result.current.items).toEqual(savedCart);
        expect(result.current.totalItems).toBe(2);
      });
    });
  });
});
