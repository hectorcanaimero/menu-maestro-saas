import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import posthog from "posthog-js";
import { useStore } from "./StoreContext";
import { setSecureItem, getSecureItem, removeSecureItem } from "@/lib/secureStorage";
import { trackCartOperation, captureException } from "@/lib/sentry-utils";

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
  addItem: (item: Omit<CartItem, "quantity">) => void;
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
      console.log('📦 [CartContext] ========== LOAD CART START ==========');
      try {
        const savedCart = await getSecureItem<CartItem[]>('cart');
        console.log('[CartContext] Retrieved from storage:', savedCart ? 'YES' : 'NO');

        if (savedCart && Array.isArray(savedCart)) {
          console.log('[CartContext] Loaded cart items:', savedCart.length);
          console.log('[CartContext] Cart data:', JSON.stringify(savedCart, null, 2));
          setItems(savedCart);
          console.log('[CartContext] ✅ Cart loaded successfully');
        } else {
          console.log('[CartContext] No saved cart found or invalid format');
        }
      } catch (error) {
        console.error('❌ [CartContext] Error loading cart:', error);
        console.error('[CartContext] Error details:', (error as Error).stack);

        // Track cart loading error in Sentry
        captureException(error as Error, {
          tags: { context: 'cart_load' },
          extra: { message: 'Failed to load cart from secure storage' },
          level: 'warning',
        });
        // Fail silently - start with empty cart
        console.log('[CartContext] Starting with empty cart due to error');
      } finally {
        setIsLoadingCart(false);
        console.log('📦 [CartContext] ========== LOAD CART END ==========');
      }
    };

    loadCart();
  }, []);

  // Save encrypted cart whenever items change
  useEffect(() => {
    // Don't save until initial load is complete
    if (isLoadingCart) {
      console.log('💾 [CartContext] Skipping save - cart still loading');
      return;
    }

    const saveCart = async () => {
      try {
        console.log('💾 [CartContext] ========== SAVE CART START ==========');
        console.log('[CartContext] Items to save:', items.length);
        console.log('[CartContext] Cart data:', JSON.stringify(items, null, 2));

        if (items.length > 0) {
          await setSecureItem('cart', items);
          console.log('[CartContext] ✅ Cart saved to secure storage');
        } else {
          // Remove cart if empty
          removeSecureItem('cart');
          console.log('[CartContext] ✅ Empty cart removed from storage');
        }
        console.log('💾 [CartContext] ========== SAVE CART END ==========');
      } catch (error) {
        console.error('❌ [CartContext] Error saving cart:', error);
        console.error('[CartContext] Error details:', (error as Error).stack);

        // Capture exception in Sentry
        captureException(error as Error, {
          tags: { context: 'cart_save' },
          extra: {
            items_count: items.length,
            error_message: (error as Error).message
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
      .map(e => e.id)
      .sort()
      .join(',');
    return `${productId}::${sortedExtrasIds}`;
  };

  const addItem = (item: Omit<CartItem, "quantity">) => {
    console.log('🛒 [CartContext] ========== ADD TO CART START ==========');
    console.log('[CartContext] Item to add:', JSON.stringify(item, null, 2));
    console.log('[CartContext] Current items count:', items.length);

    try {
      setItems((current) => {
        console.log('[CartContext] Current cart state:', JSON.stringify(current, null, 2));

        // Create unique cart item ID based on product and sorted extras IDs
        const cartItemId = item.cartItemId || generateCartItemId(item.id, item.extras);
        console.log('[CartContext] Generated cartItemId:', cartItemId);

        const itemWithId = { ...item, cartItemId };
        console.log('[CartContext] Item with ID:', JSON.stringify(itemWithId, null, 2));

        const existing = current.find((i) => i.cartItemId === cartItemId);
        console.log('[CartContext] Existing item found:', existing ? 'YES' : 'NO');
        if (existing) {
          console.log('[CartContext] Existing item details:', JSON.stringify(existing, null, 2));
        }

        // Track event in PostHog
        try {
          const extrasPrice = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
          const totalPrice = item.price + extrasPrice;
          console.log('[CartContext] Price calculation - Base:', item.price, 'Extras:', extrasPrice, 'Total:', totalPrice);

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

          console.log('[CartContext] Cart value - Current:', currentCartValue, 'Updated:', updatedCartValue);

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
          console.log('[CartContext] ✅ PostHog event captured successfully');
        } catch (error) {
          console.error('[CartContext] ❌ PostHog error:', error);
        }

        // Track in Sentry with breadcrumb
        try {
          trackCartOperation('add', item.id, {
            product_name: item.name,
            price: item.price,
            has_extras: (item.extras?.length || 0) > 0,
            extras_count: item.extras?.length || 0,
          });
          console.log('[CartContext] ✅ Sentry tracking successful');
        } catch (error) {
          console.error('[CartContext] ❌ Sentry tracking error:', error);
        }

        let newCart: CartItem[];
        if (existing) {
          console.log('[CartContext] Updating existing item quantity from', existing.quantity, 'to', existing.quantity + 1);
          newCart = current.map((i) =>
            i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i
          );
          toast.success("Producto agregado al carrito");
        } else {
          console.log('[CartContext] Adding new item to cart');
          newCart = [...current, { ...itemWithId, quantity: 1 }];
          toast.success("Producto agregado al carrito");
        }

        console.log('[CartContext] New cart state:', JSON.stringify(newCart, null, 2));
        console.log('[CartContext] New cart length:', newCart.length);
        console.log('🛒 [CartContext] ========== ADD TO CART END ==========');

        return newCart;
      });
    } catch (error) {
      console.error('❌ [CartContext] CRITICAL ERROR in addItem:', error);
      console.error('[CartContext] Error stack:', (error as Error).stack);
      toast.error('Error al agregar producto al carrito');
      console.log('🛒 [CartContext] ========== ADD TO CART FAILED ==========');

      // Capture exception in Sentry
      captureException(error as Error, {
        tags: { context: 'cart_add_item' },
        extra: {
          item,
          current_items_count: items.length,
          error_message: (error as Error).message
        },
        level: 'error',
      });
    }
  };

  const removeItem = (cartItemId: string) => {
    console.log('🗑️ [CartContext] ========== REMOVE FROM CART START ==========');
    console.log('[CartContext] CartItemId to remove:', cartItemId);

    try {
      setItems((current) => {
        const itemToRemove = current.find((item) => item.cartItemId === cartItemId);
        console.log('[CartContext] Item to remove found:', itemToRemove ? 'YES' : 'NO');

        if (itemToRemove) {
          console.log('[CartContext] Item to remove details:', JSON.stringify(itemToRemove, null, 2));

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
            console.log('[CartContext] ✅ PostHog remove event captured');
          } catch (error) {
            console.error('[CartContext] ❌ PostHog error:', error);
          }

          // Track in Sentry with breadcrumb
          try {
            trackCartOperation('remove', itemToRemove.id, {
              product_name: itemToRemove.name,
              quantity: itemToRemove.quantity,
            });
            console.log('[CartContext] ✅ Sentry tracking successful');
          } catch (error) {
            console.error('[CartContext] ❌ Sentry tracking error:', error);
          }
        }

        const newCart = current.filter((item) => item.cartItemId !== cartItemId);
        console.log('[CartContext] Cart before removal:', current.length, 'items');
        console.log('[CartContext] Cart after removal:', newCart.length, 'items');
        console.log('🗑️ [CartContext] ========== REMOVE FROM CART END ==========');

        return newCart;
      });
      toast.success("Producto eliminado del carrito");
    } catch (error) {
      console.error('❌ [CartContext] CRITICAL ERROR in removeItem:', error);
      toast.error('Error al eliminar producto del carrito');

      // Capture exception in Sentry
      captureException(error as Error, {
        tags: { context: 'cart_remove_item' },
        extra: {
          cartItemId,
          error_message: (error as Error).message
        },
        level: 'error',
      });
    }
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    console.log('🔄 [CartContext] ========== UPDATE QUANTITY START ==========');
    console.log('[CartContext] CartItemId:', cartItemId, 'New quantity:', quantity);

    if (quantity <= 0) {
      console.log('[CartContext] Quantity <= 0, delegating to removeItem');
      removeItem(cartItemId);
      return;
    }

    try {
      setItems((current) => {
        const item = current.find((i) => i.cartItemId === cartItemId);
        console.log('[CartContext] Item to update found:', item ? 'YES' : 'NO');

        if (item) {
          console.log('[CartContext] Current quantity:', item.quantity, '→ New quantity:', quantity);

          // Track in Sentry with breadcrumb
          try {
            trackCartOperation('update', item.id, {
              product_name: item.name,
              old_quantity: item.quantity,
              new_quantity: quantity,
            });
            console.log('[CartContext] ✅ Sentry tracking successful');
          } catch (error) {
            console.error('[CartContext] ❌ Sentry tracking error:', error);
          }
        }

        const updatedItems = current.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity } : item));
        console.log('[CartContext] Cart updated with new quantities');
        console.log('🔄 [CartContext] ========== UPDATE QUANTITY END ==========');

        return updatedItems;
      });
    } catch (error) {
      console.error('❌ [CartContext] CRITICAL ERROR in updateQuantity:', error);
      toast.error('Error al actualizar cantidad');

      // Capture exception in Sentry
      captureException(error as Error, {
        tags: { context: 'cart_update_quantity' },
        extra: {
          cartItemId,
          quantity,
          error_message: (error as Error).message
        },
        level: 'error',
      });
    }
  };

  const clearCart = () => {
    console.log('🧹 [CartContext] ========== CLEAR CART START ==========');
    console.log('[CartContext] Items before clear:', items.length);
    console.log('[CartContext] Cart value before clear:', totalPrice);

    try {
      // Track cart clear in Sentry
      trackCartOperation('clear', undefined, {
        items_count: items.length,
        cart_value: totalPrice,
      });
      console.log('[CartContext] ✅ Sentry tracking successful');

      setItems([]);
      removeSecureItem("cart");
      console.log('[CartContext] ✅ Cart cleared and storage removed');
      console.log('🧹 [CartContext] ========== CLEAR CART END ==========');
    } catch (error) {
      console.error('❌ [CartContext] CRITICAL ERROR in clearCart:', error);

      // Capture exception in Sentry
      captureException(error as Error, {
        tags: { context: 'cart_clear' },
        extra: {
          items_count: items.length,
          error_message: (error as Error).message
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
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};