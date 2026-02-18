import { useCart } from '@/context/CartContext';
import { ShoppingCart, IndianRupee, ArrowLeft, Plus, Minus, Trash2, Package, Clock, CheckCircle } from 'lucide-react';
import CartItem from './CartItem';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

const Cart = () => {
  const { items, getCartTotal, clearCart } = useCart();
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

  const estimatedShipping = cartTotal > 500 ? 0 : 50;
  const estimatedTax = cartTotal * 0.18; // 18% GST
  const orderTotal = cartTotal + estimatedShipping + estimatedTax;

  if (items.length === 0) {
    return (
      <div style={{ background: '#fff5f5', minHeight: '100vh' }} className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ 
              background: '#fce7f3',
              border: '2px solid #ec4899'
            }}>
              <ShoppingCart className="w-10 h-10" style={{ color: '#ec4899' }} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ 
              fontFamily: 'Pacifico, cursive',
              background: 'linear-gradient(135deg, #ec4899, #be185d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all"
              style={{
                background: 'linear-gradient(135deg, #ec4899, #be185d)',
                color: 'white',
                boxShadow: '0 4px 14px rgba(236, 72, 153, 0.3)',
                textDecoration: 'none'
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#fff5f5' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ 
            fontFamily: 'Pacifico, cursive',
            background: 'linear-gradient(135deg, #ec4899, #be185d)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Shopping Cart</h1>
          <p className="text-gray-600">{itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="rounded-lg shadow-sm border" style={{ background: 'white', borderColor: '#fce7f3' }}>
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </Link>
              
              <motion.button
                onClick={handleClearCart}
                className="px-6 py-3 font-medium transition-all rounded-lg"
                style={{
                  background: 'transparent',
                  color: '#ec4899',
                  border: '2px solid #ec4899'
                }}
                whileHover={{ scale: 1.05, backgroundColor: '#fce7f3' }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear Cart
                </div>
              </motion.button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-lg shadow-sm border p-6 sticky top-4" style={{ background: 'white', borderColor: '#fce7f3' }}>
              <h2 className="text-lg font-semibold mb-4" style={{ color: '#374151' }}>Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between" style={{ color: '#6b7280' }}>
                  <span>Subtotal ({itemCount} items)</span>
                  <span>
                    <IndianRupee className="inline w-3 h-3" />
                    {cartTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between" style={{ color: '#6b7280' }}>
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Shipping
                  </span>
                  <span className="font-medium">
                    {estimatedShipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      <>
                        <IndianRupee className="inline w-3 h-3" />
                        {estimatedShipping.toFixed(2)}
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between" style={{ color: '#6b7280' }}>
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Estimated Tax
                  </span>
                  <span>
                    <IndianRupee className="inline w-3 h-3" />
                    {estimatedTax.toFixed(2)}
                  </span>
                </div>
                {estimatedShipping === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg mb-4"
                    style={{ 
                      background: 'linear-gradient(135deg, #fce7f3, #dbeafe)',
                      border: '1px solid #ec4899'
                    }}
                  >
                    <p className="text-sm font-medium text-center" style={{ color: '#be185d' }}>
                      🎉 Free shipping on orders above ₹500!
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="border-t border-pink-soft pt-4 mb-6">
                <div className="flex justify-between text-lg font-semibold" style={{ color: '#111827' }}>
                  <span>Order Total</span>
                  <span>
                    <IndianRupee className="inline w-4 h-4" />
                    {orderTotal.toFixed(2)}
                  </span>
                </div>
                {estimatedShipping === 0 && (
                  <div className="text-center mt-2">
                    <span className="text-sm font-medium" style={{ color: '#ec4899' }}>
                      You saved ₹50 on shipping!
                    </span>
                  </div>
                )}
              </div>

              <motion.button
                onClick={handleCheckout}
                className="w-full py-3 rounded-lg font-medium transition-all"
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #be185d)',
                  color: 'white',
                  boxShadow: '0 4px 14px rgba(236, 72, 153, 0.3)',
                  border: 'none'
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Proceed to Checkout
                </div>
              </motion.button>

              <div className="mt-4 text-center">
                <Link href="/" className="text-sm hover:underline" style={{ color: '#ec4899' }}>
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
