import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, ShoppingBag, Package, IndianRupee, Printer, Phone, Instagram } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function OrderSuccess() {
  const router = useRouter();
  const { orderId, paymentId, paymentMethod } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    fetch(`/api/razorpay/get-order?orderId=${orderId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.order) setOrder(data.order);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <>
      <Head>
        <title>Order Successful - Nidsscrochet</title>
        <meta name="description" content="Your order has been placed successfully" />
        <style>{`
          @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes scaleIn { from{opacity:0;transform:scale(0.7)} to{opacity:1;transform:scale(1)} }
          @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
          @media print {
            body { background: white !important; }
            header, .no-print { display: none !important; }
            .print-only { display: block !important; }
            div { box-shadow: none !important; border: 1px solid #eee !important; }
          }
          .print-only { display: none; }
        `}</style>
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
        <Navbar />

        <div style={{ maxWidth: '460px', margin: '0 auto', padding: '2.5rem 1rem 3rem' }}>
          {/* Success Icon */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', animation: 'scaleIn 0.5s ease both' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #d4edda, #c3e6cb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem', animation: 'pulse 2s ease infinite',
            }}>
              <CheckCircle style={{ width: '38px', height: '38px', color: '#28a745' }} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--black)', marginBottom: '0.35rem' }}>
              Order Successful!
            </h1>
            <p style={{ color: 'var(--text-gray)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>

          {/* Order Details Card */}
          <div style={{
            background: 'var(--white)', borderRadius: '16px', padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(255,107,157,0.08)',
            marginBottom: '1rem', animation: 'fadeInUp 0.4s ease 0.15s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <Package style={{ width: '18px', height: '18px', color: 'var(--pink)' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--black)', margin: 0 }}>Order Details</h2>
            </div>

            {loading ? (
              <p style={{ color: 'var(--text-gray)', fontSize: '0.88rem' }}>Loading order details...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-gray)' }}>Order ID</span>
                  <span style={{ fontWeight: 600, color: 'var(--black)', fontSize: '0.82rem', wordBreak: 'break-all', textAlign: 'right', maxWidth: '55%' }}>
                    {orderId || '—'}
                  </span>
                </div>
                {paymentId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-gray)' }}>Payment ID</span>
                    <span style={{ fontWeight: 600, color: 'var(--black)', fontSize: '0.82rem', wordBreak: 'break-all', textAlign: 'right', maxWidth: '55%' }}>
                      {paymentId}
                    </span>
                  </div>
                )}
                {order && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--text-gray)' }}>Amount Paid</span>
                    <span style={{ fontWeight: 600, color: 'var(--pink-dark)', display: 'flex', alignItems: 'center' }}>
                      <IndianRupee style={{ width: '13px', height: '13px' }} />{order.amount?.toFixed(2)}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-gray)' }}>Payment Method</span>
                  <span style={{ fontWeight: 600, color: paymentMethod === 'cod' ? '#d97706' : '#059669', fontSize: '0.85rem' }}>
                    {paymentMethod === 'cod'
                      ? <><Package style={{ width: '13px', height: '13px', display: 'inline' }} /> Cash on Delivery</>
                      : <><CheckCircle style={{ width: '13px', height: '13px', display: 'inline', color: '#059669' }} /> Paid Online</>}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-gray)' }}>Date</span>
                  <span style={{ fontWeight: 600, color: 'var(--black)' }}>
                    {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-gray)' }}>Status</span>
                  <span style={{ fontWeight: 600, color: '#28a745' }}>
                    {paymentMethod === 'cod'
                      ? <><Package style={{ width: '13px', height: '13px', display: 'inline' }} /> Confirmed</>
                      : <><CheckCircle style={{ width: '13px', height: '13px', display: 'inline', color: '#28a745' }} /> Paid</>}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Order Items — if fetched */}
          {order?.items?.length > 0 && (
            <div style={{
              background: 'var(--white)', borderRadius: '16px', padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(255,107,157,0.08)',
              marginBottom: '1rem', animation: 'fadeInUp 0.4s ease 0.2s both',
            }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--black)', marginBottom: '0.75rem' }}>Items Ordered</h3>
              {order.items.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.5rem 0',
                  borderBottom: idx < order.items.length - 1 ? '1px solid rgba(255,107,157,0.06)' : 'none',
                }}>
                  {item.image && (
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--black)' }}>{item.name}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>Qty: {item.quantity}</p>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--black)' }}>
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* What's Next */}
          <div style={{
            background: 'var(--pink-soft)', borderRadius: '14px', padding: '1rem 1.25rem',
            marginBottom: '1.25rem', border: '1px solid rgba(255,107,157,0.12)',
            animation: 'fadeInUp 0.4s ease 0.25s both',
          }}>
            <h3 style={{ fontWeight: 700, color: 'var(--pink-dark)', marginBottom: '0.5rem', fontSize: '0.92rem' }}>What's Next?</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', color: 'var(--black)', lineHeight: 1.8 }}>
              <li>• Order confirmation email on its way</li>
              <li>• Processing within 1–2 business days</li>
              <li>• Tracking info once shipped</li>
              <li>• Delivery in 3–5 business days</li>
            </ul>
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', animation: 'fadeInUp 0.4s ease 0.35s both' }}>
            <Link href="/" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.8rem', borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--pink), var(--pink-dark))',
              color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.92rem',
              boxShadow: 'var(--shadow-pink)', transition: 'all 0.3s ease',
            }}>
              <ShoppingBag style={{ width: '18px', height: '18px' }} />Continue Shopping
            </Link>
            <button
              onClick={() => window.print()}
              className="no-print"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.75rem', borderRadius: '12px', border: '1.5px solid var(--pink)',
                background: 'var(--white)', color: 'var(--pink)', fontWeight: 600, fontSize: '0.9rem',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s ease',
              }}
            >
              <Printer style={{ width: '16px', height: '16px' }} /> Download / Print Receipt
            </button>
          </div>

          {/* Help */}
          <div style={{ textAlign: 'center', marginTop: '2rem', animation: 'fadeInUp 0.4s ease 0.4s both' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '0.5rem' }}>Need help with your order?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <a href="tel:9029562156" style={{ fontSize: '0.85rem', color: 'var(--pink)', textDecoration: 'none', fontWeight: 500 }}>
                <Phone style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} /> Call Us: 9029562156
              </a>
              <a href="https://www.instagram.com/Nidsscrochet?igsh=cXp1NWFtNWplaHc3"
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.85rem', color: 'var(--pink)', textDecoration: 'none', fontWeight: 500 }}
              ><Instagram style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} /> Message on Instagram</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
