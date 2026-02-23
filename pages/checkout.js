import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Lock, ShoppingCart, CreditCard, Truck, Shield, IndianRupee } from 'lucide-react';

// Helper: wait for Razorpay SDK to be available (loaded async in _document.js)
function loadRazorpaySDK() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const maxWait = 10000; // 10 seconds
    const interval = 200;
    let waited = 0;
    const timer = setInterval(() => {
      if (window.Razorpay) { clearInterval(timer); resolve(); }
      waited += interval;
      if (waited >= maxWait) { clearInterval(timer); reject(new Error('Razorpay SDK failed to load. Please refresh and try again.')); }
    }, interval);
  });
}

export default function Checkout() {
  const { items, getCartTotal, clearCart } = useCart();
  const { isSignedIn, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const cartTotal = getCartTotal();
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  useEffect(() => {
    if (!isSignedIn && items.length > 0) {
      localStorage.setItem('checkoutIntent', 'true');
      router.push('/login');
    }
  }, [isSignedIn, items.length, router]);

  useEffect(() => {
    if (items.length === 0 && !loading) {
      router.push('/cart');
    }
  }, [items.length, router, loading]);

  const handleProceedToPayment = async () => {
    if (!isSignedIn) {
      router.push('/login');
      return;
    }

    // Validate delivery details
    if (!address.trim()) {
      setError('Please enter your delivery address');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // 1. Create Razorpay order via API
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cartTotal,
          items,
          customer: {
            name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
            email: user?.emailAddresses?.[0]?.emailAddress || '',
            phone: phone.trim(),
            address: address.trim(),
            notes: notes.trim(),
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // 2. Wait for Razorpay SDK, then open Checkout popup
      await loadRazorpaySDK();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'nidsscrochet',
        description: `Order of ${itemCount} item${itemCount > 1 ? 's' : ''}`,
        image: '/rose.webp',
        order_id: orderData.orderId,
        handler: async function (response) {
          // 3. Verify payment on server
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            // 4. Success — clear cart and redirect
            clearCart();
            router.push(`/order-success?orderId=${verifyData.orderId}&paymentId=${verifyData.paymentId}`);
          } catch (err) {
            setError('Payment verification failed. Contact support if money was deducted.');
            setLoading(false);
          }
        },
        prefill: {
          name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
          email: user?.emailAddresses?.[0]?.emailAddress || '',
          contact: phone.trim(),
        },
        notes: {
          shipping_address: address.trim(),
          order_notes: notes.trim(),
        },
        // Enable all free payment methods
        config: {
          display: {
            blocks: {
              utib: { name: 'Pay using UPI', instruments: [{ method: 'upi' }] },
              other: { name: 'Other Methods', instruments: [{ method: 'card' }, { method: 'netbanking' }, { method: 'wallet' }] },
            },
            sequence: ['block.utib', 'block.other'],
            preferences: { show_default_blocks: true },
          },
        },
        theme: {
          color: '#ff6b9d',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Loading / redirect states
  if (!isSignedIn && items.length > 0) {
    return (
      <div style={styles.loadingPage}>
        <div style={{ textAlign: 'center' }}>
          <div style={styles.spinner} />
          <p style={{ color: 'var(--text-gray)' }}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <div style={styles.loadingPage}>
        <div style={{ textAlign: 'center' }}>
          <ShoppingCart style={{ width: '56px', height: '56px', color: 'var(--pink-soft)', margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--black)', marginBottom: '0.5rem' }}>Your cart is empty</h2>
          <Link href="/" style={{ color: 'var(--pink)', textDecoration: 'none', fontWeight: 600 }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Checkout - nidsscrochet</title>
        <meta name="description" content="Complete your purchase securely" />
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @media (max-width: 768px) {
            .checkout-grid { flex-direction: column !important; }
            .checkout-main { max-width: 100% !important; }
            .checkout-sidebar { max-width: 100% !important; flex: 1 1 100% !important; position: static !important; }
          }
        `}</style>
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
        {/* Navbar */}
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <Link href="/" style={styles.logo}>nidsscrochet</Link>
            <Link href="/cart" style={styles.backBtn}>
              <ArrowLeft style={{ width: '15px', height: '15px' }} />
              Back to Cart
            </Link>
          </div>
        </header>

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
          <div style={{ marginBottom: '1.5rem', animation: 'fadeInUp 0.4s ease both' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--black)', marginBottom: '0.25rem' }}>Checkout</h1>
            <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Complete your order securely</p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              background: '#fff0f0', border: '1.5px solid #ff4d4d', borderRadius: '12px',
              padding: '0.75rem 1rem', marginBottom: '1rem', color: '#cc0000', fontSize: '0.88rem', fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <div className="checkout-grid" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            {/* Left column */}
            <div className="checkout-main" style={{ flex: '1 1 65%', minWidth: 0 }}>
              {/* Account Info */}
              <div style={{ ...styles.card, marginBottom: '1rem', animation: 'fadeInUp 0.4s ease 0.05s both' }}>
                <div style={styles.sectionHeader}>
                  <Shield style={{ width: '18px', height: '18px', color: 'var(--pink)' }} />
                  <h2 style={styles.sectionTitle}>Account</h2>
                </div>
                <div style={{
                  background: 'var(--pink-soft)', borderRadius: '10px', padding: '0.75rem 1rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  color: 'var(--pink-dark)', fontSize: '0.88rem', fontWeight: 500
                }}>
                  <Shield style={{ width: '14px', height: '14px' }} />
                  Signed in as {user?.firstName || user?.emailAddresses?.[0]?.emailAddress}
                </div>
              </div>

              {/* Order Items */}
              <div style={{ ...styles.card, marginBottom: '1rem', animation: 'fadeInUp 0.4s ease 0.1s both' }}>
                <div style={styles.sectionHeader}>
                  <ShoppingCart style={{ width: '18px', height: '18px', color: 'var(--pink)' }} />
                  <h2 style={styles.sectionTitle}>Order Items ({itemCount})</h2>
                </div>
                {items.map((item, idx) => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 0',
                    borderBottom: idx < items.length - 1 ? '1px solid rgba(255,107,157,0.08)' : 'none'
                  }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: 'var(--gray)' }}>
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--black)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>Qty: {item.quantity}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <IndianRupee style={{ width: '14px', height: '14px' }} />{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>₹{item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Information */}
              <div style={{ ...styles.card, animation: 'fadeInUp 0.4s ease 0.15s both' }}>
                <div style={styles.sectionHeader}>
                  <Truck style={{ width: '18px', height: '18px', color: 'var(--pink)' }} />
                  <h2 style={styles.sectionTitle}>Delivery Information</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={styles.label}>Delivery Address *</label>
                    <textarea
                      style={{ ...styles.input, minHeight: '70px', resize: 'vertical' }}
                      rows={3} placeholder="Enter your full delivery address"
                      value={address} onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Phone Number *</label>
                    <input type="tel" style={styles.input} placeholder="Enter your phone number"
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Order Notes (Optional)</label>
                    <textarea style={{ ...styles.input, minHeight: '50px', resize: 'vertical' }}
                      rows={2} placeholder="Special instructions for delivery"
                      value={notes} onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: Order Summary */}
            <div className="checkout-sidebar" style={{ flex: '0 0 340px', position: 'sticky', top: '1rem' }}>
              <div style={{ ...styles.card, animation: 'fadeInUp 0.4s ease 0.2s both' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--black)', marginBottom: '1rem' }}>Order Summary</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-gray)', fontSize: '0.88rem' }}>
                    <span>Subtotal ({itemCount} items)</span>
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <IndianRupee style={{ width: '12px', height: '12px' }} />{cartTotal.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-gray)', fontSize: '0.88rem' }}>
                    <span>Shipping</span>
                    <span style={{ color: 'var(--pink)', fontWeight: 600 }}>Free</span>
                  </div>
                </div>

                <div style={{
                  borderTop: '1.5px solid rgba(255,107,157,0.12)', paddingTop: '0.85rem', marginBottom: '1.2rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--black)' }}>Total</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--pink-dark)', display: 'flex', alignItems: 'center' }}>
                    <IndianRupee style={{ width: '16px', height: '16px' }} />{cartTotal.toFixed(2)}
                  </span>
                </div>

                <button onClick={handleProceedToPayment} disabled={loading} style={{
                  width: '100%', padding: '0.8rem', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, var(--pink), var(--pink-dark))',
                  color: '#fff', fontSize: '0.95rem', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: 'var(--shadow-pink)', transition: 'all 0.3s ease', fontFamily: 'inherit',
                }}>
                  {loading ? (
                    <><div style={{ ...styles.spinner, width: '16px', height: '16px', borderWidth: '2px', margin: 0 }} />Processing...</>
                  ) : (
                    <><CreditCard style={{ width: '18px', height: '18px' }} />Pay ₹{cartTotal.toFixed(2)}</>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', color: 'var(--text-gray)', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <Lock style={{ width: '13px', height: '13px' }} />Secure Checkout via Razorpay
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-gray)', opacity: 0.7 }}>
                    Your payment is encrypted and secure
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  loadingPage: { minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '40px', height: '40px', border: '3px solid var(--pink-soft)', borderTop: '3px solid var(--pink)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' },
  header: { background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,107,157,0.1)', boxShadow: '0 2px 20px rgba(0,0,0,0.04)', position: 'sticky', top: 0, zIndex: 100 },
  headerInner: { maxWidth: '1100px', margin: '0 auto', padding: '0.9rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontFamily: "'Pacifico', cursive", fontSize: '1.4rem', background: 'linear-gradient(135deg, var(--pink), var(--pink-dark))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textDecoration: 'none' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--pink)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600', padding: '0.45rem 1rem', borderRadius: '50px', border: '1.5px solid var(--pink-soft)', background: 'var(--white)', transition: 'all 0.3s ease' },
  card: { background: 'var(--white)', borderRadius: '16px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(255,107,157,0.08)' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' },
  sectionTitle: { fontSize: '1rem', fontWeight: 700, color: 'var(--black)', margin: 0 },
  label: { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--black)', marginBottom: '0.35rem' },
  input: { width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1.5px solid rgba(255,107,157,0.15)', background: 'var(--cream)', fontSize: '0.88rem', fontFamily: 'inherit', color: 'var(--black)', outline: 'none', transition: 'border-color 0.3s ease' },
};
