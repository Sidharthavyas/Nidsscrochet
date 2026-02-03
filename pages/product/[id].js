// pages/product/[id].js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/Home.module.css';

export default function ProductPage({ product, error }) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  if (error || !product) {
    return (
      <div className={styles.mainContainer}>
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <h1>Product Not Found</h1>
          <button onClick={() => router.push('/')} className={styles.retryButton}>
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const productImages = product.images && product.images.length > 0
    ? product.images
    : [product.image];

  const productUrl = typeof window !== 'undefined'
    ? window.location.href
    : `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product._id}`;

  const handleShare = async () => {
    const shareData = {
      title: `${product.name} | Nidsscrochet`,
      text: `Check out this beautiful ${product.name} from Nidsscrochet! ₹${product.price}`,
      url: productUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  return (
    <>
      <Head>
        <title>{product.name} | Nidsscrochet by Nidhi Tripathi</title>
        <meta name="description" content={product.description} />

        {/* Keywords */}
        <meta name="keywords" content={`${product.name}, ${product.category}, crochet, handmade, Nidsscrochet, buy online India`} />

        {/* Canonical URL */}
        <link rel="canonical" href={`https://www.nidsscrochet.in/product/${product._id}`} />

        {/* Robots */}
        <meta name="robots" content="index, follow" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://www.nidsscrochet.in/product/${product._id}`} />
        <meta property="og:title" content={`${product.name} | Nidsscrochet`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={productImages[0]} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="1200" />
        <meta property="og:site_name" content="Nidsscrochet" />
        <meta property="og:locale" content="en_IN" />
        <meta property="product:price:amount" content={product.price} />
        <meta property="product:price:currency" content="INR" />
        <meta property="product:availability" content={product.stock > 0 ? "in stock" : "out of stock"} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`https://www.nidsscrochet.in/product/${product._id}`} />
        <meta name="twitter:title" content={`${product.name} | Nidsscrochet`} />
        <meta name="twitter:description" content={product.description} />
        <meta name="twitter:image" content={productImages[0]} />

        {/* JSON-LD Product Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": product.name,
              "description": product.description,
              "image": productImages,
              "brand": {
                "@type": "Brand",
                "name": "Nidsscrochet"
              },
              "manufacturer": {
                "@type": "Organization",
                "name": "Nidsscrochet",
                "url": "https://www.nidsscrochet.in"
              },
              "offers": {
                "@type": "Offer",
                "url": `https://www.nidsscrochet.in/product/${product._id}`,
                "priceCurrency": "INR",
                "price": product.price.toString().replace(/[^0-9]/g, ''),
                "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "seller": {
                  "@type": "Organization",
                  "name": "Nidsscrochet"
                }
              },
              "category": product.category,
              "isHandmade": true
            })
          }}
        />
      </Head>

      <main className={styles.mainContainer}>
        {/* Back Button */}
        <div style={{ padding: '6rem 2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
          <motion.button
            onClick={() => {
              // Use back navigation if we have history, otherwise go home
              if (typeof window !== 'undefined' && window.history.length > 2) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            className={styles.backButton}
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back to Collections
          </motion.button>
        </div>

        {/* Product Content */}
        <div className={styles.productPageContainer}>
          <div className={styles.modalGrid}>
            {/* Image Gallery */}
            <div className={styles.modalImageCarousel}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className={styles.modalImage}
                >
                  <Image
                    src={productImages[currentImageIndex]}
                    alt={`${product.name} - Image ${currentImageIndex + 1}`}
                    fill
                    className={styles.modalImg}
                    unoptimized
                    priority
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
                  />
                </motion.div>
              </AnimatePresence>

              {productImages.length > 1 && (
                <>
                  <button
                    className={`${styles.carouselBtn} ${styles.carouselBtnPrev}`}
                    onClick={prevImage}
                  >
                    ←
                  </button>
                  <button
                    className={`${styles.carouselBtn} ${styles.carouselBtnNext}`}
                    onClick={nextImage}
                  >
                    →
                  </button>

                  <div className={styles.carouselDots}>
                    {productImages.map((_, idx) => (
                      <button
                        key={idx}
                        className={`${styles.carouselDot} ${idx === currentImageIndex ? styles.carouselDotActive : ''}`}
                        onClick={() => setCurrentImageIndex(idx)}
                      />
                    ))}
                  </div>
                </>
              )}

              <div className={styles.imageCounter}>
                {currentImageIndex + 1} / {productImages.length}
              </div>
            </div>

            {/* Product Details */}
            <div className={styles.modalDetails}>
              <span className={styles.modalCategory}>{product.category}</span>

              <h1>{product.name}</h1>

              <p className={styles.modalDescription}>{product.description}</p>

              <div className={styles.modalPriceSection}>
                <div className={styles.priceWrapper}>
                  <span className={styles.priceLabel}>Price</span>
                  <span className={styles.modalPrice}>₹{product.price}</span>
                </div>
                <span className={styles.modalStock}>
                  {product.stock > 0 ? (
                    <>
                      <span className={styles.stockDot}>●</span>
                      {product.stock} in stock
                    </>
                  ) : (
                    <>
                      <span className={styles.stockDotOut}>●</span>
                      Out of stock
                    </>
                  )}
                </span>
              </div>

              <div className={styles.productFeatures}>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🧶</span>
                  <span>Handcrafted</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>✨</span>
                  <span>Premium Quality</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>💝</span>
                  <span>Gift Ready</span>
                </div>
              </div>

              <div className={styles.modalActions}>
                {/* Share Button */}
                <motion.button
                  onClick={handleShare}
                  className={`${styles.modalBtn} ${styles.modalBtnShare}`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={styles.btnIcon}>🔗</span>
                  Share this Product
                </motion.button>

                <motion.a
                  href="https://www.instagram.com/nidsscrochet?igsh=cXp1NWFtNWplaHc3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={styles.btnIcon}>📷</span>
                  Order on Instagram
                </motion.a>

                <motion.a
                  href="tel:9029562156"
                  className={`${styles.modalBtn} ${styles.modalBtnSecondary}`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={styles.btnIcon}>📞</span>
                  Call Us
                </motion.a>
              </div>
            </div>
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <ShareModal
            product={product}
            productUrl={productUrl}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </main>
    </>
  );
}

// Server-side rendering to fetch product data
export async function getServerSideProps({ params }) {
  const { id } = params;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/products?id=${id}`);
    const data = await res.json();

    if (!data.success || !data.data) {
      return {
        props: {
          error: 'Product not found',
          product: null,
        },
      };
    }

    return {
      props: {
        product: data.data,
        error: null,
      },
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      props: {
        error: 'Failed to load product',
        product: null,
      },
    };
  }
}

// Share Modal Component
function ShareModal({ product, productUrl, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareText = `Check out this beautiful ${product.name} from Nidsscrochet! ₹${product.price}`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(productUrl);

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(product.images?.[0] || product.image)}&description=${encodeURIComponent(product.description)}`,
  };

  return (
    <motion.div
      className={styles.shareModalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.shareModalContent}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.shareModalClose} onClick={onClose}>✕</button>

        <h3 className={styles.shareModalTitle}>Share this Product</h3>

        <div className={styles.shareOptions}>
          {/* Copy Link */}
          <motion.button
            className={styles.shareOption}
            onClick={handleCopyLink}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.shareIcon}>{copied ? '✓' : '🔗'}</span>
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </motion.button>

          {/* WhatsApp */}
          <motion.a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.shareOption} ${styles.whatsapp}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.shareIcon}>💬</span>
            <span>WhatsApp</span>
          </motion.a>

          {/* Facebook */}
          <motion.a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.shareOption} ${styles.facebook}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.shareIcon}>📘</span>
            <span>Facebook</span>
          </motion.a>

          {/* Twitter */}
          <motion.a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.shareOption} ${styles.twitter}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.shareIcon}>🐦</span>
            <span>Twitter</span>
          </motion.a>

          {/* Pinterest */}
          <motion.a
            href={shareLinks.pinterest}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.shareOption} ${styles.pinterest}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.shareIcon}>📌</span>
            <span>Pinterest</span>
          </motion.a>
        </div>
      </motion.div>
    </motion.div>
  );
}