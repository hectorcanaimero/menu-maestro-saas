import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

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
    setItems((current) => current.filter((item) => item.cartItemId !== cartItemId));
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