import { useCart } from '@/context/CartContext';
import { ShoppingCart, IndianRupee, ArrowLeft, Trash2, Package } from 'lucide-react';
import CartItem from './CartItem';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Cart.module.css';

const Cart = () => {
  const { items, getCartTotal, getShippingTotal, clearCart } = useCart();
  const router = useRouter();

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

  const shippingTotal = getShippingTotal();
  const orderTotal = cartTotal + shippingTotal;

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
