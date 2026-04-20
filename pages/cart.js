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
  background: '#ffffff',
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
    justifyContent: 'space-between',
  }}>

    {/* Back arrow — left side */}
    <Link href="/" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
      color: '#B0546A',
      textDecoration: 'none',
      fontSize: '0.82rem',
      fontWeight: 600,
      flexShrink: 0,
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Back
    </Link>

    {/* Brand — center */}
    <Link href="/" style={{
      fontFamily: "'Pacifico', cursive",
      fontSize: '1.35rem',
      background: 'linear-gradient(135deg, #ff6b9d, #c2185b)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textDecoration: 'none',
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
    }}>
      Nidsscrochet
    </Link>

    {/* Right spacer — keeps brand truly centered */}
    <div style={{ width: '52px', flexShrink: 0 }} aria-hidden="true" />

  </div>
</header>

      <Cart />
    </>
  );
}
