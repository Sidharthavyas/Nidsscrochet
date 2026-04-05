import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ShoppingBag, Scissors } from 'lucide-react';
import styles from '../styles/Home.module.css';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | Nidsscrochet</title>
        <meta name="description" content="Sorry, the page you're looking for doesn't exist. Browse our handcrafted crochet collections instead!" />
        <meta name="robots" content="noindex, follow" />
      </Head>

      <div className={styles.errorPageContainer}>
        <motion.div
          className={styles.errorPageContent}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className={styles.errorPageEmoji}
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Scissors size={48} strokeWidth={1.2} style={{ color: 'var(--pink)' }} />
          </motion.div>

          <h1 className={styles.errorPageTitle}>Oops! Page Not Found</h1>
          <p className={styles.errorPageText}>
            Looks like this stitch got dropped! The page you&apos;re looking for
            doesn&apos;t exist or has been moved.
          </p>

          <div className={styles.errorPageActions}>
            <Link href="/">
              <motion.a
                className={styles.errorPageBtn}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                style={{ cursor: 'pointer' }}
              >
                <Home size={16} strokeWidth={1.5} style={{ display: 'inline', marginRight: '4px' }} /> Back to Home
              </motion.a>
            </Link>
            <Link href="/#collections">
              <motion.a
                className={styles.errorPageBtnOutline}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                style={{ cursor: 'pointer' }}
              >
                <ShoppingBag size={16} strokeWidth={1.5} style={{ display: 'inline', marginRight: '4px' }} /> Browse Collections
              </motion.a>
            </Link>
          </div>

          <p className={styles.errorPageContact}>
            Need help? Call us at{' '}
            <a href="tel:9029562156" className={styles.errorPageLink}>
              9029562156
            </a>{' '}
            or DM on{' '}
            <a
              href="https://www.instagram.com/Nidsscrochet"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.errorPageLink}
            >
              Instagram
            </a>
          </p>
        </motion.div>
      </div>
    </>
  );
}