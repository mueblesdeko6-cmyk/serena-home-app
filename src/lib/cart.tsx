"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine } from "./types";

type CartContextValue = {
  cart: CartLine[];
  addLine: (line: CartLine) => void;
  removeLine: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "serena_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {
      // localStorage puede fallar en modo privado; seguimos con carrito vacío.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // idem
    }
  }, [cart, loaded]);

  const addLine = (line: CartLine) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === line.id);
      if (existing) {
        return prev.map((l) =>
          l.id === line.id ? { ...l, qty: l.qty + line.qty } : l
        );
      }
      return [...prev, line];
    });
  };

  const removeLine = (id: string) =>
    setCart((prev) => prev.filter((l) => l.id !== id));

  const setQty = (id: string, qty: number) =>
    setCart((prev) =>
      prev.map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l))
    );

  const clear = () => setCart([]);

  const total = useMemo(
    () => cart.reduce((sum, l) => sum + l.price * l.qty, 0),
    [cart]
  );
  const count = useMemo(() => cart.reduce((sum, l) => sum + l.qty, 0), [cart]);

  return (
    <CartContext.Provider
      value={{ cart, addLine, removeLine, setQty, clear, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}

export function fmtCOP(n: number) {
  return "$" + n.toLocaleString("es-CO");
}
