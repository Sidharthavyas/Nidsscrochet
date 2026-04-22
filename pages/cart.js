import Cart from '@/components/Cart';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Cart.module.css';


export default function CartPage() {
  return (
    <>
      <Head>
        <title>Shopping Cart - Nidsscrochet</title>
        <meta name="description" content="View and manage your shopping cart" />
      </Head>

      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>

          {/* Back arrow — left side */}
          <Link href="/" className={styles.headerBackLink}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </Link>

          {/* Brand — center (flexbox centered, no absolute positioning) */}
          <Link href="/" className={styles.headerBrand}>
            <img src="/nidsscrochet-logo.png" alt="Nidsscrochet" className={styles.headerLogoImg} />
          </Link>

          {/* Right spacer — matches back button width for true centering */}
          <div className={styles.headerSpacer} aria-hidden="true" />

        </div>
      </header>

      <Cart />
    </>
  );
}
