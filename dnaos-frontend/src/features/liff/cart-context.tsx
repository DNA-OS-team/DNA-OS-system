"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type CartItem = {
  productVariantId: string;
  productName: string;
  variantName: string;
  unit: string;
  price: number;
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">) => void;
  update: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productVariantId === item.productVariantId);
      if (existing) {
        return prev.map((i) =>
          i.productVariantId === item.productVariantId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const update = useCallback((variantId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productVariantId !== variantId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.productVariantId === variantId ? { ...i, quantity: qty } : i))
      );
    }
  }, []);

  const remove = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.productVariantId !== variantId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, update, remove, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
