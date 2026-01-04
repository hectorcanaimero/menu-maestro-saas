import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import posthog from 'posthog-js';
import { useStore } from './StoreContext';
import { setSecureItem, getSecureItem, removeSecureItem } from '@/lib/secureStorage';
import { trackCartOperation, captureException } from '@/lib/sentry-utils';

export interface CartItemExtra {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  extras?: CartItemExtra[];
  cartItemId?: string; // Unique ID for cart items with different extras
  categoryId?: string | null; // Category ID for promotion calculation
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { store } = useStore();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true);

  // Load encrypted cart on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await getSecureItem<CartItem[]>('cart');

        if (savedCart && Array.isArray(savedCart)) {
          setItems(savedCart);
        }
      } catch (error) {
        // Track cart loading error in Sentry
        captureException(error as Error, {
          tags: { context: 'cart_load' },
          extra: { message: 'Failed to load cart from secure storage' },
          level: 'warning',
        });
        // Fail silently - start with empty cart
      } finally {
        setIsLoadingCart(false);
      }
    };

    loadCart();
  }, []);

  // Save encrypted cart whenever items change
  useEffect(() => {
    // Don't save until initial load is complete
    if (isLoadingCart) {
      return;
    }

    const saveCart = async () => {
      try {
        if (items.length > 0) {
          await setSecureItem('cart', items);
        } else {
          // Remove cart if empty
          removeSecureItem('cart');
        }
      } catch (error) {
        // Capture exception in Sentry
        captureException(error as Error, {
          tags: { context: 'cart_save' },
          extra: {
            items_count: items.length,
            error_message: (error as Error).message,
          },
          level: 'warning',
        });
        // Fail silently - don't disrupt user experience
      }
    };

    saveCart();
  }, [items, isLoadingCart]);

  const generateCartItemId = (productId: string, extras?: CartItemExtra[]): string => {
    if (!extras || extras.length === 0) {
      return productId;
    }
    // Sort extras by ID to ensure deterministic order
    const sortedExtrasIds = extras
      .map((e) => e.id)
      .sort()
      .join(',');
    return `${productId}::${sortedExtrasIds}`;
  };

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    try {
      setItems((current) => {
        // Create unique cart item ID based on product and sorted extras IDs
        const cartItemId = item.cartItemId || generateCartItemId(item.id, item.extras);

        const itemWithId = { ...item, cartItemId };

        const existing = current.find((i) => i.cartItemId === cartItemId);

        // Track event in PostHog
        try {
          const extrasPrice = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
          const totalPrice = item.price + extrasPrice;

          // Calculate total cart value (including current cart + new item)
          const currentCartValue = current.reduce((sum, cartItem) => {
            const itemExtrasPrice = cartItem.extras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
            return sum + (cartItem.price + itemExtrasPrice) * cartItem.quantity;
          }, 0);

          // Add the new item to cart value
          const newItemValue = totalPrice * (existing ? existing.quantity + 1 : 1);
          const updatedCartValue = existing
            ? currentCartValue + totalPrice // Add one more unit of existing item
            : currentCartValue + newItemValue; // Add new item

          posthog.capture('product_added_to_cart', {
            store_id: store?.id,
            product_id: item.id,
            product_name: item.name,
            product_price: item.price,
            extras_count: item.extras?.length || 0,
            extras_price: extrasPrice,
            total_price: totalPrice,
            category_id: item.categoryId,
            has_extras: (item.extras?.length || 0) > 0,
            quantity: existing ? existing.quantity + 1 : 1,
            cart_value: updatedCartValue,
            items_in_cart: existing ? current.length : current.length + 1,
          });
        } catch (error) {
          return error;
        }

        // Track in Sentry with breadcrumb
        try {
          trackCartOperation('add', item.id, {
            product_name: item.name,
            price: item.price,
            has_extras: (item.extras?.length || 0) > 0,
            extras_count: item.extras?.length || 0,
          });
        } catch (error) {
          return error;
        }

        let newCart: CartItem[];
        if (existing) {
          newCart = current.map((i) => (i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i));
          toast.success('Producto agregado al carrito');
        } else {
          newCart = [...current, { ...itemWithId, quantity: 1 }];
          toast.success('Producto agregado al carrito');
        }

        return newCart;
      });
    } catch (error) {
      toast.error('Error al agregar producto al carrito');

      // Capture exception in Sentry
      captureException(error as Error, {
        tags: { context: 'cart_add_item' },
        extra: {
          item,
          current_items_count: items.length,
          error_message: (error as Error).message,
        },
        level: 'error',
      });
    }
  };

  const removeItem = (cartItemId: string) => {
    try {
      setItems((current) => {
        const itemToRemove = current.find((item) => item.cartItemId === cartItemId);

        if (itemToRemove) {
          // Track event in PostHog
          try {
            const extrasPrice = itemToRemove.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
            const totalPrice = (itemToRemove.price + extrasPrice) * itemToRemove.quantity;

            posthog.capture('product_removed_from_cart', {
              store_id: store?.id,
              product_id: itemToRemove.id,
              product_name: itemToRemove.name,
              product_price: itemToRemove.price,
              quantity: itemToRemove.quantity,
              extras_count: itemToRemove.extras?.length || 0,
              extras_price: extrasPrice,
              total_price: totalPrice,
              category_id: itemToRemove.categoryId,
            });
          } catch (error) {
            return error;
          }

          // Track in Sentry with breadcrumb
          try {
            trackCartOperation('remove', itemToRemove.id, {
              product_name: itemToRemove.name,
              quantity: itemToRemove.quantity,
            });
          } catch (error) {
            return error;
          }
        }

        const newCart = current.filter((item) => item.cartItemId !== cartItemId);

        return newCart;
      });
      toast.success('Producto eliminado del carrito');
    } catch (error) {
      toast.error('Error al eliminar producto del carrito');

      // Capture exception in Sentry
      captureException(error as Error, {
        tags: { context: 'cart_remove_item' },
        extra: {
          cartItemId,
          error_message: (error as Error).message,
        },
        level: 'error',
      });
    }
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }

    try {
      setItems((current) => {
        const item = current.find((i) => i.cartItemId === cartItemId);

        if (item) {
          // Track in Sentry with breadcrumb
          try {
            trackCartOperation('update', item.id, {
              product_name: item.name,
              old_quantity: item.quantity,
              new_quantity: quantity,
            });
          } catch (error) {
            return error;
          }
        }

        const updatedItems = current.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity } : item));

        return updatedItems;
      });
    } catch (error) {
      toast.error('Error al actualizar cantidad');

      // Capture exception in Sentry
      captureException(error as Error, {
        tags: { context: 'cart_update_quantity' },
        extra: {
          cartItemId,
          quantity,
          error_message: (error as Error).message,
        },
        level: 'error',
      });
    }
  };

  const clearCart = () => {
    try {
      // Track cart clear in Sentry
      trackCartOperation('clear', undefined, {
        items_count: items.length,
        cart_value: totalPrice,
      });

      setItems([]);
      removeSecureItem('cart');
    } catch (error) {
      // Capture exception in Sentry
      captureException(error as Error, {
        tags: { context: 'cart_clear' },
        extra: {
          items_count: items.length,
          error_message: (error as Error).message,
        },
        level: 'error',
      });
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const extrasPrice = item.extras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
    return sum + (item.price + extrasPrice) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
