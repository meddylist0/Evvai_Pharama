"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { ProductItem } from "@/lib/api";

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  totalItems: number;
  subtotal: number;
  gst: number;
  total: number;
  addToCart: (product: ProductItem, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  syncCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "pharmalink_cart";

const readCartFromStorage = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((it) => it && it.product && it.product.id);
    }
    return [];
  } catch {
    return [];
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const isMounted = useRef(false);

  // Initial load on client mount
  useEffect(() => {
    const initial = readCartFromStorage();
    setCartItems(initial);
    isMounted.current = true;
  }, []);

  // Save cart to storage whenever cartItems change (after mount)
  useEffect(() => {
    if (!isMounted.current) return;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
        // Dispatch custom event outside render cycle
        window.dispatchEvent(new CustomEvent("pharmalink_cart_updated"));
      }
    } catch (e) {
      console.error("Failed to persist cart:", e);
    }
  }, [cartItems]);

  // Listen for storage events from other tabs or windows
  useEffect(() => {
    const handleExternalUpdate = () => {
      const items = readCartFromStorage();
      setCartItems(items);
    };

    window.addEventListener("storage", handleExternalUpdate);
    return () => {
      window.removeEventListener("storage", handleExternalUpdate);
    };
  }, []);

  const syncCart = useCallback(() => {
    const items = readCartFromStorage();
    setCartItems(items);
  }, []);

  const addToCart = useCallback((product: ProductItem, quantity = 1) => {
    setCartItems((prev) => {
      const next = [...prev];
      const idx = next.findIndex((it) => it.product.id === product.id);
      if (idx >= 0) {
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + quantity,
        };
      } else {
        next.push({ product, quantity });
      }
      return next;
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setCartItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((it) => it.product.id !== productId);
      }
      return prev.map((it) =>
        it.product.id === productId ? { ...it, quantity } : it
      );
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCartItems((prev) => prev.filter((it) => it.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, []);

  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, it) => {
      const price = Number(
        it.product.customer_price || it.product.display_price || it.product.mrp || 0
      );
      return acc + price * (it.quantity || 1);
    }, 0);
  }, [cartItems]);

  const gst = useMemo(() => {
    return Math.round(subtotal * 0.18);
  }, [subtotal]);

  const total = useMemo(() => {
    return subtotal + gst;
  }, [subtotal, gst]);

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      totalItems: cartCount,
      subtotal,
      gst,
      total,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      syncCart,
    }),
    [
      cartItems,
      cartCount,
      subtotal,
      gst,
      total,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      syncCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      cartItems: [],
      cartCount: 0,
      totalItems: 0,
      subtotal: 0,
      gst: 0,
      total: 0,
      addToCart: () => {},
      updateQuantity: () => {},
      removeFromCart: () => {},
      clearCart: () => {},
      syncCart: () => {},
    };
  }
  return ctx;
};
