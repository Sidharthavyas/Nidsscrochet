// components/CartButton.js

import { useCart } from '@/context/CartContext';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useEffect, useRef, useState } from 'react';
import styles from '../styles/Home.module.css';

const CartButton = ({ showLabel = false, variant = 'default', onClick }) => {
  const { items } = useCart();

  // Calculate count directly from items — no stale closures
  const cartCount = useMemo(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  // Bounce animation: fires whenever cartCount increases
  const prevCountRef = useRef(cartCount);
  const [bouncing, setBouncing] = useState(false);
  const [badgePopping, setBadgePopping] = useState(false);

  useEffect(() => {
    if (cartCount > prevCountRef.current) {
      // Trigger bounce + badge pop
      setBouncing(false);
      setBadgePopping(false);
      // Force reflow so animation restarts even on repeated adds
      requestAnimationFrame(() => {
        setBouncing(true);
        setBadgePopping(true);
      });
      const t = setTimeout(() => {
        setBouncing(false);
        setBadgePopping(false);
      }, 650);
      prevCountRef.current = cartCount;
      return () => clearTimeout(t);
    }
    prevCountRef.current = cartCount;
  }, [cartCount]);

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
      className={styles.cartButton}
      onClick={onClick}
      aria-label={`Shopping cart with ${cartCount} items`}
    >
      <span className={`${styles.iconWrapper} ${bouncing ? styles.cartBounce : ''}`}>
        <ShoppingCart
          size={20}
          className={styles.cartIcon}
        />
        {cartCount > 0 && (
          <span className={`${styles.badge} ${badgePopping ? styles.badgePop : ''}`}>
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