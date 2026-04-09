import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, IndianRupee, ArrowLeft, Trash2, Package, Tag, X } from 'lucide-react';
import CartItem from './CartItem';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Cart.module.css';

const Cart = () => {
  const { items, getCartTotal, getShippingTotal, clearCart, appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const router = useRouter();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const cartTotal = getCartTotal();
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode.trim()) return;

    setIsValidating(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, orderValue: cartTotal })
      });
      const data = await res.json();

      if (data.success) {
        applyCoupon(data.data);
        setCouponCode('');
      } else {
        setCouponError(data.message);
      }
    } catch (error) {
      setCouponError('Error validating coupon. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const shippingTotal = getShippingTotal();

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = Math.floor(cartTotal * (appliedCoupon.discountValue / 100));
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
    if (discountAmount > cartTotal) discountAmount = cartTotal;
  }

  const orderTotal = cartTotal - discountAmount + shippingTotal;

  if (items.length === 0) {
    return (
      <div className={styles.cartPage}>
        <div className={styles.cartContainer}>
          <div className={styles.emptyCart}>
            <div className={styles.emptyIconCircle}>
              <ShoppingCart className={styles.emptyIcon} />
            </div>
            <h1 className={styles.emptyTitle}>Your cart is empty</h1>
            <p className={styles.emptySubtitle}>
              Looks like you haven't added any items yet. Explore our handcrafted crochet collection!
            </p>
            <Link href="/" className={styles.emptyShopBtn}>
              <ArrowLeft className={styles.emptyShopBtnIcon} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cartPage}>
      <div className={styles.cartContainer}>

        {/* Header */}
        <div className={styles.cartHeader}>
          <h1 className={styles.cartTitle}>Shopping Cart 🛒</h1>
          <p className={styles.cartSubtitle}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className={styles.cartGrid}>
          {/* Cart Items */}
          <div>
            <div className={styles.itemsList}>
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Actions */}
            <div className={styles.cartActions}>
              <Link href="/" className={styles.continueBtn}>
                <ArrowLeft className={styles.continueBtnIcon} />
                Continue Shopping
              </Link>
              <button onClick={handleClearCart} className={styles.clearBtn}>
                <Trash2 style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Subtotal ({itemCount} items)</span>
                <span className={styles.summaryValue}>
                  <IndianRupee className={styles.summaryValueIcon} />
                  {cartTotal.toFixed(2)}
                </span>
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Package style={{ width: '14px', height: '14px' }} /> Shipping
                </span>
                <span className={styles.summaryValue}>
                  {shippingTotal === 0 ? (
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>FREE</span>
                  ) : (
                    <>
                      <IndianRupee className={styles.summaryValueIcon} />
                      {shippingTotal.toFixed(2)}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Coupon Code Section */}
            {!appliedCoupon ? (
              <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter Promo Code"
                    style={{ flex: 1, padding: '0.6rem 0.8rem', border: '1px solid #f9a8d4', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                  />
                  <button
                    type="submit"
                    disabled={isValidating || !couponCode.trim()}
                    style={{ background: 'var(--pink)', color: 'white', border: 'none', borderRadius: '8px', padding: '0 1rem', cursor: isValidating ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: isValidating ? 0.7 : 1 }}
                  >
                    {isValidating ? '...' : 'Apply'}
                  </button>
                </form>
                {couponError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: 0 }}>{couponError}</p>}
              </div>
            ) : (
              <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', padding: '0.8rem', background: '#fdf2f8', border: '1px dashed #fbcfe8', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Tag style={{ width: '16px', height: '16px', color: '#db2777' }} />
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#9d174d', display: 'block' }}>{appliedCoupon.code}</span>
                    <span style={{ fontSize: '0.75rem', color: '#be185d' }}>Coupon applied</span>
                  </div>
                </div>
                <button onClick={removeCoupon} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            )}

            {appliedCoupon && (
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel} style={{ color: '#db2777' }}>Discount ({appliedCoupon.code})</span>
                <span className={styles.summaryValue} style={{ color: '#db2777' }}>
                  -<IndianRupee className={styles.summaryValueIcon} />
                  {discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div className={styles.summaryDivider} />

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total</span>
              <span className={styles.totalValue}>
                <IndianRupee className={styles.totalValueIcon} />
                {orderTotal.toFixed(2)}
              </span>
            </div>

            <button onClick={handleCheckout} className={styles.checkoutBtn}>
              <ShoppingCart style={{ width: '18px', height: '18px' }} />
              Proceed to Checkout
            </button>

            <Link href="/" className={styles.summaryFooterLink}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
