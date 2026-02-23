import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, IndianRupee } from 'lucide-react';
import Image from 'next/image';
import styles from '../styles/Cart.module.css';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity > 0) {
      updateQuantity(item.id, newQuantity);
    } else {
      removeFromCart(item.id);
    }
  };

  const safePrice = parseFloat(String(item.price).replace(/[^\d.]/g, '')) || 0;
  const subtotal = safePrice * item.quantity;

  return (
    <div className={styles.cartItem}>
      {/* Product Image */}
      <div className={styles.itemImageWrap}>
        <Image
          src={item.image}
          alt={item.name}
          fill
          style={{ objectFit: 'cover' }}
          sizes="80px"
        />
      </div>

      {/* Product Details */}
      <div className={styles.itemInfo}>
        <h3 className={styles.itemName}>{item.name}</h3>
        <p className={styles.itemPrice}>
          <IndianRupee className={styles.itemPriceIcon} />
          {safePrice.toFixed(2)} each
        </p>
      </div>

      {/* Quantity Controls */}
      <div className={styles.qtyControls}>
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          className={styles.qtyBtn}
          aria-label="Decrease quantity"
        >
          <Minus className={styles.qtyBtnIcon} />
        </button>
        <span className={styles.qtyValue}>{item.quantity}</span>
        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          className={styles.qtyBtn}
          aria-label="Increase quantity"
        >
          <Plus className={styles.qtyBtnIcon} />
        </button>
      </div>

      {/* Subtotal */}
      <div className={styles.itemSubtotal}>
        <p className={styles.itemSubtotalPrice}>
          <IndianRupee className={styles.subtotalIcon} />
          {subtotal.toFixed(2)}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => removeFromCart(item.id)}
        className={styles.removeBtn}
        aria-label="Remove item"
      >
        <Trash2 className={styles.removeBtnIcon} />
      </button>
    </div>
  );
};

export default CartItem;
