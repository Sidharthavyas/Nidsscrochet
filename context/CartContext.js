import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

const CartContext = createContext();

// Ensures every cart item has shipping_charges and cod_available fields
const normalizeItem = (item) => ({
  ...item,
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
                quantity: item.quantity + action.payload.quantity,
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
            ? { ...item, quantity: action.payload.quantity }
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
  const [isClient, setIsClient] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const { isSignedIn, userId } = useAuth();

  // Mark as client-side only after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load cart from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('guestCart');
      if (savedCart) {
        try {
          const cartItems = JSON.parse(savedCart);
          dispatch({ type: 'LOAD_CART', payload: cartItems });
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
        }
      }

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

  // Save cart to localStorage whenever it changes (for guests)
  useEffect(() => {
    if (typeof window !== 'undefined' && !isSignedIn) {
      localStorage.setItem('guestCart', JSON.stringify(state.items));
    }
  }, [state.items, isSignedIn]);

  // Sync cart with backend for authenticated users
  useEffect(() => {
    if (isSignedIn && userId) {
      syncCartWithBackend();
    }
  }, [isSignedIn, userId]);

  const syncCartWithBackend = async () => {
    try {
      // Get guest cart from localStorage
      const guestCart = localStorage.getItem('guestCart');
      const guestCartItems = guestCart ? JSON.parse(guestCart) : [];

      if (guestCartItems.length > 0) {
        // Merge guest cart with user cart
        const response = await fetch('/api/cart/merge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items: guestCartItems }),
        });

        if (response.ok) {
          const mergedCart = await response.json();
          dispatch({ type: 'LOAD_CART', payload: mergedCart.items });
          localStorage.removeItem('guestCart'); // Clear guest cart after merging
        }
      } else {
        // Load existing user cart
        const response = await fetch('/api/cart');
        if (response.ok) {
          const userCart = await response.json();
          dispatch({ type: 'LOAD_CART', payload: userCart.items || [] });
        }
      }
    } catch (error) {
      console.error('Error syncing cart with backend:', error);
    }
  };

  const addToCart = (product, quantity = 1) => {
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

    // Update backend if user is authenticated
    if (isSignedIn) {
      updateCartBackend();
    }
  };

  const updateQuantity = (id, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });

    // Update backend if user is authenticated
    if (isSignedIn) {
      updateCartBackend();
    }
  };

  const removeFromCart = (id) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { id } });

    // Update backend if user is authenticated
    if (isSignedIn) {
      updateCartBackend();
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    removeCoupon();

    // Update backend if user is authenticated
    if (isSignedIn) {
      updateCartBackend();
    }
  };

  const applyCoupon = (couponData) => {
    setAppliedCoupon(couponData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('appliedCoupon', JSON.stringify(couponData));
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('appliedCoupon');
    }
  };

  const updateCartBackend = async () => {
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: state.items }),
      });
    } catch (error) {
      console.error('Error updating cart backend:', error);
    }
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => {
      const price = parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const getShippingTotal = () => {
    return state.items.reduce((total, item) => {
      return total + (parseFloat(item.shipping_charges) || 0);
    }, 0);
  };

  const allItemsSupportCOD = () => {
    if (state.items.length === 0) return false;
    return state.items.every(item => item.cod_available === true);
  };

  const getCartCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    items: state.items,
    appliedCoupon,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getShippingTotal,
    allItemsSupportCOD,
    getCartCount,
    syncCartWithBackend,
    applyCoupon,
    removeCoupon
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
