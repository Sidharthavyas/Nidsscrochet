// components/CartButton.js

import { useCart } from '@/context/CartContext';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import styles from '../styles/Home.module.css';

const CartButton = ({ showLabel = false, variant = 'default', onClick }) => {
  const { items } = useCart();
  
  // Calculate count directly from items - no stale closures
  const cartCount = useMemo(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

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
      <span className={styles.iconWrapper}>
        <ShoppingCart
          size={20}
          className={styles.cartIcon}
        />
        {cartCount > 0 && (
          <span className={styles.badge}>
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