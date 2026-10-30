import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { MenuItem } from '../components/MenuItemCard';
import { useAuth } from './AuthContext';
import api from '../services/api';

export interface CartItem extends MenuItem {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  addItem: (item: MenuItem, restaurantId: string, restaurantName: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalAmount: number;
  totalItems: number;
  isLoading: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Map backend CartItemResponse to frontend CartItem
  const mapBackendItems = (backendItems: any[]): CartItem[] => {
    return (backendItems || []).map((i) => ({
      id: i.menuItemId,
      name: i.name,
      description: i.description || '',
      price: Number(i.price),
      category: i.category || '',
      available: i.available !== false,
      primaryImageUrl: i.primaryImageUrl,
      quantity: i.quantity,
    }));
  };

  // Fetch cart from backend database
  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setRestaurantId(null);
      setRestaurantName(null);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.get('/cart');
      const cartData = res.data?.data;
      if (cartData) {
        setRestaurantId(cartData.restaurantId || null);
        setRestaurantName(cartData.restaurantName || null);
        setItems(mapBackendItems(cartData.items));
      }
    } catch (err: any) {
      // 401 or network issue - keep local if any
      console.warn('Failed to fetch cart from server:', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load cart whenever the authenticated user changes
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setItems([]);
      setRestaurantId(null);
      setRestaurantName(null);
    }
  }, [user, refreshCart]);

  const addItem = async (item: MenuItem, resId: string, resName: string) => {
    // Optimistic update
    if (restaurantId && restaurantId !== resId) {
      setItems([{ ...item, quantity: 1 }]);
      setRestaurantId(resId);
      setRestaurantName(resName);
    } else {
      if (!restaurantId) {
        setRestaurantId(resId);
        setRestaurantName(resName);
      }
      setItems((prevItems) => {
        const existingItem = prevItems.find((i) => i.id === item.id);
        if (existingItem) {
          return prevItems.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [...prevItems, { ...item, quantity: 1 }];
      });
    }

    // Sync with backend database
    if (user) {
      try {
        const res = await api.post('/cart/items', {
          menuItemId: item.id,
          restaurantId: resId,
          quantity: 1,
        });
        const cartData = res.data?.data;
        if (cartData) {
          setRestaurantId(cartData.restaurantId || null);
          setRestaurantName(cartData.restaurantName || null);
          setItems(mapBackendItems(cartData.items));
        }
      } catch (err) {
        console.warn('Failed to persist cart item to DB:', err);
      }
    }
  };

  const removeItem = async (itemId: string) => {
    // Optimistic update
    setItems((prevItems) => {
      const newItems = prevItems.filter((i) => i.id !== itemId);
      if (newItems.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return newItems;
    });

    // Sync with backend database
    if (user) {
      try {
        const res = await api.delete(`/cart/items/${itemId}`);
        const cartData = res.data?.data;
        if (cartData) {
          setRestaurantId(cartData.restaurantId || null);
          setRestaurantName(cartData.restaurantName || null);
          setItems(mapBackendItems(cartData.items));
        }
      } catch (err) {
        console.warn('Failed to remove cart item from DB:', err);
      }
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    // Optimistic update
    setItems((prevItems) =>
      prevItems.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );

    // Sync with backend database
    if (user) {
      try {
        const res = await api.put(`/cart/items/${itemId}`, { quantity });
        const cartData = res.data?.data;
        if (cartData) {
          setRestaurantId(cartData.restaurantId || null);
          setRestaurantName(cartData.restaurantName || null);
          setItems(mapBackendItems(cartData.items));
        }
      } catch (err) {
        console.warn('Failed to update cart item quantity in DB:', err);
      }
    }
  };

  const clearCart = async () => {
    // Optimistic clear
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);

    // Sync with backend database
    if (user) {
      try {
        await api.delete('/cart');
      } catch (err) {
        console.warn('Failed to clear cart in DB:', err);
      }
    }
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
        isLoading,
        refreshCart,
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
