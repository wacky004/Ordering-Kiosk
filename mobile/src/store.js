import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { MENU, OPTIONS } from './data';
import { computeOrder, unitPrice } from './pricing';

const KioskContext = createContext(null);

export function useKiosk() {
  return useContext(KioskContext);
}

const lineKey = (itemId, options) =>
  `${itemId}|${(options || [])
    .map((o) => o.name)
    .sort()
    .join(',')}`;

export function KioskProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [points, setPoints] = useState(250);
  const [orders, setOrders] = useState([]);
  const [sequence, setSequence] = useState(1000);

  const addToCart = useCallback((item, options = [], qty = 1) => {
    setCart((current) => {
      const key = lineKey(item.id, options);
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) =>
          line.key === key ? { ...line, qty: Math.min(50, line.qty + qty) } : line
        );
      }
      return [
        ...current,
        {
          key,
          id: item.id,
          name: item.name,
          price: item.price,
          icon: item.icon,
          options,
          qty,
        },
      ];
    });
  }, []);

  const setQty = useCallback((key, qty) => {
    setCart((current) =>
      qty <= 0
        ? current.filter((line) => line.key !== key)
        : current.map((line) => (line.key === key ? { ...line, qty: Math.min(50, qty) } : line))
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = useMemo(() => cart.reduce((sum, line) => sum + line.qty, 0), [cart]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, line) => sum + unitPrice(line.price, line.options) * line.qty, 0),
    [cart]
  );

  const quote = useCallback(
    ({ redeemPoints = 0, seniorCount = 0 } = {}) =>
      computeOrder(cart, { availablePoints: points, redeemPoints, seniorCount }),
    [cart, points]
  );

  const placeOrder = useCallback(
    ({ orderType = 'dine-in', paymentMethod = 'card', seniorCount = 0, redeemPoints = 0 } = {}) => {
      const totals = computeOrder(cart, {
        availablePoints: points,
        redeemPoints,
        seniorCount,
      });
      const nextNumber = sequence + 1;
      const order = {
        id: nextNumber,
        code: `MC-${nextNumber}`,
        items: cart.map((line) => ({
          ...line,
          unit: unitPrice(line.price, line.options),
          lineTotal: unitPrice(line.price, line.options) * line.qty,
        })),
        totals,
        orderType,
        paymentMethod,
        status: 'received',
        createdAt: new Date().toISOString(),
      };
      setSequence(nextNumber);
      setOrders((current) => [order, ...current]);
      setPoints((current) => current - totals.redeemPoints + totals.pointsEarned);
      setCart([]);
      return order;
    },
    [cart, points, sequence]
  );

  const advanceOrder = useCallback((id) => {
    const flow = ['received', 'preparing', 'ready', 'completed'];
    setOrders((current) =>
      current.map((order) => {
        if (order.id !== id) return order;
        const index = flow.indexOf(order.status);
        if (index === -1 || index === flow.length - 1) return order;
        return { ...order, status: flow[index + 1] };
      })
    );
  }, []);

  const value = useMemo(
    () => ({
      menu: MENU,
      optionsByCategory: OPTIONS,
      cart,
      cartCount,
      cartSubtotal,
      points,
      orders,
      addToCart,
      setQty,
      clearCart,
      quote,
      placeOrder,
      advanceOrder,
    }),
    [cart, cartCount, cartSubtotal, points, orders, addToCart, setQty, clearCart, quote, placeOrder, advanceOrder]
  );

  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>;
}
