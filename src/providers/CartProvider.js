import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthProvider.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const cartStorageKey = `vestora_cart_${user?.id ?? 'guest'}`;
  const [cartState, setCartState] = useState({ storageKey: null, items: [] });
  const [loadedStorageKey, setLoadedStorageKey] = useState(null);
  const emptyItems = useMemo(() => [], []);
  const items = cartState.storageKey === cartStorageKey ? cartState.items : emptyItems;
  const ready = loadedStorageKey === cartStorageKey;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(cartStorageKey)
      .then((value) => {
        let restoredItems = [];
        if (value) {
          const restored = JSON.parse(value);
          if (!Array.isArray(restored)) throw new Error('Stored cart has an invalid format.');
          restoredItems = restored.filter(
            (item) =>
              typeof item?.key === 'string' &&
              typeof item?.product?._id === 'string' &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0 &&
              Number.isSafeInteger(item.product.priceMinor),
          );
        }
        if (active) setCartState({ storageKey: cartStorageKey, items: restoredItems });
      })
      .catch((error) => console.error('Could not restore the shopping cart:', error.message))
      .finally(() => {
        if (active) setLoadedStorageKey(cartStorageKey);
      });
    return () => {
      active = false;
    };
  }, [cartStorageKey]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(cartStorageKey, JSON.stringify(items)).catch((error) => {
      console.error('Could not save the shopping cart:', error.message);
    });
  }, [cartStorageKey, items, ready]);

  const updateItems = useCallback((updater) => {
    setCartState((current) => {
      const currentItems = current.storageKey === cartStorageKey ? current.items : [];
      return { storageKey: cartStorageKey, items: updater(currentItems) };
    });
  }, [cartStorageKey]);

  const addItem = useCallback((product, variant = {}) => {
    updateItems((current) => {
      const productId = product._id ?? product.id;
      const size = variant.size ?? '';
      const color = variant.color ?? '';
      const key = `${productId}:${size}:${color}`;
      const existing = current.find((item) => item.key === key);
      if (existing) {
        return current.map((item) =>
          item.key === key
            ? { ...item, quantity: Math.min(item.quantity + 1, 20) }
            : item,
        );
      }
      return [...current, {
        key,
        product: { ...product, _id: productId },
        size,
        color,
        quantity: 1,
      }];
    });
  }, [updateItems]);

  const setQuantity = useCallback((key, quantity) => {
    if (quantity <= 0) {
      updateItems((current) => current.filter((item) => item.key !== key));
      return;
    }
    updateItems((current) =>
      current.map((item) =>
        item.key === key
          ? { ...item, quantity: Math.min(quantity, 20) }
          : item,
      ),
    );
  }, [updateItems]);

  const clearCart = useCallback(() => updateItems(() => []), [updateItems]);
  const subtotalMinor = items.reduce(
    (sum, item) => sum + item.product.priceMinor * item.quantity,
    0,
  );
  const value = useMemo(
    () => ({ items, ready, subtotalMinor, addItem, setQuantity, clearCart }),
    [items, ready, subtotalMinor, addItem, setQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider.');
  return context;
}
