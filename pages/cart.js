import Cart from '@/components/Cart';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CartPage() {
  return (
    <>
      <Head>
        <title>Shopping Cart - Nidsscrochet</title>
        <meta name="description" content="View and manage your shopping cart" />
      </Head>

      {/* Minimal cart-page header — keeps focus on the cart only */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,107,157,0.12)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.25rem',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link href="/" style={{
            fontFamily: "'Pacifico', cursive",
            fontSize: '1.35rem',
            background: 'linear-gradient(135deg, #ff6b9d, #c2185b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textDecoration: 'none',
          }}>
            Nidsscrochet
          </Link>
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: '#ff6b9d',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            padding: '0.4rem 0.9rem',
            borderRadius: '50px',
            border: '1.5px solid rgba(255,107,157,0.25)',
            background: 'rgba(255,107,157,0.04)',
            transition: 'all 0.2s ease',
          }}>
            <ArrowLeft style={{ width: '14px', height: '14px' }} />
            Continue Shopping
          </Link>
        </div>
      </header>

      <Cart />
    </>
  );
}
