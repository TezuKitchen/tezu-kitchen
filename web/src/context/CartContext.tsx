import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { MenuItem } from '../types';

export interface CartItem extends MenuItem {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  addItem: (item: MenuItem, restaurantId: string, restaurantName: string) => boolean;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);

  const addItem = (item: MenuItem, resId: string, resName: string): boolean => {
    if (restaurantId && restaurantId !== resId) {
      const confirm = window.confirm(
        `Your cart has items from "${restaurantName}". Adding this item will clear your current cart. Continue?`
      );
      if (!confirm) return false;
      setItems([{ ...item, quantity: 1 }]);
      setRestaurantId(resId);
      setRestaurantName(resName);
      return true;
    }

    if (!restaurantId) {
      setRestaurantId(resId);
      setRestaurantName(resName);
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    return true;
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => {
      const newItems = prev.filter((i) => i.id !== itemId);
      if (newItems.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return newItems;
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        restaurantName,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalAmount,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
