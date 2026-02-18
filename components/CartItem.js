import { useCart } from '@/context/CartContext';
import { Minus, Plus, Trash2, IndianRupee } from 'lucide-react';
import Image from 'next/image';

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
    <div className="flex items-center gap-4 p-4 border-b border-pink-soft hover:bg-pink-soft/20 transition-colors" style={{ background: 'var(--white)' }}>
      {/* Product Image */}
      <div className="relative w-20 h-20 flex-shrink-0">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover rounded-lg"
          sizes="80px"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate" style={{ color: '#111827' }}>{item.name}</h3>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
          <IndianRupee className="inline w-3 h-3" />
          {safePrice.toFixed(2)} each
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          className="p-1 rounded-full transition-colors"
          style={{ background: 'var(--pink-soft)', color: 'var(--pink)' }}
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </button>

        <span className="w-8 text-center font-medium">{item.quantity}</span>

        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          className="p-1 rounded-full transition-colors"
          style={{ background: 'var(--pink-soft)', color: 'var(--pink)' }}
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right min-w-[80px]">
        <p className="font-medium" style={{ color: '#111827' }}>
          <IndianRupee className="inline w-4 h-4" />
          {subtotal.toFixed(2)}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => removeFromCart(item.id)}
        className="p-2 rounded-lg transition-colors"
        style={{ color: 'var(--pink)' }}
        aria-label="Remove item"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default CartItem;
