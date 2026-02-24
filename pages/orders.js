import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useAuth, SignedIn, SignedOut } from '@clerk/nextjs';
import styles from '../styles/Home.module.css';

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
            case 'delivered': return '#10b981'; // Green
            case 'shipped': return '#3b82f6'; // Blue
            case 'processing': return '#f59e0b'; // Yellow
            case 'failed':
            case 'cancelled': return '#ef4444'; // Red
            case 'paid': return '#8b5cf6'; // Purple
            default: return '#6b7280'; // Gray
        }
    };

    if (!isLoaded || !userId) return null;

    return (
        <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', fontFamily: 'var(--font-poppins)' }}>
            <Head>
                <title>My Orders | Nidsscrochet</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            {/* Simple Navbar Header for Orders Page */}
            <nav className={styles.navbar} style={{ position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--gray)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}>
                <div className={styles.navWrapper} style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link href="/" style={{ textDecoration: 'none', color: 'var(--black)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            Nidsscrochet
                        </Link>
                        <Link href="/" style={{ textDecoration: 'none', color: 'var(--pink)', fontWeight: '500' }}>
                            ← Back to Shop
                        </Link>
                    </div>
                </div>
            </nav>

            <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--black)' }}>Your Orders</h1>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-gray)' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid var(--pink)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                        Loading your beautiful orders...
                    </div>
                ) : error ? (
                    <div style={{ background: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                        {error}
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0', background: 'var(--white)', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--black)' }}>No orders yet</h2>
                        <p style={{ color: 'var(--text-gray)', marginBottom: '2rem' }}>Looks like you haven't made any purchases yet.</p>
                        <Link href="/" style={{ background: 'var(--pink)', color: 'white', padding: '0.8rem 2rem', borderRadius: '12px', textDecoration: 'none', fontWeight: '500' }}>
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {orders.map((order) => (
                            <motion.div
                                key={order._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: 'var(--white)',
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    border: '1px solid var(--gray)',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                                }}
                            >
                                {/* Order Header - Amazon Style */}
                                <div style={{ background: 'var(--bg-color)', padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Order Placed</div>
                                            <div style={{ fontWeight: '500' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Total</div>
                                            <div style={{ fontWeight: '500' }}>₹{order.amount}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Ship To</div>
                                            <div style={{ fontWeight: '500' }}>{order.customer.name}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Order #</div>
                                        <div style={{ fontWeight: '500', fontFamily: 'monospace' }}>{order.orderId}</div>
                                    </div>
                                </div>

                                {/* Order Status Bar */}
                                <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ height: '12px', width: '12px', borderRadius: '50%', backgroundColor: getStatusColor(order.status) }} />
                                    <h3 style={{ margin: 0, textTransform: 'capitalize', fontSize: '1.2rem', color: getStatusColor(order.status) }}>
                                        {order.status}
                                    </h3>
                                    {order.paymentMethod === 'cod' && (
                                        <span style={{ fontSize: '0.8rem', background: '#f3f4f6', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}>Cash on Delivery</span>
                                    )}
                                </div>

                                {/* Order Items */}
                                <div style={{ padding: '1.5rem' }}>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '1.5rem', marginBottom: idx !== order.items.length - 1 ? '1.5rem' : 0, paddingBottom: idx !== order.items.length - 1 ? '1.5rem' : 0, borderBottom: idx !== order.items.length - 1 ? '1px solid var(--gray)' : 'none' }}>
                                            <div style={{ width: '80px', height: '80px', position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#f9f9f9', flexShrink: 0 }}>
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🧶</div>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <Link href={`/product/${item.productId}`} style={{ textDecoration: 'none', color: 'var(--black)' }}>
                                                    <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{item.name}</h4>
                                                </Link>
                                                <div style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                                    Qty: {item.quantity} × ₹{item.price}
                                                </div>
                                                <Link href={`/product/${item.productId}`} style={{ display: 'inline-block', background: 'var(--bg-color)', border: '1px solid var(--gray)', padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--black)', textDecoration: 'none', transition: 'all 0.2s' }}>
                                                    Buy it again
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Order Summary Footer */}
                                {(order.shippingCharges > 0 || order.discountAmount > 0) && (
                                    <div style={{ padding: '1rem 1.5rem', background: '#fafafa', borderTop: '1px solid var(--gray)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
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
