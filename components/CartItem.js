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
    <div className="flex items-center gap-4 p-4 border-b hover:bg-gray-50 transition-colors" style={{ background: 'white', borderColor: '#fce7f3' }}>
      {/* Product Image - Fixed dimensions */}
      <div style={{ 
        position: 'relative', 
        width: '80px', 
        height: '80px', 
        flexShrink: 0,
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <Image
          src={item.image}
          alt={item.name}
          fill
          style={{ objectFit: 'cover' }}
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
          style={{ 
            background: '#fce7f3', 
            color: '#ec4899',
            padding: '4px',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer'
          }}
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </button>

        <span style={{ width: '32px', textAlign: 'center', fontWeight: 500 }}>{item.quantity}</span>

        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          style={{ 
            background: '#fce7f3', 
            color: '#ec4899',
            padding: '4px',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer'
          }}
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Subtotal */}
      <div style={{ textAlign: 'right', minWidth: '80px' }}>
        <p style={{ fontWeight: 500, color: '#111827' }}>
          <IndianRupee className="inline w-4 h-4" />
          {subtotal.toFixed(2)}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => removeFromCart(item.id)}
        style={{ 
          color: '#ec4899',
          padding: '8px',
          borderRadius: '8px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer'
        }}
        aria-label="Remove item"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default CartItem;
