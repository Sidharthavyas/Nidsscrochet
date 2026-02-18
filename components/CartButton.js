import { useCart } from '@/context/CartContext';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const CartButton = () => {
  const { getCartCount } = useCart();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
  }, [getCartCount]);

  return (
    <Link href="/cart" className="relative p-2 hover:bg-pink-soft rounded-lg transition-colors group">
      <ShoppingCart className="w-6 h-6 text-pink group-hover:text-pink-dark transition-colors" />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-pink text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </Link>
  );
};

export default CartButton;
