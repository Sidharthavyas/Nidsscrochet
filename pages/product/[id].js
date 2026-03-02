// pages/product/[id].js

import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/Home.module.css';
import { useCart } from '@/context/CartContext';
import {
  useAuth,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import CartButton from '@/components/CartButton';
import {
  ShoppingCart,
  Plus,
  Minus,
  Truck,
  CreditCard,
} from 'lucide-react';

import connectDB from '../../lib/mongodb';
import Product from '../../models/Product';
import Review from '../../models/Review';

// ================================================
// FORCE-UNLOCK SCROLLING — bulletproof helper
// ================================================
function unlockScroll() {
  document.body.classList.remove('modal-open');
  document.body.classList.remove('no-scroll'); // ★ FIX: also remove no-scroll variant
  document.body.style.overflow = '';
  document.body.style.overflowY = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.documentElement.style.overflow = '';
  document.documentElement.style.overflowY = '';
  // Re-enable touch events explicitly
  document.body.style.touchAction = '';
  document.documentElement.style.touchAction = '';
}

// ================================================
// IMAGE LIGHTBOX (performance-safe)
// ================================================
function ImageLightbox({ images, currentIndex, onClose }) {
  const [activeIndex, setActiveIndex] = useState(currentIndex || 0);
  const [scale, setScale] = useState(1);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);
  const lastTapRef = useRef(0);

  // Lock scroll on open, unlock on close
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => unlockScroll();
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const handleNext = useCallback(() => {
    if (images.length > 1) {
      setActiveIndex((p) => (p + 1) % images.length);
      resetZoom();
    }
  }, [images.length, resetZoom]);

  const handlePrev = useCallback(() => {
    if (images.length > 1) {
      setActiveIndex((p) => (p - 1 + images.length) % images.length);
      resetZoom();
    }
  }, [images.length, resetZoom]);

  const zoomIn = useCallback(() => {
    setScale((p) => Math.min(p + 0.5, 4));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((p) => {
      const n = Math.max(p - 0.5, 1);
      if (n === 1) setDragOffset({ x: 0, y: 0 });
      return n;
    });
  }, []);

  const toggleZoom = useCallback(() => {
    if (scale === 1) setScale(2.5);
    else resetZoom();
  }, [scale, resetZoom]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'ArrowLeft':
          handlePrev();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNext, handlePrev, zoomIn, zoomOut, resetZoom]);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) toggleZoom();
    lastTapRef.current = now;
  };

  const handleTouchStartLB = (e) => {
    if (scale > 1) return;
    touchStartRef.current = e.targetTouches[0].clientX;
  };
  const handleTouchMoveLB = (e) => {
    if (scale > 1) return;
    touchEndRef.current = e.targetTouches[0].clientX;
  };
  const handleTouchEndLB = () => {
    if (scale > 1) return;
    if (!touchStartRef.current || !touchEndRef.current) return;
    const d = touchStartRef.current - touchEndRef.current;
    if (Math.abs(d) > 50) {
      d > 50 ? handleNext() : handlePrev();
    }
    touchStartRef.current = 0;
    touchEndRef.current = 0;
  };

  const handleMouseDown = () => {
    if (scale > 1) setIsDragging(true);
  };
  const handleMouseMove = (e) => {
    if (scale > 1 && isDragging) {
      setDragOffset((p) => ({
        x: p.x + (e.movementX || 0),
        y: p.y + (e.movementY || 0),
      }));
    }
  };
  const handleMouseUp = () => setIsDragging(false);

  return (
    <motion.div
      className={styles.lightboxOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className={styles.lightboxTopBar}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.lightboxCounter}>
          {activeIndex + 1} / {images.length}
        </div>
        <div className={styles.lightboxActions}>
          <button
            className={styles.lightboxActionBtn}
            onClick={zoomOut}
            aria-label="Zoom out"
            disabled={scale <= 1}
            style={{ opacity: scale <= 1 ? 0.4 : 1 }}
          >
            −
          </button>
          <span className={styles.lightboxZoomLevel}>
            {Math.round(scale * 100)}%
          </span>
          <button
            className={styles.lightboxActionBtn}
            onClick={zoomIn}
            aria-label="Zoom in"
            disabled={scale >= 4}
            style={{ opacity: scale >= 4 ? 0.4 : 1 }}
          >
            +
          </button>
          <button
            className={styles.lightboxActionBtn}
            onClick={resetZoom}
            aria-label="Reset zoom"
            style={{ fontSize: '0.85rem' }}
          >
            ↺
          </button>
          <button
            className={styles.lightboxCloseBtn}
            onClick={onClose}
            aria-label="Close lightbox"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main image */}
      <div
        className={styles.lightboxContent}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStartLB}
        onTouchMove={handleTouchMoveLB}
        onTouchEnd={handleTouchEndLB}
      >
        {images.length > 1 && (
          <button
            className={`${styles.lightboxNavBtn} ${styles.lightboxNavPrev}`}
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous image"
          >
            ‹
          </button>
        )}

        {/* ★ FIX: removed mode="wait" — prevents animation queue buildup on rapid swipe */}
        <AnimatePresence initial={false}>
          <motion.div
            key={activeIndex}
            className={styles.lightboxImageWrapper}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleDoubleTap}
            style={{
              cursor:
                scale === 1
                  ? 'zoom-in'
                  : isDragging
                    ? 'grabbing'
                    : 'grab',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <motion.div
              animate={{ scale, x: dragOffset.x, y: dragOffset.y }}
              transition={{
                scale: { duration: 0.2 },
                x: { duration: 0 },
                y: { duration: 0 },
              }}
              className={styles.lightboxImageContainer}
            >
              <Image
                src={images[activeIndex]}
                alt={`Product image ${activeIndex + 1}`}
                fill
                className={styles.lightboxImage}
                unoptimized
                priority
                style={{ objectFit: 'contain', objectPosition: 'center' }}
                draggable={false}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {images.length > 1 && (
          <button
            className={`${styles.lightboxNavBtn} ${styles.lightboxNavNext}`}
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next image"
          >
            ›
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div
          className={styles.lightboxThumbnails}
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              className={`${styles.lightboxThumb} ${idx === activeIndex ? styles.lightboxThumbActive : ''
                }`}
              onClick={() => {
                setActiveIndex(idx);
                resetZoom();
              }}
            >
              <Image
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                width={60}
                height={60}
                style={{ objectFit: 'cover', borderRadius: '8px' }}
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ================================================
// SHARE MODAL
// ================================================
function ShareModal({ product, productUrl, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = productUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `Check out this beautiful ${product.name} from Nidsscrochet! ₹${product.price}`;
  const enc = encodeURIComponent;

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${enc(shareText)}%20${enc(productUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(productUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${enc(shareText)}&url=${enc(productUrl)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${enc(productUrl)}&media=${enc(product.images?.[0] || product.image)}&description=${enc(product.description)}`,
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
        <button className={styles.shareModalClose} onClick={onClose}>
          ✕
        </button>
        <h3 className={styles.shareModalTitle}>Share this Product</h3>
        <div className={styles.shareOptions}>
          <button
            className={styles.shareOption}
            onClick={handleCopyLink}
          >
            <span className={styles.shareIcon}>
              {copied ? '✓' : '🔗'}
            </span>
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.shareOption} ${styles.whatsapp}`}
          >
            <span className={styles.shareIcon}>💬</span>
            <span>WhatsApp</span>
          </a>
          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.shareOption} ${styles.facebook}`}
          >
            <span className={styles.shareIcon}>📘</span>
            <span>Facebook</span>
          </a>
          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.shareOption} ${styles.twitter}`}
          >
            <span className={styles.shareIcon}>🐦</span>
            <span>Twitter</span>
          </a>
          <a
            href={shareLinks.pinterest}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.shareOption} ${styles.pinterest}`}
          >
            <span className={styles.shareIcon}>📌</span>
            <span>Pinterest</span>
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ================================================
// PRODUCT PAGE
// ================================================
export default function ProductPage({
  product,
  error,
  reviews: initialReviews,
  reviewStats: initialStats,
}) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isSignedIn } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ★ FIX 1: zoom hint auto-hides + never blocks touch
  const [showZoomHint, setShowZoomHint] = useState(true);

  // ★ FIX: Touch swipe state for mobile image carousel
  const swipeTouchStartX = useRef(0);
  const swipeTouchStartY = useRef(0);

  // Reviews
  const [reviews, setReviews] = useState(initialReviews || []);
  const [reviewStats, setReviewStats] = useState(() => {
    const def = {
      averageRating: 0,
      reviewCount: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
    if (!initialStats) return def;
    return {
      averageRating: initialStats.averageRating || 0,
      reviewCount: initialStats.reviewCount || 0,
      distribution:
        initialStats.distribution &&
          typeof initialStats.distribution === 'object'
          ? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, ...initialStats.distribution }
          : def.distribution,
    };
  });

  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const reviewSectionRef = useRef(null);

  // ★ FIX 2: Bulletproof scroll unlock on mount + route change + unload
  useEffect(() => {
    // Clear any stale overflow from previous page / leaked modal
    unlockScroll();

    const handleRouteChange = () => {
      unlockScroll();
      setLightboxOpen(false);
      setShowShareModal(false);
      setMobileMenuOpen(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    router.events.on('routeChangeComplete', handleRouteChange);
    window.addEventListener('pagehide', unlockScroll);
    window.addEventListener('beforeunload', unlockScroll);

    return () => {
      unlockScroll();
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteChange);
      window.removeEventListener('pagehide', unlockScroll);
      window.removeEventListener('beforeunload', unlockScroll);
    };
  }, [router]);

  // ★ FIX 3: Auto-hide zoom hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowZoomHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Review submit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess(false);

    if (!reviewName.trim()) {
      setReviewError('Please enter your name');
      return;
    }
    if (reviewRating === 0) {
      setReviewError('Please select a star rating');
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          name: reviewName.trim(),
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setReviewError(data.message || 'Failed to submit review');
        return;
      }

      const newReviews = [data.review, ...reviews];
      setReviews(newReviews);

      const totalRatings = newReviews.reduce((s, r) => s + r.rating, 0);
      const newDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      newReviews.forEach((r) => {
        newDist[r.rating] = (newDist[r.rating] || 0) + 1;
      });
      setReviewStats({
        averageRating:
          Math.round((totalRatings / newReviews.length) * 10) / 10,
        reviewCount: newReviews.length,
        distribution: newDist,
      });

      setReviewName('');
      setReviewRating(0);
      setReviewComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch {
      setReviewError('Something went wrong. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Fallback / loading
  if (router.isFallback) {
    return (
      <div className={styles.mainContainer}>
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.mainContainer}>
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <h1>Product Not Found</h1>
          <Link href="/" className={styles.retryButton}>
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];

  // ★ FIX 4: Use canonical URL to avoid hydration mismatch
  const productUrl = `https://www.Nidsscrochet.in/product/${product._id}`;

  const handleShare = async () => {
    const shareData = {
      title: `${product.name} | Nidsscrochet`,
      text: `Check out this beautiful ${product.name} from Nidsscrochet! ₹${product.price}`,
      url: productUrl,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') setShowShareModal(true);
      }
    } else {
      setShowShareModal(true);
    }
  };

  const nextImage = () =>
    setCurrentImageIndex((p) => (p + 1) % productImages.length);
  const prevImage = () =>
    setCurrentImageIndex(
      (p) => (p - 1 + productImages.length) % productImages.length
    );

  const handleImageClick = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleAddToCart = () => {
    addToCart(
      {
        ...product,
        _id: product._id,
        name: product.name,
        price: product.salePrice || product.price,
        image: productImages[0],
        shipping_charges: product.shipping_charges,
        cod_available: product.cod_available,
      },
      quantity
    );
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const getSalePercent = () => {
    try {
      const orig = parseFloat(
        String(product.price).replace(/[^\d.]/g, '')
      );
      const sale = parseFloat(
        String(product.salePrice).replace(/[^\d.]/g, '')
      );
      if (orig > 0 && sale > 0)
        return Math.round(((orig - sale) / orig) * 100);
    } catch {
      /* ignore */
    }
    return 0;
  };

  return (
    <>
      <Head>
        <title>
          {product.name} | Buy Handcrafted Crochet | Nidsscrochet
        </title>
        <meta
          name="description"
          content={`Buy ${product.name} - ${product.description}. Handcrafted crochet by Nidhi Tripathi. ₹${product.price}. Free Mumbai delivery available!`}
        />
        <meta
          name="keywords"
          content={`${product.name}, ${product.category}, buy ${product.category?.toLowerCase()} online, crochet ${product.category?.toLowerCase()}, handmade ${product.name?.toLowerCase()}, Nidsscrochet, crochet shop Mumbai, handcrafted gifts India`}
        />
        <link
          rel="canonical"
          href={`https://www.Nidsscrochet.in/product/${product._id}`}
        />
        <meta
          name="robots"
          content="index, follow, max-image-preview:large"
        />
        <meta name="author" content="Nidhi Tripathi" />

        <meta property="og:type" content="product" />
        <meta
          property="og:url"
          content={`https://www.Nidsscrochet.in/product/${product._id}`}
        />
        <meta
          property="og:title"
          content={`${product.name} | Nidsscrochet`}
        />
        <meta
          property="og:description"
          content={`${product.description} — Handmade with love by Nidhi Tripathi. ₹${product.price}`}
        />
        <meta property="og:image" content={productImages[0]} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="1200" />
        <meta
          property="og:image:alt"
          content={`${product.name} - Handcrafted crochet by Nidsscrochet`}
        />
        <meta property="og:site_name" content="Nidsscrochet" />
        <meta property="og:locale" content="en_IN" />
        <meta
          property="product:price:amount"
          content={product.price?.toString().replace(/[^\d.]/g, '')}
        />
        <meta property="product:price:currency" content="INR" />
        <meta
          property="product:availability"
          content={product.stock > 0 ? 'in stock' : 'out of stock'}
        />
        <meta property="product:brand" content="Nidsscrochet" />
        <meta property="product:condition" content="new" />
        <meta property="product:category" content={product.category} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`${product.name} — ₹${product.price} | Nidsscrochet`}
        />
        <meta
          name="twitter:description"
          content={`${product.description}. Handcrafted in Mumbai.`}
        />
        <meta name="twitter:image" content={productImages[0]} />
        <meta name="twitter:image:alt" content={product.name} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Product',
                  '@id': `https://www.Nidsscrochet.in/product/${product._id}#product`,
                  name: product.name,
                  description: product.description,
                  image: productImages,
                  sku: product._id,
                  mpn: product._id,
                  brand: {
                    '@type': 'Brand',
                    name: 'Nidsscrochet',
                  },
                  manufacturer: {
                    '@type': 'Organization',
                    name: 'Nidsscrochet',
                    url: 'https://www.Nidsscrochet.in',
                  },
                  category: product.category,
                  material: 'Premium cotton and acrylic yarn',
                  countryOfOrigin: 'IN',
                  offers: {
                    '@type': 'Offer',
                    url: `https://www.Nidsscrochet.in/product/${product._id}`,
                    priceCurrency: 'INR',
                    price:
                      (product.salePrice || product.price)
                        ?.toString()
                        .replace(/[^\d.]/g, '') || '0',
                    availability:
                      product.stock > 0
                        ? 'https://schema.org/InStock'
                        : 'https://schema.org/OutOfStock',
                    itemCondition:
                      'https://schema.org/NewCondition',
                    seller: {
                      '@type': 'Organization',
                      name: 'Nidsscrochet',
                    },
                  },
                  ...(reviewStats.reviewCount > 0
                    ? {
                      aggregateRating: {
                        '@type': 'AggregateRating',
                        ratingValue:
                          reviewStats.averageRating.toString(),
                        reviewCount:
                          reviewStats.reviewCount.toString(),
                        bestRating: '5',
                        worstRating: '1',
                      },
                    }
                    : {}),
                },
                {
                  '@type': 'BreadcrumbList',
                  itemListElement: [
                    {
                      '@type': 'ListItem',
                      position: 1,
                      name: 'Home',
                      item: 'https://www.Nidsscrochet.in',
                    },
                    {
                      '@type': 'ListItem',
                      position: 2,
                      name: 'Collections',
                      item: 'https://www.Nidsscrochet.in/#collections',
                    },
                    {
                      '@type': 'ListItem',
                      position: 3,
                      name: product.category,
                      item: 'https://www.Nidsscrochet.in/#collections',
                    },
                    {
                      '@type': 'ListItem',
                      position: 4,
                      name: product.name,
                      item: `https://www.Nidsscrochet.in/product/${product._id}`,
                    },
                  ],
                },
              ],
            }),
          }}
        />
      </Head>

      <main className={styles.mainContainer}>
        {/* ============ NAVBAR ============ */}
        <nav className={`${styles.navbar} ${styles.scrolled}`}>
          <div className={styles.navWrapper}>
            <div className={styles.navContent}>
              <Link
                href="/"
                className={styles.navBrand}
                style={{ textDecoration: 'none' }}
              >
                Nidsscrochet
              </Link>

              <button
                className={styles.mobileMenuBtn}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>

              <div
                className={`${styles.navLinks} ${mobileMenuOpen ? styles.navLinksMobile : ''
                  }`}
              >
                <Link
                  href="/#collections"
                  className={styles.navLink}
                  style={{ textDecoration: 'none' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Collections
                </Link>

                <SignedIn>
                  <Link
                    href="/orders"
                    className={styles.navLink}
                    style={{ textDecoration: 'none' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                </SignedIn>

                <CartButton />

                <SignedOut>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <SignInButton mode="modal">
                      <button
                        className={styles.navLink}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        className={styles.navCta}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign Up
                      </button>
                    </SignUpButton>
                  </div>
                </SignedOut>

                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>
          </div>
        </nav>

        {/* ============ BREADCRUMBS ============ */}
        <div className={styles.productPageContainer}>
          <div className={styles.breadcrumbs}>
            <Link href="/" className={styles.breadcrumbLink}>
              Home
            </Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <Link
              href="/#collections"
              className={styles.breadcrumbLink}
            >
              Collections
            </Link>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbLink}>
              {product.category}
            </span>
            <span className={styles.breadcrumbSeparator}>/</span>
            <span className={styles.breadcrumbCurrent}>
              {product.name}
            </span>
          </div>
        </div>

        {/* ============ PRODUCT GRID ============ */}
        <div className={styles.productPageContainer}>
          <div className={styles.productDetailGrid}>
            {/* —— Image Gallery —— */}
            <div className={styles.modalImageCarousel}>
              {/* ★ FIX: zoom hint — pointer-events:none + auto-hides */}
              {showZoomHint && (
                <div
                  className={styles.zoomHintOverlay}
                  style={{ pointerEvents: 'none' }}
                >
                  <span>🔍</span> Tap image to zoom
                </div>
              )}

              {/* ★ FIX: Replaced AnimatePresence+motion.div with plain div + CSS fade.
                  framer-motion's animation queue causes the page to "hang" on mobile
                  when the user rapidly swipes or changes images. */}
              <div
                className={styles.modalImage}
                onClick={() => handleImageClick(currentImageIndex)}
                style={{ cursor: 'zoom-in', touchAction: 'pan-y' }}
                onTouchStart={(e) => {
                  swipeTouchStartX.current = e.targetTouches[0].clientX;
                  swipeTouchStartY.current = e.targetTouches[0].clientY;
                }}
                onTouchEnd={(e) => {
                  const dx = swipeTouchStartX.current - e.changedTouches[0].clientX;
                  const dy = Math.abs(swipeTouchStartY.current - e.changedTouches[0].clientY);
                  // Only trigger horizontal swipe if mainly horizontal movement
                  if (Math.abs(dx) > 45 && Math.abs(dx) > dy * 1.5) {
                    e.preventDefault();
                    if (dx > 0) nextImage();
                    else prevImage();
                  }
                }}
              >
                <Image
                  key={currentImageIndex}
                  src={productImages[currentImageIndex]}
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  fill
                  className={styles.modalImg}
                  unoptimized
                  priority={currentImageIndex === 0}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{
                    objectFit: 'contain',
                    objectPosition: 'center',
                  }}
                />
              </div>

              {productImages.length > 1 && (
                <>
                  <button
                    className={`${styles.carouselBtn} ${styles.carouselBtnPrev}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                  >
                    ←
                  </button>
                  <button
                    className={`${styles.carouselBtn} ${styles.carouselBtnNext}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                  >
                    →
                  </button>
                  <div className={styles.carouselDots}>
                    {productImages.map((_, idx) => (
                      <button
                        key={idx}
                        className={`${styles.carouselDot} ${idx === currentImageIndex
                          ? styles.carouselDotActive
                          : ''
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(idx);
                        }}
                      />
                    ))}
                  </div>
                </>
              )}

              {productImages.length > 1 && (
                <div className={styles.thumbnailRow}>
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      className={`${styles.thumbnailButton} ${idx === currentImageIndex
                        ? styles.thumbnailActive
                        : ''
                        }`}
                      onClick={() => setCurrentImageIndex(idx)}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        width={70}
                        height={70}
                        sizes="70px"
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.imageCounter}>
                {currentImageIndex + 1} / {productImages.length}
              </div>
            </div>

            {/* —— Product Details —— */}
            <div className={styles.modalDetails}>
              <span className={styles.modalCategory}>
                {product.category}
              </span>
              <h1>{product.name}</h1>
              <p className={styles.modalDescription}>
                {product.description}
              </p>

              {/* Price */}
              <div className={styles.modalPriceSection}>
                <div className={styles.priceWrapper}>
                  <span className={styles.priceLabel}>Price</span>
                  {product.salePrice ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        className={styles.modalPrice}
                        style={{ color: '#e91e63' }}
                      >
                        ₹{product.salePrice}
                      </span>
                      <span
                        style={{
                          textDecoration: 'line-through',
                          color: '#999',
                          fontSize: '1.2rem',
                        }}
                      >
                        ₹{product.price}
                      </span>
                      {getSalePercent() > 0 && (
                        <span
                          style={{
                            background: '#e91e63',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {getSalePercent()}% OFF
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className={styles.modalPrice}>
                      ₹{product.price}
                    </span>
                  )}
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

              {/* Features */}
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

              {/* Shipping & COD */}
              <div className={styles.shippingInfoMain}>
                <div
                  className={`${styles.shippingBadgeMain} ${product.shipping_charges > 0
                    ? ''
                    : styles.freeShipping
                    }`}
                >
                  <Truck size={18} />
                  <span>
                    {product.shipping_charges > 0
                      ? `₹${product.shipping_charges} Shipping`
                      : 'Free Mumbai Delivery'}
                  </span>
                </div>
                {product.cod_available && (
                  <div className={styles.codBadgeMain}>
                    <CreditCard size={18} />
                    <span>Cash on Delivery Available</span>
                  </div>
                )}
              </div>

              {/* Cart */}
              <div
                className={styles.cartSection}
                style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <span
                    style={{
                      fontWeight: '600',
                      color: '#374151',
                    }}
                  >
                    Quantity:
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() =>
                        setQuantity(Math.max(1, quantity - 1))
                      }
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span
                      style={{
                        padding: '0.5rem 1rem',
                        minWidth: '3rem',
                        textAlign: 'center',
                        fontWeight: '500',
                      }}
                    >
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                  style={{
                    width: '100%',
                    backgroundColor: addedToCart
                      ? '#10b981'
                      : '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor:
                      product.stock <= 0
                        ? 'not-allowed'
                        : 'pointer',
                    opacity: product.stock <= 0 ? 0.5 : 1,
                  }}
                  disabled={product.stock <= 0}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addedToCart ? '✓ Added to Cart' : 'Add to Cart'}
                </button>

                {addedToCart && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: '0.5rem',
                      textAlign: 'center',
                      color: '#10b981',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}
                  >
                    Item added to cart successfully!
                  </motion.div>
                )}
              </div>

              {/* ★ REMOVED: "Order on Instagram" button — using Razorpay now */}
              <div className={styles.modalActions}>
                <button
                  onClick={handleShare}
                  className={`${styles.modalBtn} ${styles.modalBtnShare}`}
                >
                  <span className={styles.btnIcon}>🔗</span>
                  Share this Product
                </button>

                <a
                  href="tel:9029562156"
                  className={`${styles.modalBtn} ${styles.modalBtnSecondary}`}
                >
                  <span className={styles.btnIcon}>📞</span>
                  Call Us
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ============ REVIEWS SECTION ============ */}
        <div className={styles.reviewSection} ref={reviewSectionRef}>
          <h2 className={styles.reviewSectionTitle}>
            Customer Reviews
          </h2>

          {/* Review Summary */}
          <div className={styles.reviewSummary}>
            <div className={styles.reviewSummaryLeft}>
              <div className={styles.reviewBigRating}>
                {reviewStats.reviewCount > 0
                  ? reviewStats.averageRating.toFixed(1)
                  : '—'}
              </div>
              <div className={styles.reviewBigStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={
                      star <=
                        Math.round(reviewStats.averageRating)
                        ? styles.starFilled
                        : styles.starEmpty
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
              <div className={styles.reviewTotalCount}>
                {reviewStats.reviewCount}{' '}
                {reviewStats.reviewCount === 1
                  ? 'review'
                  : 'reviews'}
              </div>
            </div>

            {/* ★ FIX 7: star bars — animate only once when scrolled into view */}
            <div className={styles.reviewSummaryRight}>
              {[5, 4, 3, 2, 1].map((star) => {
                const dist = reviewStats.distribution || {
                  5: 0,
                  4: 0,
                  3: 0,
                  2: 0,
                  1: 0,
                };
                const count =
                  typeof dist[star] === 'number' ? dist[star] : 0;
                const pct =
                  reviewStats.reviewCount > 0
                    ? (count / reviewStats.reviewCount) * 100
                    : 0;
                return (
                  <div key={star} className={styles.starBarRow}>
                    <span className={styles.starBarLabel}>
                      {star}★
                    </span>
                    <div className={styles.starBarTrack}>
                      <motion.div
                        className={styles.starBarFill}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{
                          duration: 0.6,
                          delay: (5 - star) * 0.08,
                        }}
                      />
                    </div>
                    <span className={styles.starBarCount}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review Form */}
          <div className={styles.reviewFormWrapper}>
            <h3 className={styles.reviewFormTitle}>Write a Review</h3>
            <form
              onSubmit={handleReviewSubmit}
              className={styles.reviewForm}
            >
              <div className={styles.reviewFormRow}>
                <label className={styles.reviewLabel}>
                  Your Name
                </label>
                <input
                  type="text"
                  className={styles.reviewInput}
                  placeholder="Enter your name"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  maxLength={80}
                />
              </div>

              <div className={styles.reviewFormRow}>
                <label className={styles.reviewLabel}>Rating</label>
                <div className={styles.starSelector}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className={`${styles.starSelectBtn} ${star <= (reviewHover || reviewRating)
                        ? styles.starSelectActive
                        : ''
                        }`}
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                    >
                      ★
                    </button>
                  ))}
                  {reviewRating > 0 && (
                    <span className={styles.ratingText}>
                      {
                        [
                          '',
                          'Poor',
                          'Fair',
                          'Good',
                          'Very Good',
                          'Excellent',
                        ][reviewRating]
                      }
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.reviewFormRow}>
                <label className={styles.reviewLabel}>
                  Your Review{' '}
                  <span className={styles.optionalLabel}>
                    (optional)
                  </span>
                </label>
                <textarea
                  className={styles.reviewTextarea}
                  placeholder="Share your experience with this product..."
                  value={reviewComment}
                  onChange={(e) =>
                    setReviewComment(e.target.value)
                  }
                  maxLength={1000}
                  rows={4}
                />
                <div className={styles.charCount}>
                  {reviewComment.length}/1000
                </div>
              </div>

              {reviewError && (
                <div
                  className={styles.reviewAlert}
                  data-type="error"
                >
                  {reviewError}
                </div>
              )}
              {reviewSuccess && (
                <div
                  className={styles.reviewAlert}
                  data-type="success"
                >
                  ✓ Thank you for your review!
                </div>
              )}

              <button
                type="submit"
                className={styles.reviewSubmitBtn}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting
                  ? 'Submitting...'
                  : 'Submit Review'}
              </button>
            </form>
          </div>

          {/* ★ FIX 8: review cards — whileInView + once:true, no re-animation */}
          {reviews.length > 0 ? (
            <div className={styles.reviewList}>
              {reviews.map((review, idx) => (
                <motion.div
                  key={review._id || idx}
                  className={styles.reviewCard}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(idx * 0.05, 0.3),
                  }}
                >
                  <div className={styles.reviewCardHeader}>
                    <div className={styles.reviewAvatar}>
                      {review.name?.charAt(0)?.toUpperCase() ||
                        '?'}
                    </div>
                    <div className={styles.reviewMeta}>
                      <span className={styles.reviewAuthor}>
                        {review.name}
                      </span>
                      <span className={styles.reviewDate}>
                        {new Date(
                          review.createdAt
                        ).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className={styles.reviewCardStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={
                            star <= review.rating
                              ? styles.starFilled
                              : styles.starEmpty
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className={styles.reviewComment}>
                      {review.comment}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={styles.noReviews}>
              <span>✨</span>
              <p>
                No reviews yet. Be the first to review this
                product!
              </p>
            </div>
          )}
        </div>

        {/* Modals — only mount when needed */}
        <AnimatePresence>
          {showShareModal && (
            <ShareModal
              product={product}
              productUrl={productUrl}
              onClose={() => setShowShareModal(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {lightboxOpen && (
            <ImageLightbox
              images={productImages}
              currentIndex={lightboxIndex}
              onClose={() => setLightboxOpen(false)}
            />
          )}
        </AnimatePresence>
      </main>
    </>
  );
}

// ================================================
// SSR — direct DB access
// ================================================
export async function getServerSideProps({ params }) {
  const { id } = params;

  try {
    await connectDB();

    const [product, reviewsRaw] = await Promise.all([
      Product.findById(id).lean(),
      Review.find({ productId: id })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    if (!product) {
      return {
        props: {
          error: 'Product not found',
          product: null,
          reviews: [],
          reviewStats: {
            averageRating: 0,
            reviewCount: 0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          },
        },
      };
    }

    const reviewCount = reviewsRaw.length;
    let averageRating = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (reviewCount > 0) {
      let total = 0;
      reviewsRaw.forEach((r) => {
        total += r.rating;
        distribution[r.rating] =
          (distribution[r.rating] || 0) + 1;
      });
      averageRating =
        Math.round((total / reviewCount) * 10) / 10;
    }

    return {
      props: {
        product: JSON.parse(JSON.stringify(product)),
        reviews: JSON.parse(JSON.stringify(reviewsRaw)),
        reviewStats: { averageRating, reviewCount, distribution },
        error: null,
      },
    };
  } catch (err) {
    console.error('Error fetching product:', err);
    return {
      props: {
        error: 'Failed to load product',
        product: null,
        reviews: [],
        reviewStats: {
          averageRating: 0,
          reviewCount: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      },
    };
  }
}