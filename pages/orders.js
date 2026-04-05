import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { useAuth, SignedIn } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';

export default function MyOrders() {
    const { isLoaded, userId } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isLoaded && !userId) {
            router.push('/');
        }
    }, [isLoaded, userId, router]);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!userId) return;
            try {
                const res = await fetch('/api/orders/user');
                const data = await res.json();
                if (data.success) {
                    setOrders(data.data);
                } else {
                    setError(data.message || 'Failed to fetch orders');
                }
            } catch (err) {
                console.error(err);
                setError('Something went wrong.');
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchOrders();
    }, [userId]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered': return '#10b981';
            case 'shipped': return '#3b82f6';
            case 'processing': return '#f59e0b';
            case 'failed':
            case 'cancelled': return '#ef4444';
            case 'paid': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    if (!isLoaded || !userId) return null;

    return (
        <div style={{ backgroundColor: 'var(--cream)', minHeight: '100vh', fontFamily: 'var(--font-poppins)' }}>
            <Head>
                <title>My Orders | Nidsscrochet</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            {/* ── Shared Navbar ── */}
            <Navbar />

            <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '6rem 1.5rem 4rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2.5rem', color: 'var(--black)' }}>
                    Your Orders
                </h1>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-gray)' }}>
                        <div style={{
                            width: '40px', height: '40px',
                            border: '3px solid var(--pink-soft)',
                            borderTopColor: 'var(--pink)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 1rem'
                        }} />
                        Loading your beautiful orders...
                    </div>
                ) : error ? (
                    <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                        {error}
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--white)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <Package size={56} strokeWidth={1} style={{ color: 'var(--pink-soft)', margin: '0 auto 1.25rem', display: 'block' }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--black)' }}>
                            No orders yet
                        </h2>
                        <p style={{ color: 'var(--text-gray)', marginBottom: '2rem' }}>
                            Looks like you haven&apos;t made any purchases yet.
                        </p>
                        <Link href="/" style={{
                            background: 'linear-gradient(135deg, var(--pink), var(--pink-dark))',
                            color: 'white', padding: '0.8rem 2rem',
                            borderRadius: '50px', textDecoration: 'none', fontWeight: 600,
                            display: 'inline-block'
                        }}>
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {orders.map((order) => (
                            <motion.div
                                key={order._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: 'var(--white)',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255,107,157,0.1)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
                                }}
                            >
                                {/* Order Header */}
                                <div style={{
                                    background: 'var(--cream)',
                                    padding: '1rem 1.5rem',
                                    borderBottom: '1px solid rgba(255,107,157,0.08)',
                                    display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
                                }}>
                                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.2rem' }}>Order Placed</div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.2rem' }}>Total</div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>₹{order.amount}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.2rem' }}>Ship To</div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{order.customer.name}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.2rem' }}>Order #</div>
                                        <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.88rem' }}>{order.orderId}</div>
                                    </div>
                                </div>

                                {/* Order Status */}
                                <div style={{ padding: '1.25rem 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ height: '10px', width: '10px', borderRadius: '50%', backgroundColor: getStatusColor(order.status), flexShrink: 0 }} />
                                    <h3 style={{ margin: 0, textTransform: 'capitalize', fontSize: '1.1rem', fontWeight: 700, color: getStatusColor(order.status) }}>
                                        {order.status}
                                    </h3>
                                    {order.paymentMethod === 'cod' && (
                                        <span style={{ fontSize: '0.78rem', background: '#f3f4f6', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #e5e7eb', color: '#6b7280' }}>
                                            Cash on Delivery
                                        </span>
                                    )}
                                </div>

                                {/* Order Items */}
                                <div style={{ padding: '1.25rem 1.5rem' }}>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex', gap: '1.25rem',
                                            marginBottom: idx !== order.items.length - 1 ? '1.25rem' : 0,
                                            paddingBottom: idx !== order.items.length - 1 ? '1.25rem' : 0,
                                            borderBottom: idx !== order.items.length - 1 ? '1px solid rgba(255,107,157,0.08)' : 'none'
                                        }}>
                                            <div style={{ width: '80px', height: '80px', position: 'relative', borderRadius: '10px', overflow: 'hidden', background: '#f9f9f9', flexShrink: 0 }}>
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #fff5f7, #f0f4ff)', borderRadius: '10px' }} />
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <Link href={`/product/${item.productId}`} style={{ textDecoration: 'none', color: 'var(--black)' }}>
                                                    <h4 style={{ margin: '0 0 0.4rem', fontSize: '1rem', fontWeight: 600 }}>{item.name}</h4>
                                                </Link>
                                                <div style={{ color: 'var(--text-gray)', fontSize: '0.88rem', marginBottom: '0.6rem' }}>
                                                    Qty: {item.quantity} × ₹{item.price}
                                                </div>
                                                <Link href={`/product/${item.productId}`} style={{
                                                    display: 'inline-block', background: 'var(--cream)',
                                                    border: '1px solid rgba(255,107,157,0.15)', padding: '0.4rem 1rem',
                                                    borderRadius: '8px', fontSize: '0.82rem', color: 'var(--black)',
                                                    textDecoration: 'none', transition: 'all 0.2s'
                                                }}>
                                                    Buy it again
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Order Summary Footer */}
                                {(order.shippingCharges > 0 || order.discountAmount > 0) && (
                                    <div style={{ padding: '1rem 1.5rem', background: '#fafafa', borderTop: '1px solid rgba(255,107,157,0.08)', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        {order.discountAmount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e91e63' }}>
                                                <span>Discount Applied ({order.couponCode})</span>
                                                <span>-₹{order.discountAmount}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-gray)' }}>
                                            <span>Shipping</span>
                                            <span>{order.shippingCharges === 0 ? 'Free' : `₹${order.shippingCharges}`}</span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
