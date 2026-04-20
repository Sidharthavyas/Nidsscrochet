import Cart from '@/components/Cart';
import Head from 'next/head';
import Link from 'next/link';


export default function CartPage() {
  return (
    <>
      <Head>
        <title>Shopping Cart - Nidsscrochet</title>
        <meta name="description" content="View and manage your shopping cart" />
      </Head>

      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#ffffff',          // solid — no backdrop-filter (causes Safari bugs on sticky)
        borderBottom: '1px solid rgba(255,107,157,0.12)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.25rem',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',  // keep for future nav items
        }}>
          <Link href="/" style={{
            fontFamily: "'Pacifico', cursive",
            fontSize: '1.35rem',
            background: 'linear-gradient(135deg, #ff6b9d, #c2185b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textDecoration: 'none',
            flexShrink: 0,
          }}>
            Nidsscrochet
          </Link>
         
        </div>
      </header>

      <Cart />
    </>
  );
}
