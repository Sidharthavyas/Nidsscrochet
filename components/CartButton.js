// components/CartButton.js

import { useCart } from '@/context/CartContext';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import styles from '../styles/Home.module.css';

const CartButton = ({ showLabel = false, variant = 'default', onClick }) => {
  const { getCartCount } = useCart();
  const [cartCount, setCartCount] = useState(0);
  const [animate, setAnimate] = useState(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const newCount = getCartCount();

    // Trigger bounce animation when count increases
    if (newCount > prevCountRef.current) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 600);
      return () => clearTimeout(timer);
    }

    prevCountRef.current = newCount;
    setCartCount(newCount);
  }, [getCartCount]);

  // Sync count without animation on mount
  useEffect(() => {
    const count = getCartCount();
    setCartCount(count);
    prevCountRef.current = count;
  }, [getCartCount]);

  // ===== MENU VARIANT (inside slide-out mobile menu) =====
  if (variant === 'menu') {
    return (
      <Link
        href="/cart"
        className={styles.navLink}
        onClick={onClick}
        aria-label={`Shopping cart with ${cartCount} items`}
        style={{ textDecoration: 'none' }}
      >
        Cart{cartCount > 0 && (
          <span style={{ color: 'var(--pink)', fontWeight: 700, marginLeft: '4px' }}>
            ({cartCount})
          </span>
        )}
      </Link>
    );
  }

  // ===== DEFAULT VARIANT (navbar top bar) =====
  return (
    <Link
      href="/cart"
      className={`${styles.cartButton} ${animate ? styles.cartBounce : ''}`}
      onClick={onClick}
      aria-label={`Shopping cart with ${cartCount} items`}
    >
      <span className={styles.iconWrapper}>
        <ShoppingCart
          size={20}
          className={styles.cartIcon}
        />
        {cartCount > 0 && (
          <span
            className={`${styles.badge} ${animate ? styles.badgePop : ''}`}
          >
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </span>

      {/* Always show label on mobile when showLabel is true */}
      {showLabel && (
        <span className={styles.label}>Cart</span>
      )}

      {/* Desktop-only label when showLabel is false */}
      {!showLabel && (
        <span className={styles.labelDesktop}>Cart</span>
      )}
    </Link>
  );
};

export default CartButton;