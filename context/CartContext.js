import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

const CartContext = createContext();

// Ensures every cart item has shipping_charges and cod_available fields
const normalizeItem = (item) => ({
  ...item,
  id: item.id || item.productId, // Ensure id exists for frontend
  shipping_charges: parseFloat(item.shipping_charges) || 0,
  cod_available: !!item.cod_available,
});

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? {
                ...item,
                quantity: Math.min(item.quantity + action.payload.quantity, 99),
                // Update shipping/cod in case product data changed
                shipping_charges: parseFloat(action.payload.shipping_charges) || 0,
                cod_available: !!action.payload.cod_available,
              }
              : item
          )
        };
      }
      return {
        ...state,
        items: [...state.items, normalizeItem(action.payload)]
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.max(1, Math.min(99, action.payload.quantity)) }
            : item
        ).filter(item => item.quantity > 0)
      };

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id)
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };

    case 'LOAD_CART':
      return {
        ...state,
        items: (action.payload || []).map(normalizeItem)
      };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const { isSignedIn, userId, isLoaded } = useAuth();
  
  // Use ref to track latest state for backend sync
  const stateRef = useRef(state);
  const syncTimeoutRef = useRef(null);
  const isSyncingRef = useRef(false);
  
  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // CRITICAL FIX: Debounced backend sync using latest state from ref
  const syncToBackend = useCallback(async (items) => {
    if (!isSignedIn || isSyncingRef.current) return;
    
    try {
      isSyncingRef.current = true;
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
    } catch (error) {
      console.error('Error syncing cart to backend:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [isSignedIn]);

  // Debounced sync - prevents rapid fire requests
  const debouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      syncToBackend(stateRef.current.items);
    }, 500);
  }, [syncToBackend]);

  // HYDRATION: Load cart on mount
  useEffect(() => {
    if (!isLoaded) return;

    const loadCart = async () => {
      if (isSignedIn && userId) {
        // Load from backend for authenticated users
        try {
          const guestCart = localStorage.getItem('guestCart');
          const guestCartItems = guestCart ? JSON.parse(guestCart) : [];

          if (guestCartItems.length > 0) {
            // Merge guest cart with user cart
            const response = await fetch('/api/cart/merge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: guestCartItems }),
            });

            if (response.ok) {
              const data = await response.json();
              dispatch({ type: 'LOAD_CART', payload: data.items });
              localStorage.removeItem('guestCart');
            }
          } else {
            // Load existing user cart
            const response = await fetch('/api/cart');
            if (response.ok) {
              const data = await response.json();
              dispatch({ type: 'LOAD_CART', payload: data.items || [] });
            }
          }
        } catch (error) {
          console.error('Error loading cart from backend:', error);
        }
      } else {
        // Load from localStorage for guests
        const savedCart = localStorage.getItem('guestCart');
        if (savedCart) {
          try {
            const cartItems = JSON.parse(savedCart);
            dispatch({ type: 'LOAD_CART', payload: cartItems });
          } catch (error) {
            console.error('Error loading cart from localStorage:', error);
          }
        }
      }
      
      setIsHydrated(true);
    };

    loadCart();
  }, [isLoaded, isSignedIn, userId]);

  // Load coupon from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCoupon = localStorage.getItem('appliedCoupon');
      if (savedCoupon) {
        try {
          setAppliedCoupon(JSON.parse(savedCoupon));
        } catch (error) {
          console.error('Error loading coupon from localStorage:', error);
        }
      }
    }
  }, []);

  // Save to localStorage for guests, sync to backend for authenticated users
  useEffect(() => {
    if (!isHydrated) return; // Don't sync during initial hydration

    if (isSignedIn) {
      // Sync to backend for authenticated users
      debouncedSync();
    } else {
      // Save to localStorage for guests
      if (typeof window !== 'undefined') {
        localStorage.setItem('guestCart', JSON.stringify(state.items));
      }
    }
  }, [state.items, isSignedIn, isHydrated, debouncedSync]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const addToCart = useCallback((product, quantity = 1) => {
    // Use salePrice if available, otherwise use regular price
    const rawPrice = product.salePrice || product.price;
    const numericPrice = parseFloat(String(rawPrice).replace(/[^\d.]/g, '')) || 0;

    const cartItem = {
      id: product._id || product.id,
      name: product.name || product.title,
      price: numericPrice,
      image: product.image || product.imageUrl,
      quantity,
      shipping_charges: parseFloat(product.shipping_charges) || 0,
      cod_available: !!product.cod_available,
    };
    
    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, []);

  const removeFromCart = useCallback((id) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { id } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
    removeCoupon();
  }, []);

  const applyCoupon = useCallback((couponData) => {
    setAppliedCoupon(couponData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('appliedCoupon', JSON.stringify(couponData));
    }
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('appliedCoupon');
    }
  }, []);

  const getCartTotal = useCallback(() => {
    return stateRef.current.items.reduce((total, item) => {
      const price = parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0;
      return total + (price * item.quantity);
    }, 0);
  }, []);

  const getShippingTotal = useCallback(() => {
    return stateRef.current.items.reduce((total, item) => {
      return total + (parseFloat(item.shipping_charges) || 0);
    }, 0);
  }, []);

  const allItemsSupportCOD = useCallback(() => {
    if (stateRef.current.items.length === 0) return false;
    return stateRef.current.items.every(item => item.cod_available === true);
  }, []);

  const getCartCount = useCallback(() => {
    return stateRef.current.items.reduce((count, item) => count + item.quantity, 0);
  }, []);

  const value = {
    items: state.items,
    appliedCoupon,
    isHydrated,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getShippingTotal,
    allItemsSupportCOD,
    getCartCount,
    applyCoupon,
    removeCoupon,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
