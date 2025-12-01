import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import posthog from "posthog-js";
import { useStore } from "./StoreContext";

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
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

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
        console.error('[PostHog] Error tracking add to cart:', error);
      }

      if (existing) {
        toast.success("Cantidad actualizada");
        return current.map((i) =>
          i.cartItemId === cartItemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      toast.success("Platillo agregado al carrito");
      return [...current, { ...itemWithId, quantity: 1 }];
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((current) => {
      const itemToRemove = current.find((item) => item.cartItemId === cartItemId);

      // Track event in PostHog
      if (itemToRemove) {
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
          console.error('[PostHog] Error tracking remove from cart:', error);
        }
      }

      return current.filter((item) => item.cartItemId !== cartItemId);
    });
    toast.success("Platillo eliminado");
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems((current) =>
      current.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart");
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