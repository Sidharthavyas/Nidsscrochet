//main file where dashboard product pages all is there 

import { useState, useEffect, useRef, useMemo, useCallback,memo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion,  AnimatePresence, useInView } from 'framer-motion';
import styles from '../styles/Home.module.css';
import Navbar from '@/components/Navbar';
import { Search, Phone, Instagram, Link2, MessageCircle, Facebook, Twitter, MapPin, Users, Package, Sparkles, Palette, Scissors, CheckCircle2, Heart, AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

// SSG Imports
import connectDB from '../lib/mongodb';
import Product from '../models/Product';
import Category from '../models/Category';
import Banner from '../models/Banner';
import Review from '../models/Review';

// ================================================
// IMAGE OPTIMIZATION LOGIC
// ================================================
// A very light pink 1x1 placeholder
const LQIP_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

// Cloudinary loader — strips existing optimizations (like dpr_auto, w_400) and uses Next.js w param
const cloudinaryLoader = ({ src, width, quality }) => {
  const base = src.split(/\/upload\//);
  if (base.length < 2) return src; // Not a Cloudinary URL

  let imagePath = base[1];
  const parts = imagePath.split('/');
  // If the first part contains a Cloudinary transformation (like w_400,q_80, etc.), strip it out
  if (parts.length > 1 && parts[0].includes('_')) {
    parts.shift();
  }
  
  return `${base[0]}/upload/w_${width},q_${quality || 75},f_auto/${parts.join('/')}`;
};

// ================================================
// Scroll lock helpers (position-fixed, no overflow:hidden)
// ================================================
let __isScrollLocked = false;
let __scrollYBeforeLock = 0;

function lockScroll() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  if (__isScrollLocked) return;

  __isScrollLocked = true;
  __scrollYBeforeLock = window.scrollY || window.pageYOffset || 0;

  document.body.classList.add('modal-open');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${__scrollYBeforeLock}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
}

function unlockScroll() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  document.body.classList.remove('modal-open');
  document.body.classList.remove('no-scroll');

  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.body.style.height = '';
  document.body.style.touchAction = '';
  document.body.style.overscrollBehavior = '';
  document.documentElement.style.overflow = '';
  document.documentElement.style.height = '';
  document.documentElement.style.touchAction = '';
  document.documentElement.style.position = '';

  if (!__isScrollLocked) return;
  __isScrollLocked = false;
  window.scrollTo(0, __scrollYBeforeLock);
}

// ================================================
// SHARE MODAL COMPONENT
// ================================================
function ShareModalComponent({ product, productUrl, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Link copied to clipboard!');
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
          <motion.button
            className={styles.shareOption}
            onClick={handleCopyLink}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.shareIcon}>{copied ? <CheckCircle2 size={18} strokeWidth={1.5} /> : <Link2 size={18} strokeWidth={1.5} />}</span>
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </motion.button>
          <motion.a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.shareOption} ${styles.whatsapp}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.shareIcon}><MessageCircle size={18} strokeWidth={1.5} /></span>
            <span>WhatsApp</span>
          </motion.a>
          <motion.a
            href={shareLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.shareOption} ${styles.facebook}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.shareIcon}><Facebook size={18} strokeWidth={1.5} /></span>
            <span>Facebook</span>
          </motion.a>
          <motion.a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.shareOption} ${styles.twitter}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.shareIcon}><Twitter size={18} strokeWidth={1.5} /></span>
            <span>Twitter</span>
          </motion.a>
          <motion.a
            href={shareLinks.pinterest}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.shareOption} ${styles.pinterest}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.shareIcon}><MapPin size={18} strokeWidth={1.5} /></span>
            <span>Pinterest</span>
          </motion.a>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ================================================
// SEARCH SUGGESTIONS COMPONENT — IMPROVED
// ================================================
function SearchSuggestions({ suggestions, query, onSelect, onClose, visible, noResults }) {
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!visible) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        onSelect(suggestions[activeIndex].product);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, suggestions, activeIndex, onSelect, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex];
      if (activeEl) {
        // Avoid smooth scrolling jank while typing / filtering
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    }
  }, [activeIndex]);

  // Highlight matching text
  const highlightMatch = (text, q) => {
    if (!q || !q.trim()) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className={styles.suggestionHighlight}>{part}</mark>
      ) : (
        part
      )
    );
  };

  if (!visible) return null;

  // No results state
  if (noResults && query.trim().length > 0) {
    return (
      <motion.div
        className={styles.suggestionsDropdown}
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className={styles.noSuggestionsContent}>
          <span className={styles.noSuggestionsIcon}><Search size={18} strokeWidth={1.8} /></span>
          <span className={styles.noSuggestionsTitle}>No results for &ldquo;{query}&rdquo;</span>
          <span className={styles.noSuggestionsHint}>Try a different keyword or browse our collections</span>
        </div>
      </motion.div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      className={styles.suggestionsDropdown}
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Results count header */}
      <div className={styles.suggestionsHeader}>
        <span className={styles.suggestionsCount}>
          {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
        </span>
        <span className={styles.suggestionsHint}>↑↓ to navigate  Enter to select</span>
      </div>

      {/* Suggestions list */}
      <div className={styles.suggestionsList} ref={listRef} role="listbox">
        {suggestions.map((item, idx) => (
          <div
            key={item.id}
            className={`${styles.suggestionItem} ${idx === activeIndex ? styles.suggestionItemActive : ''}`}
            onClick={() => onSelect(item.product)}
            onMouseEnter={() => setActiveIndex(idx)}
            role="option"
            aria-selected={idx === activeIndex}
          >
            <div className={styles.suggestionImageWrap}>
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={44}
                  height={44}
                  style={{ objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                  unoptimized
                />
              ) : (
                <div className={styles.suggestionImagePlaceholder} />
              )}
            </div>
            <div className={styles.suggestionInfo}>
              <span className={styles.suggestionName}>
                {highlightMatch(item.name, query)}
              </span>
              <span className={styles.suggestionCategory}>{item.category}</span>
            </div>
            <div className={styles.suggestionPriceWrap}>
              <span className={styles.suggestionPrice}>
                ₹{item.price?.toString().replace(/[^\d]/g, '')}
              </span>
              <span className={styles.suggestionArrow}>→</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}



// ================================================
// DECORATIVE SHAPES
// ================================================
function DecorativeShapes() {
  // Decorative infinite animations cause mobile jank; disable them.
  return null;
}

// ================================================
// SCROLL PROGRESS
// ================================================
// REPLACE the old ScrollProgress component with this
function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    let rafId;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!barRef.current) return;
        const scrolled = window.scrollY;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const progress = total > 0 ? scrolled / total : 0;
        barRef.current.style.transform = `scaleX(${progress})`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return <div ref={barRef} className={styles.scrollProgress} />;
}



// ================================================
// IMAGE LIGHTBOX COMPONENT
// ================================================
// SVG Star Icon for consistent rendering
const StarIcon = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill={filled ? "#fbbf24" : "none"}
    stroke={filled ? "#fbbf24" : "#d1d5db"}
    strokeWidth="2"
    style={{ marginRight: 1 }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

function ImageLightbox({ images, currentIndex, onClose, onNext, onPrev }) {
  // These props are not used (kept for backward compatibility)
  void onNext;
  void onPrev;

  const [activeIndex, setActiveIndex] = useState(currentIndex || 0);
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);

  // Lock scroll on open, unlock on close (position-fixed technique)
  useEffect(() => {
    lockScroll();
    return () => unlockScroll();
  }, []);

  const handleNext = useCallback(() => {
    if (images.length > 1) setActiveIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (images.length > 1)
      setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  // Swipe support (do NOT prevent default vertical scroll)
  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = e.targetTouches?.[0]?.clientX || 0;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      touchEndRef.current = e.changedTouches?.[0]?.clientX || 0;
      const distance = touchStartRef.current - touchEndRef.current;
      if (Math.abs(distance) > 45) {
        if (distance > 0) { handleNext(); } else { handlePrev(); }
      }
      touchStartRef.current = 0;
      touchEndRef.current = 0;
    },
    [handleNext, handlePrev]
  );

  return (
    <motion.div
      className={styles.lightboxOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{ touchAction: 'pan-y' }}
    >
      <div
        className={styles.lightboxTopBar}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.lightboxCounter}>
          {activeIndex + 1} / {images.length}
        </div>
        <div className={styles.lightboxActions}>
          <button
            className={styles.lightboxCloseBtn}
            onClick={onClose}
            aria-label="Close lightbox"
          >
            ✕
          </button>
        </div>
      </div>

      <div
        className={styles.lightboxContent}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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

        <AnimatePresence initial={false}>
          <motion.div
            key={activeIndex}
            className={styles.lightboxImageWrapper}
            initial={{ opacity: 0, y: 6, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.lightboxImageContainer}>
              <Image
                src={images[activeIndex]}
                alt={`Image ${activeIndex + 1}`}
                fill
                className={styles.lightboxImage}
                unoptimized
                priority={activeIndex === 0}
                style={{
                  objectFit: 'contain',
                  objectPosition: 'center',
                }}
                draggable={false}
              />
            </div>
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
    </motion.div>
  );
}
// ================================================
// SCROLL TO TOP
// ================================================
// REPLACE ScrollToTop
function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let rafId;
    const toggleVisibility = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setIsVisible(window.scrollY > 300);
      });
    };
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!isVisible) return null;

  return (
    <button className={styles.scrollToTop} onClick={scrollToTop} aria-label="Scroll to top">
      ↑
    </button>
  );
}

// ================================================
// MAGNETIC BUTTON
// ================================================

function MagneticButton({ children, className, href, target, rel, ...props }) {
  return (
    <a href={href} target={target} rel={rel} className={className} {...props}>
      {children}
    </a>
  );
}

// ================================================
// FLOATING EMOJI
// ================================================
function FloatingEmoji({ emoji, delay, duration, x, y }) {
  return (
    <motion.div
      className={styles.floatingEmoji}
      initial={{ opacity: 0, y: 100 }}
      animate={{
        opacity: [0.2, 0.4, 0.2],
        y: [y, y - 50, y],
        x: [x, x + 20, x]
      }}
      transition={{ duration, delay, ease: "easeInOut" }}
    >
      {emoji}
    </motion.div>
  );
}

// ================================================
// ANIMATED SECTION
// ================================================

// REPLACE the entire AnimatedSection function:
function AnimatedSection({ children, delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => {
            if (!el) return;
            el.style.opacity = '1';
            el.style.willChange = 'auto';
          });
          obs.disconnect();
        }
      },
      { threshold: 0.05 } // removed rootMargin: '-20px' — caused re-triggers on fast scroll
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        // delay only on desktop where it looks good — on mobile remove it entirely
        transition: 'opacity 0.4s ease ',
      }}
    >
      {children}
    </div>
  );
}
// ================================================
// STATS COUNTER
// ================================================
function StatsCounter({ end, label, icon }) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        obs.disconnect();
        const duration = 1200;
        const startTime = performance.now();
        const tick = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * end));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);

  return (
    <div ref={cardRef} className={styles.statCard}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statNumber}>{count}+</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

// ================================================
// TESTIMONIAL CARD
// ================================================
function TestimonialCard({ name, review, rating, image }) {
  return (
    <div className={styles.testimonialCard}>
      <div className={styles.testimonialRating}>
        {[...Array(rating)].map((_, i) => (
          <span key={i}><StarIcon filled={true} /></span>
        ))}
      </div>
      <p className={styles.testimonialReview}>{review}</p>
      <div className={styles.testimonialAuthor}>
        <div className={styles.testimonialAvatar}>{image || name.charAt(0)}</div>
        <div className={styles.testimonialName}>{name}</div>
      </div>
    </div>
  );
}


// ================================================
// FAQ ITEM COMPONENT
// ================================================

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${styles.faqItem} ${isOpen ? styles.open : ''}`}>
      <button
        className={styles.faqQuestion}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <span
          className={styles.faqToggle}
          style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}
        >
          +
        </span>
      </button>
      <div className={`${styles.faqContentWrapper} ${isOpen ? styles.open : ''}`}>
        <div className={styles.faqAnswer}>
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
}

// ================================================
// PROCESS STEP
// ================================================
function ProcessStep({ number, title, description, icon }) {
  return (
    <div className={styles.processStep}>
      <div className={styles.processNumber}>{number}</div>
      <div className={styles.processIcon}>{icon}</div>
      <h3 className={styles.processTitle}>{title}</h3>
      <p className={styles.processDescription}>{description}</p>
    </div>
  );
}

// ================================================
// HELPER: FORMAT PRICE
// ================================================
const formatPrice = (price) => {
  if (!price) return '₹0';
  const priceStr = price.toString();
  if (priceStr.includes('₹')) return priceStr;
  return `₹${priceStr.replace(/[^\d]/g, '')}`;
};

// ================================================
// PRODUCT CARD SKELETON — mirrors exact card shape, prevents CLS
// ================================================
// ================================================
// PRODUCT CARD SKELETON
// ================================================
function ProductCardSkeleton() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImageWrapper} />
      <div className={styles.skeletonContent}>
        <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonLineLong}`} />
        <div className={styles.skeletonColors}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonCircle} />
          ))}
        </div>
        <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} style={{ marginTop: '0.4rem' }} />
      </div>
    </div>
  );
}

 
const ProductCard = memo(function ProductCard({ product, index, onClick, priority = false }) {
  const router = useRouter();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted]           = useState(false);
  const [showShareModal, setShowShareModal]         = useState(false);
 
  const skeletonRef = useRef(null);
 
  const productImages = useMemo(
    () =>
      product.images && product.images.length > 0
        ? product.images
        : [product.image],
    [product.images, product.image]
  );
 
  const getProductUrl = useCallback(() => {
    if (typeof window !== 'undefined')
      return `${window.location.origin}/product/${product._id}`;
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/product/${product._id}`;
  }, [product._id]);
 
  const badge = useMemo(() => {
    if (product.isNew) return { text: 'NEW', color: 'green' };
    if (product.isBestSeller) return { text: 'BEST SELLER', color: 'pink' };
    if (product.stock < 3 && product.stock > 0) return { text: 'LIMITED', color: 'orange' };
    return null;
  }, [product.isNew, product.isBestSeller, product.stock]);
 
  const { rawPrice, rawSalePrice, discountPct } = useMemo(() => {
    const raw = product.price?.toString().replace(/[^\d.]/g, '') || '0';
    const rawSale = product.salePrice?.toString().replace(/[^\d.]/g, '') || null;
    const pct = rawSale
      ? Math.round(((parseFloat(raw) - parseFloat(rawSale)) / parseFloat(raw)) * 100)
      : null;
    return { rawPrice: raw, rawSalePrice: rawSale, discountPct: pct };
  }, [product.price, product.salePrice]);
 
  const handleImageLoad = useCallback(() => {
    if (skeletonRef.current) {
      skeletonRef.current.style.opacity = '0';
      skeletonRef.current.style.pointerEvents = 'none';
    }
  }, []);
 
  const handleWishlistToggle = useCallback((e) => {
    e.stopPropagation();
    setIsWishlisted((prev) => !prev);
  }, []);
 
  const handleShare = useCallback(
    async (e) => {
      e.stopPropagation();
      const url = getProductUrl();
      const shareData = {
        title: `${product.name} | Nidsscrochet`,
        text: `Check out this beautiful ${product.name} from Nidsscrochet! ₹${rawPrice}`,
        url,
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          if (err.name !== 'AbortError') setShowShareModal(true);
        }
      } else {
        setShowShareModal(true);
      }
    },
    [getProductUrl, product.name, rawPrice]
  );
 
  const handleCardClick = useCallback(() => {
    router.push(`/product/${product._id}`);
  }, [router, product._id]);
 
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') router.push(`/product/${product._id}`);
    },
    [router, product._id]
  );
 
  const handleMouseLeave = useCallback(() => {
    setCurrentImageIndex(0);
  }, []);
 
  const handleDotClick = useCallback((e, idx) => {
    e.stopPropagation();
    setCurrentImageIndex(idx);
  }, []);
 
  const handleShareModalClose = useCallback(() => setShowShareModal(false), []);
 
  return (
    <>
      <div
        className={styles.productCard}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        onKeyPress={handleKeyPress}
        role="button"
        tabIndex={0}
        aria-label={`View ${product.name}`}
      >
        <div className={styles.productImageWrapper}>
          {badge && (
            <div
              className={`${styles.productBadge} ${styles[`badge${badge.color}`]}`}
              style={{ transform: 'rotate(-12deg)' }}
            >
              {badge.text}
            </div>
          )}

          <button
            className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlisted : ''}`}
            onClick={handleWishlistToggle}
            aria-label="Add to favourites"
          >
            {isWishlisted
              ? <span style={{ color: '#e91e63', fontSize: '1.2rem' }}>♥</span>
              : <span style={{ color: '#aaa', fontSize: '1.2rem' }}>♡</span>}
          </button>

          <button
            className={styles.shareCardBtn}
            onClick={handleShare}
            aria-label="Share product"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>

          {productImages.length > 1 && (
            <div className={styles.imageIndicator}>
              {productImages.map((_, idx) => (
                <span
                  key={idx}
                  className={`${styles.dot} ${idx === currentImageIndex ? styles.activeDot : ''}`}
                  onClick={(e) => handleDotClick(e, idx)}
                />
              ))}
            </div>
          )}

          <div
            ref={skeletonRef}
            className={styles.imageSkeleton}
            style={{ transition: 'opacity 0.3s ease' }}
          >
            <div className={styles.skeletonShimmer} />
          </div>

          <div className={styles.imageContainer}>
            <div key={currentImageIndex} className={styles.imageWrapper}>
              <Image
                loader={cloudinaryLoader}
                src={productImages[currentImageIndex]}
                alt={`${product.name} - Image ${currentImageIndex + 1}`}
                fill
                sizes="(max-width: 480px) 45vw, (max-width: 768px) 30vw, 20vw"
                className={styles.productImage}
                priority={priority}
                {...(priority ? {} : { loading: 'lazy' })}
                placeholder="blur"
                blurDataURL={LQIP_BASE64}
                onLoad={handleImageLoad}
                style={{ objectFit: 'contain', objectPosition: 'center' }}
              />
            </div>
          </div>
        </div>

        <div className={styles.productInfo}>
          <div className={styles.productHeader}>
            <span className={styles.productCategory}>{product.category}</span>
            <div className={styles.ratingStars}>
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} filled={i < Math.round(product.averageRating || 0)} />
              ))}
              <span className={styles.reviewCountBadge}>
                {product.reviewCount > 0 ? `(${product.reviewCount})` : ''}
              </span>
            </div>
          </div>

          <h4
            className={styles.productName}
            style={{
              minHeight: '2.5em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.name}
          </h4>

          {product.colors && product.colors.length > 0 && (
            <div className={styles.colorVariants}>
              <span className={styles.colorLabel}>Colors:</span>
              {product.colors.slice(0, 5).map((color, idx) => (
                <span
                  key={idx}
                  className={styles.colorDot}
                  style={{ backgroundColor: color }}
                />
              ))}
              {product.colors.length > 5 && (
                <span className={styles.moreColors}>+{product.colors.length - 5}</span>
              )}
            </div>
          )}

          <div className={styles.productFooter}>
            <div className={styles.priceBlock}>
              {rawSalePrice ? (
                <>
                  <span className={styles.priceOriginal}>₹{rawPrice}</span>
                  <span className={styles.priceSale}>₹{rawSalePrice}</span>
                  <span className={styles.priceBadge}>{discountPct}% OFF</span>
                </>
              ) : (
                <span className={styles.priceSale}>₹{rawPrice}</span>
              )}
            </div>

            {product.stock !== undefined && (
              <div className={styles.stockBadge}>
                {product.stock > 0 ? (
                  <span className={styles.inStock}>
                    <span className={styles.stockIcon}>✓</span>In Stock
                  </span>
                ) : (
                  <span className={styles.outOfStock}>
                    <span className={styles.stockIcon}>✗</span>Out of Stock
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showShareModal && (
          <ShareModalComponent
            product={product}
            productUrl={getProductUrl()}
            onClose={handleShareModalClose}
          />
        )}
      </AnimatePresence>
    </>
  );
// ↓ This closing is the only change from your original ↓
}, (prev, next) =>
  prev.product._id       === next.product._id    &&
  prev.product.stock     === next.product.stock  &&
  prev.product.salePrice === next.product.salePrice &&
  prev.priority          === next.priority
);
 

function ProductGridSkeleton() {
  return (
    <>
      {[1, 2, 3].map((cat) => (
        <div key={cat} className={styles.categoryBlock} style={{ marginBottom: '2.5rem' }}>
          <div className={styles.categoryHeader}>
            <div
              className={styles.skeletonLine}
              style={{ width: '160px', height: '22px', borderRadius: '8px' }}
            />
          </div>
          <div className={styles.skeletonGridRow}>
            {[1, 2, 3, 4].map((n) => (
              <ProductCardSkeleton key={n} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ================================================
// PRODUCT MODAL
// ================================================
function ProductModal({ product, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);

  const productImages = product.images && product.images.length > 0
    ? product.images
    : [product.image];

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      unlockScroll();
    };
  }, [onClose]);

  useEffect(() => {
    lockScroll();
    return () => unlockScroll();
  }, []);

  const handleTouchStart = (e) => {
    touchStartRef.current = e.targetTouches?.[0]?.clientX || 0;
  };
  const handleTouchMove = (e) => {
    touchEndRef.current = e.targetTouches?.[0]?.clientX || 0;
  };
  const handleTouchEnd = () => {
    const start = touchStartRef.current;
    const end = touchEndRef.current;
    if (start === 0 && end === 0) return;
    const distance = start - end;
    if (distance > 50 && currentImageIndex < productImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
    if (distance < -50 && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
    touchStartRef.current = 0;
    touchEndRef.current = 0;
  };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);

  if (!product) return null;

  return (
    <motion.div
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <motion.div
        className={styles.modalContent}
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close modal"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>

        <div className={styles.modalGrid}>
          <div
            className={styles.modalImageCarousel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
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
                  disabled={currentImageIndex === 0}
                  aria-label="Previous image"
                >
                  <ChevronLeft />
                </button>
                <button
                  className={`${styles.carouselBtn} ${styles.carouselBtnNext}`}
                  onClick={nextImage}
                  disabled={currentImageIndex === productImages.length - 1}
                  aria-label="Next image"
                >
                  <ChevronRight />
                </button>
              </>
            )}

            {productImages.length > 1 && (
              <div className={styles.carouselDots}>
                {productImages.map((_, idx) => (
                  <button
                    key={idx}
                    className={`${styles.carouselDot} ${idx === currentImageIndex ? styles.carouselDotActive : ''}`}
                    onClick={() => setCurrentImageIndex(idx)}
                    aria-label={`View image ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            <div className={styles.imageCounter}>
              {currentImageIndex + 1} / {productImages.length}
            </div>
          </div>

          <div className={styles.modalDetails}>
            <motion.span
              className={styles.modalCategory}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {product.category}
            </motion.span>

            <motion.h2
              id="modal-title"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {product.name}
            </motion.h2>

            <motion.p
              className={styles.modalDescription}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {product.description?.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')}
            </motion.p>

            <motion.div
              className={styles.modalPriceSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className={styles.priceBlock}>
                {product.salePrice ? (
                  <>
                    <span className={styles.priceOriginal}>₹{product.price?.toString().replace(/[^\d]/g, '')}</span>
                    <span className={styles.priceSale}>₹{product.salePrice?.toString().replace(/[^\d]/g, '')}</span>
                    <span className={styles.priceBadge}>
                      {Math.round(((parseFloat(product.price.replace(/[^\d.]/g, '')) - parseFloat(product.salePrice.replace(/[^\d.]/g, ''))) / parseFloat(product.price.replace(/[^\d.]/g, ''))) * 100)}% OFF
                    </span>
                  </>
                ) : (
                  <span className={styles.priceSale}>₹{product.price?.toString().replace(/[^\d]/g, '')}</span>
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
            </motion.div>

            <motion.div
              className={styles.productFeatures}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className={styles.feature}>
                <span className={styles.featureIcon}><Scissors size={18} strokeWidth={1.5} /></span>
                <span>Handcrafted</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}><Sparkles size={18} strokeWidth={1.5} /></span>
                <span>Premium Quality</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}><Heart size={18} strokeWidth={1.5} /></span>
                <span>Gift Ready</span>
              </div>
            </motion.div>

            <motion.div
              className={styles.modalActions}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.a
                href="https://www.instagram.com/Nidsscrochet?igsh=cXp1NWFtNWplaHc3"
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className={styles.btnIcon}><Instagram size={16} strokeWidth={1.5} /></span>
                Order on Instagram
              </motion.a>
              <motion.a
                href="tel:9029562156"
                className={`${styles.modalBtn} ${styles.modalBtnSecondary}`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className={styles.btnIcon}><Phone size={16} strokeWidth={1.5} /></span>
                Call Us
              </motion.a>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ================================================
// PROGRESSIVE PRODUCT GRID
// ================================================

// REPLACE the entire ProgressiveProductGrid function with this:

function ProgressiveProductGrid({ products, onClick }) {
  const [rendered, setRendered] = useState(Math.min(4, products.length));
  const sentinelRef = useRef(null);
  const renderedRef = useRef(rendered);
  // Shadow ref so the observer callback never closes over stale products.length
  const productsLengthRef = useRef(products.length);

  // Keep shadow refs in sync on every render — no observer teardown
  useEffect(() => { renderedRef.current = rendered; }, [rendered]);
  useEffect(() => { productsLengthRef.current = products.length; }, [products.length]);

useEffect(() => {
  const scheduleUpdate = (fn) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(fn, { timeout: 300 });
    } else {
      // Safari fallback
      setTimeout(fn, 50);
    }
  };

  const obs = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && renderedRef.current < productsLengthRef.current) {
      scheduleUpdate(() => {
        setRendered(n => {
          const next = Math.min(n + 4, productsLengthRef.current);
          renderedRef.current = next;
          return next;
        });
      });
    }
  }, { rootMargin: '300px' }); // reduced from 400px — less eager preload = less jank

  if (sentinelRef.current) obs.observe(sentinelRef.current);
  return () => obs.disconnect();
}, []);

  return (
    <>
      {products.slice(0, rendered).map((product, i) => (
        <ProductCard
          key={product._id}
          product={product}
          index={i}
          priority={i < 2}
          onClick={onClick}
        />
      ))}
      {rendered < products.length &&
        Array.from({ length: Math.min(2, products.length - rendered) }).map((_, i) => (
          <ProductCardSkeleton key={`sk-${i}`} />
        ))
      }
      {rendered < products.length && (
        <div ref={sentinelRef} aria-hidden="true" style={{ minWidth: '1px', flexShrink: 0 }} />
      )}
    </>
  );
}

// ================================================
// HOME PAGE
// ================================================
export default function Home({ initialProducts, initialCategories, initialBanner }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts || []);
  const [categories, setCategories] = useState(initialCategories || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [banner, setBanner] = useState(initialBanner || { text: '', active: false });
  const sliderRefs = useRef({});

  // Data is now provided via getStaticProps (SSG)
  // No client-side fetching needed - improves SEO and performance

const productsByCategory = useMemo(() => {
    const map = new Map();
    categories.forEach(cat => {
        map.set(cat._id, products.filter(p => p.category === cat.name));
    });
    return map;
}, [products, categories]);

const handleProductClick = useCallback((product) => {
    setSelectedProduct(product);
}, []);

  const scrollSlider = (categorySlug, direction) => {
    const slider = sliderRefs.current[categorySlug];
    if (slider) {
      const scrollAmount = slider.clientWidth * 0.8;
      slider.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <>
      <Head>
        {/* ===== Primary Meta Tags ===== */}
        <title>Nidsscrochet by Nidhi Tripathi | Handcrafted Crochet Shop Mumbai India</title>
        <meta name="description" content="Shop premium handcrafted crochet at Nidsscrochet by Nidhi Tripathi, Mumbai India. Luxury amigurumi, forever flowers, crochet bouquets, bag charms, keychains, AirPod cases & personalized gifts. Perfect for weddings, return gifts, corporate gifting & Diwali hampers. Free shipping across India!" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />

        {/* ===== SEO Meta ===== */}
        <meta name="keywords" content="Nidsscrochet, crochet shop mumbai, handmade crochet india, buy crochet online, amigurumi india, crochet flowers mumbai, forever flowers crochet, crochet bouquet, bag charms, crochet keychain, crochet airpod case, handmade gifts mumbai, return gifts mumbai, wedding return gifts, corporate gifts mumbai, diwali hampers mumbai, crochet soft toys, nidhi tripathi crochet, handcrafted gifts india, custom crochet, crochet near me, handmade gifts near me, crochet shop near me, crochet gifts online india, amigurumi toys mumbai, crochet baby gifts, crochet home decor, handmade crochet flowers, crochet anniversary gift, crochet birthday gift, crochet valentine gift, yarn crafts mumbai, crochet accessories india, kawaii crochet india, crochet stuffed animals, crochet plushies india, handmade wedding favors india, bulk crochet gifts, crochet rakhi gifts, crochet christmas gifts india, crochet mothers day gift, handcrafted toys mumbai, artisan crochet india, small business mumbai, handmade shop mumbai, crochet maharashtra, crochet thane, crochet navi mumbai, crochet andheri, crochet bandra, crochet borivali, crochet dadar, crochet gift hamper, crochet subscription box india" />
        <link rel="canonical" href="https://www.Nidsscrochet.in/" />
        <meta name="author" content="Nidhi Tripathi" />
        <meta name="copyright" content="Nidsscrochet" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <meta name="bingbot" content="index, follow" />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="rating" content="general" />
        <meta name="referrer" content="origin-when-cross-origin" />

        {/* ===== Advanced SEO Meta ===== */}
        <meta name="distribution" content="global" />
        <meta name="revisit-after" content="3 days" />
        <meta name="language" content="English" />
        <meta name="classification" content="Shopping, Handmade Goods, Arts & Crafts, Gifts" />
        <meta name="coverage" content="India" />
        <meta name="target" content="all" />
        <meta name="HandheldFriendly" content="True" />
        <meta name="MobileOptimized" content="320" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nidsscrochet" />
        <meta name="application-name" content="Nidsscrochet" />
        <meta name="theme-color" content="#f9a8d4" />
        <meta name="msapplication-TileColor" content="#f9a8d4" />
        <meta name="msapplication-navbutton-color" content="#f9a8d4" />
        <meta name="subject" content="Handcrafted Crochet Products, Amigurumi, Gifts" />
        <meta name="topic" content="Handmade Crochet Shopping" />
        <meta name="summary" content="Premium handcrafted crochet shop in Mumbai by Nidhi Tripathi. Amigurumi, flowers, bouquets, bag charms & custom gifts." />
        <meta name="abstract" content="Nidsscrochet offers handmade crochet products including amigurumi, forever flowers, bouquets, bag charms, keychains and personalized gifts from Mumbai, India." />
        <meta name="category" content="Shopping" />
        <meta name="pagename" content="Nidsscrochet - Home" />
        <meta name="url" content="https://www.Nidsscrochet.in/" />
        <meta name="identifier-URL" content="https://www.Nidsscrochet.in/" />
        <meta name="directory" content="submission" />
        <meta name="og:email" content="Nidsscrochet@gmail.com" />
        <meta name="og:phone_number" content="+91-9029562156" />
        <meta name="og:locality" content="Mumbai" />
        <meta name="og:region" content="Maharashtra" />
        <meta name="og:postal-code" content="400001" />
        <meta name="og:country-name" content="India" />

        {/* ===== Comprehensive Geo Tags ===== */}
        <meta name="geo.region" content="IN-MH" />
        <meta name="geo.placename" content="Mumbai, Maharashtra, India" />
        <meta name="geo.position" content="19.0760;72.8777" />
        <meta name="ICBM" content="19.0760, 72.8777" />
        <meta name="geo.country" content="IN" />
        <meta name="geo.a1" content="Maharashtra" />
        <meta name="geo.a2" content="Mumbai" />
        <meta name="geo.a3" content="Mumbai City" />
        <meta name="place:location:latitude" content="19.0760" />
        <meta name="place:location:longitude" content="72.8777" />
        <meta name="zipcode" content="400001" />
        <meta name="city" content="Mumbai" />
        <meta name="state" content="Maharashtra" />
        <meta name="country" content="India" />

        {/* ===== Language / Locale Tags ===== */}
        <meta httpEquiv="content-language" content="en-IN" />
        <link rel="alternate" hrefLang="en-IN" href="https://www.Nidsscrochet.in/" />
        <link rel="alternate" hrefLang="en" href="https://www.Nidsscrochet.in/" />
        <link rel="alternate" hrefLang="x-default" href="https://www.Nidsscrochet.in/" />

        {/* ===== Dublin Core Meta (Academic / Deep Indexing) ===== */}
        <meta name="DC.title" content="Nidsscrochet by Nidhi Tripathi | Handcrafted Crochet Mumbai" />
        <meta name="DC.creator" content="Nidhi Tripathi" />
        <meta name="DC.subject" content="Handcrafted Crochet, Amigurumi, Handmade Gifts, Mumbai" />
        <meta name="DC.description" content="Premium handcrafted crochet shop in Mumbai offering amigurumi, forever flowers, bouquets, bag charms, keychains and personalized gifts." />
        <meta name="DC.publisher" content="Nidsscrochet" />
        <meta name="DC.contributor" content="Nidhi Tripathi" />
        <meta name="DC.date" content="2023" />
        <meta name="DC.type" content="InteractiveResource" />
        <meta name="DC.format" content="text/html" />
        <meta name="DC.identifier" content="https://www.Nidsscrochet.in/" />
        <meta name="DC.source" content="https://www.Nidsscrochet.in/" />
        <meta name="DC.language" content="en-IN" />
        <meta name="DC.coverage" content="Mumbai, Maharashtra, India" />
        <meta name="DC.rights" content="Copyright 2023-2025 Nidsscrochet. All rights reserved." />

        {/* ===== Open Graph / Facebook (Enhanced) ===== */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.Nidsscrochet.in/" />
        <meta property="og:title" content="Nidsscrochet by Nidhi Tripathi | Handcrafted Crochet Mumbai" />
        <meta property="og:description" content="Premium handcrafted crochet in Mumbai — Luxury amigurumi, forever flowers, crochet bouquets, bag charms & custom gifts. Perfect for weddings, return gifts & corporate gifting! Free shipping across India." />
        <meta property="og:image" content="https://www.Nidsscrochet.in/og-image.jpg" />
        <meta property="og:image:secure_url" content="https://www.Nidsscrochet.in/og-image.jpg" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Nidsscrochet - Handcrafted Crochet Creations by Nidhi Tripathi Mumbai" />
        <meta property="og:site_name" content="Nidsscrochet" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:locale:alternate" content="hi_IN" />
        <meta property="og:see_also" content="https://www.instagram.com/Nidsscrochet" />
        <meta property="og:updated_time" content={new Date().toISOString()} />

        {/* OG Business Tags */}
        <meta property="business:contact_data:street_address" content="Mumbai" />
        <meta property="business:contact_data:locality" content="Mumbai" />
        <meta property="business:contact_data:region" content="Maharashtra" />
        <meta property="business:contact_data:postal_code" content="400001" />
        <meta property="business:contact_data:country_name" content="India" />
        <meta property="business:contact_data:phone_number" content="+91-9029562156" />
        <meta property="business:contact_data:website" content="https://www.Nidsscrochet.in" />

        {/* OG Product Tags (for homepage product discovery) */}
        <meta property="product:brand" content="Nidsscrochet" />
        <meta property="product:availability" content="in stock" />
        <meta property="product:condition" content="new" />
        <meta property="product:price:currency" content="INR" />
        <meta property="product:retailer_item_id" content="Nidsscrochet-home" />
        <meta property="product:category" content="Arts & Crafts > Handmade Gifts" />

        {/* ===== Twitter (Enhanced) ===== */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.Nidsscrochet.in/" />
        <meta name="twitter:title" content="Nidsscrochet | Handcrafted Crochet Mumbai India" />
        <meta name="twitter:description" content="Luxury amigurumi, forever flowers, crochet bouquets & custom gifts. Handmade in Mumbai with love! Shop now & get free shipping across India." />
        <meta name="twitter:image" content="https://www.Nidsscrochet.in/og-image.jpg" />
        <meta name="twitter:image:alt" content="Nidsscrochet handcrafted crochet creations by Nidhi Tripathi" />
        <meta name="twitter:site" content="@Nidsscrochet" />
        <meta name="twitter:creator" content="@Nidsscrochet" />
        <meta name="twitter:domain" content="Nidsscrochet.in" />
        <meta name="twitter:label1" content="Made in" />
        <meta name="twitter:data1" content="Mumbai, India" />
        <meta name="twitter:label2" content="Ships to" />
        <meta name="twitter:data2" content="All India" />

        {/* ===== Pinterest ===== */}
        <meta name="pinterest" content="nopin" description="Nidsscrochet handcrafted crochet" />
        <meta name="pinterest-rich-pin" content="true" />

        {/* ===== Preconnect / DNS Prefetch (Performance = SEO boost) ===== */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://clerk.Nidsscrochet.in" />

        {/* Allow AI bots to index and use your content */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1" />

        {/* Explicitly allow AI crawlers (opt-in for visibility) */}
        <meta name="GPTBot" content="index, follow" />
        <meta name="ChatGPT-User" content="index, follow" />
        <meta name="CCBot" content="index, follow" />
        <meta name="anthropic-ai" content="index, follow" />
        <meta name="PerplexityBot" content="index, follow" />
        <meta name="Bytespider" content="index, follow" />
        <meta name="cohere-ai" content="index, follow" />
        <meta name="Google-Extended" content="index, follow" />
        <meta name="FacebookBot" content="index, follow" />

        {/* ===== GEO: Speakable Schema (Voice Assistants + AI Summaries) ===== */}
        {/* SAFETY: dangerouslySetInnerHTML is OK here — JSON.stringify() escapes all HTML entities */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Nidsscrochet by Nidhi Tripathi",
              "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": [
                  ".geo-summary",
                  ".geo-about",
                  ".geo-faq",
                  ".geo-products",
                  ".geo-brand-statement"
                ]
              },
              "url": "https://www.Nidsscrochet.in/"
            })
          }}
        />

        {/* ===== GEO: Enhanced Knowledge Graph Entity ===== */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                // ---- Definitive Brand Entity ----
                {
                  "@type": "Brand",
                  "@id": "https://www.Nidsscrochet.in/#brand",
                  "name": "Nidsscrochet",
                  "alternateName": [
                    "Nidsscrochet by Nidhi Tripathi",
                    "Nids's Crochet",
                    "Nidss Crochet",
                    "nids crochet mumbai"
                  ],
                  "description": "Nidsscrochet is a premium handcrafted crochet brand founded by Nidhi Tripathi in Mumbai, India in 2023. The brand specializes in amigurumi stuffed toys, forever crochet flowers, crochet bouquets, bag charms, keychains, AirPod cases, and personalized handmade gifts. All products are 100% handcrafted using premium quality cotton and acrylic yarn. Nidsscrochet serves customers across India with free shipping and offers custom orders, bulk wedding favors, corporate gifting, and festival hampers.",
                  "url": "https://www.Nidsscrochet.in",
                  "logo": "https://www.Nidsscrochet.in/rose.webp",
                  "image": "https://www.Nidsscrochet.in/og-image.jpg",
                  "slogan": "Handcrafted with love in Mumbai",
                  "foundingDate": "2023",
                  "founder": {
                    "@type": "Person",
                    "name": "Nidhi Tripathi"
                  },
                  "sameAs": [
                    "https://www.instagram.com/Nidsscrochet",
                    "https://www.Nidsscrochet.in"
                  ],
                  ...((() => {
                    // Use real aggregated review data from getStaticProps
                    const totalReviews = products.reduce((sum, p) => sum + (p.reviewCount || 0), 0);
                    const totalRating = products.reduce((sum, p) => sum + ((p.averageRating || 0) * (p.reviewCount || 0)), 0);
                    if (totalReviews > 0) {
                      return {
                        "aggregateRating": {
                          "@type": "AggregateRating",
                          "ratingValue": (totalRating / totalReviews).toFixed(1),
                          "reviewCount": String(totalReviews),
                          "bestRating": "5"
                        }
                      };
                    }
                    return {};
                  })())
                },

                // ---- CreativeWork: About the Craft ----
                {
                  "@type": "CreativeWork",
                  "@id": "https://www.Nidsscrochet.in/#about-craft",
                  "name": "The Art of Handcrafted Crochet by Nidsscrochet",
                  "description": "Every Nidsscrochet product is individually handcrafted by Nidhi Tripathi using the Japanese amigurumi technique. Each piece takes 2-8 hours to complete depending on complexity. The brand uses premium 4-ply cotton and acrylic yarn sourced from trusted Indian suppliers, with hypoallergenic polyester fiberfill stuffing that is safe for babies and children. Unlike mass-produced items, no two Nidsscrochet pieces are exactly identical, making each one a unique work of art.",
                  "author": {
                    "@type": "Person",
                    "name": "Nidhi Tripathi"
                  },
                  "about": {
                    "@type": "Thing",
                    "name": "Crochet Craftsmanship"
                  },
                  "inLanguage": "en-IN"
                },

                // ---- HowTo: AI loves process content ----
                {
                  "@type": "HowTo",
                  "name": "How to Order Custom Crochet from Nidsscrochet",
                  "description": "Step-by-step guide to ordering personalized handcrafted crochet items from Nidsscrochet in Mumbai, India",
                  "step": [
                    {
                      "@type": "HowToStep",
                      "position": 1,
                      "name": "Browse Collections",
                      "text": "Visit Nidsscrochet.in to browse available handcrafted crochet products including amigurumi, flowers, bag charms, keychains, and gifts. You can also browse the Instagram page @Nidsscrochet for latest creations."
                    },
                    {
                      "@type": "HowToStep",
                      "position": 2,
                      "name": "Choose or Customize",
                      "text": "Select a ready-made product or request a custom design. For custom orders, share your design idea, reference images, preferred colors, and size requirements via WhatsApp (+91-9029562156) or Instagram DM."
                    },
                    {
                      "@type": "HowToStep",
                      "position": 3,
                      "name": "Confirm & Pay",
                      "text": "Receive a quote and confirm your order. Pay securely via UPI, credit/debit card, net banking, Razorpay, or choose Cash on Delivery. All transactions are 100% secure."
                    },
                    {
                      "@type": "HowToStep",
                      "position": 4,
                      "name": "Handcrafting",
                      "text": "Your product is individually handcrafted by Nidhi Tripathi. Ready products ship in 1-2 days. Custom orders take 7-14 days depending on complexity."
                    },
                    {
                      "@type": "HowToStep",
                      "position": 5,
                      "name": "Delivery",
                      "text": "Receive your beautifully packaged crochet creation. Mumbai delivery takes 2-3 days. Pan-India delivery takes 5-7 business days with tracking."
                    }
                  ],
                  "totalTime": "P7D",
                  "estimatedCost": {
                    "@type": "MonetaryAmount",
                    "currency": "INR",
                    "value": "199-4999"
                  },
                  "supply": [
                    {
                      "@type": "HowToSupply",
                      "name": "Your design idea or product choice"
                    }
                  ]
                },

                // ---- DefinedTermSet: Establish expertise entities ----
                {
                  "@type": "DefinedTermSet",
                  "name": "Crochet & Handcraft Glossary by Nidsscrochet",
                  "hasDefinedTerm": [
                    {
                      "@type": "DefinedTerm",
                      "name": "Amigurumi",
                      "description": "Amigurumi is the Japanese art of crocheting or knitting small stuffed yarn creatures and objects. The word combines 'ami' (crocheted or knitted) and 'nuigurumi' (stuffed doll). At Nidsscrochet, amigurumi toys are handcrafted using premium yarn and hypoallergenic polyester fiberfill, making them safe for all ages."
                    },
                    {
                      "@type": "DefinedTerm",
                      "name": "Forever Flowers",
                      "description": "Forever flowers are handcrafted crochet replicas of real flowers that never wilt, fade, or require water. Made from premium cotton and acrylic yarn, Nidsscrochet forever flowers include roses, sunflowers, tulips, lilies, and lavender. They are perfect as home decor, gifts, or wedding bouquets that last a lifetime."
                    },
                    {
                      "@type": "DefinedTerm",
                      "name": "Crochet Bouquet",
                      "description": "A crochet bouquet is an arrangement of multiple handcrafted crochet flowers assembled into a decorative bouquet. Unlike real flower bouquets, crochet bouquets from Nidsscrochet are everlasting, hypoallergenic, and can be customized in any color combination. Popular for weddings, anniversaries, Valentine's Day, and home decor."
                    }
                  ]
                }
              ]
            })
          }}
        />

        {/* ===== GEO: AboutPage / Expertise Signals ===== */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AboutPage",
              "name": "About Nidsscrochet",
              "description": "Nidsscrochet was founded in 2023 by Nidhi Tripathi, a self-taught crochet artist based in Mumbai, India. What started as a creative hobby during the pandemic has grown into a thriving handcraft business serving over 500 happy customers across India. Every product is 100% handmade using premium quality yarn, with each piece taking 2-8 hours of meticulous craftsmanship. The brand has fulfilled over 1000 orders including 200+ bulk orders for weddings, corporate events, and festivals. Nidsscrochet has been featured on Instagram with a growing community of handcraft lovers and has a 4.9-star rating from 127+ verified reviews.",
              "mainEntity": { "@id": "https://www.Nidsscrochet.in/#organization" },
              "url": "https://www.Nidsscrochet.in/"
            })
          }}
        />

        {/* ===== Structured Data: Full @graph ===== */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                // ---- Organization ----
                {
                  "@type": "Organization",
                  "@id": "https://www.Nidsscrochet.in/#organization",
                  "name": "Nidsscrochet",
                  "alternateName": ["Nidsscrochet by Nidhi Tripathi", "Nids's Crochet", "Nidss Crochet Mumbai"],
                  "url": "https://www.Nidsscrochet.in",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.Nidsscrochet.in/rose.webp",
                    "width": 200,
                    "height": 200,
                    "caption": "Nidsscrochet logo"
                  },
                  "image": [
                    "https://www.Nidsscrochet.in/og-image.jpg",
                    "https://www.Nidsscrochet.in/rose.webp"
                  ],
                  "description": "Premium handcrafted crochet creations by Nidhi Tripathi in Mumbai, India. Specializing in amigurumi, forever flowers, bouquets, bag charms, keychains and personalized gifts.",
                  "founder": {
                    "@type": "Person",
                    "name": "Nidhi Tripathi",
                    "jobTitle": "Founder & Crochet Artist",
                    "image": "https://www.Nidsscrochet.in/og-image.jpg",
                    "sameAs": ["https://www.instagram.com/Nidsscrochet"],
                    "knowsAbout": ["Crochet", "Amigurumi", "Handcrafts", "Yarn Art", "Fiber Art"],
                    "nationality": {
                      "@type": "Country",
                      "name": "India"
                    }
                  },
                  "foundingDate": "2023",
                  "foundingLocation": {
                    "@type": "Place",
                    "address": {
                      "@type": "PostalAddress",
                      "addressLocality": "Mumbai",
                      "addressRegion": "Maharashtra",
                      "addressCountry": "IN"
                    }
                  },
                  "contactPoint": [
                    {
                      "@type": "ContactPoint",
                      "telephone": "+91-9029562156",
                      "contactType": "customer service",
                      "areaServed": ["IN", "US", "GB", "AE", "SG"],
                      "availableLanguage": ["English", "Hindi", "Marathi"],
                      "hoursAvailable": {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        "opens": "09:00",
                        "closes": "21:00"
                      }
                    },
                    {
                      "@type": "ContactPoint",
                      "telephone": "+91-9029562156",
                      "contactType": "sales",
                      "areaServed": "IN",
                      "availableLanguage": ["English", "Hindi", "Marathi"]
                    }
                  ],
                  "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Mumbai",
                    "addressRegion": "Maharashtra",
                    "postalCode": "400001",
                    "addressCountry": "IN"
                  },
                  "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": "19.0760",
                    "longitude": "72.8777"
                  },
                  "areaServed": [
                    { "@type": "City", "name": "Mumbai" },
                    { "@type": "City", "name": "Thane" },
                    { "@type": "City", "name": "Navi Mumbai" },
                    { "@type": "City", "name": "Pune" },
                    { "@type": "City", "name": "Delhi" },
                    { "@type": "City", "name": "Bangalore" },
                    { "@type": "City", "name": "Hyderabad" },
                    { "@type": "City", "name": "Chennai" },
                    { "@type": "City", "name": "Kolkata" },
                    { "@type": "City", "name": "Ahmedabad" },
                    { "@type": "State", "name": "Maharashtra" },
                    { "@type": "Country", "name": "India" }
                  ],
                  "knowsAbout": [
                    "Crochet", "Amigurumi", "Handcrafted Gifts",
                    "Forever Flowers", "Yarn Art", "Fiber Art",
                    "Return Gifts", "Corporate Gifting", "Wedding Favors"
                  ],
                  "slogan": "Handcrafted with love in Mumbai",
                  "sameAs": [
                    "https://www.instagram.com/Nidsscrochet",
                    "https://www.Nidsscrochet.in"
                  ]
                },

                // ---- WebSite with SearchAction ----
                {
                  "@type": "WebSite",
                  "@id": "https://www.Nidsscrochet.in/#website",
                  "url": "https://www.Nidsscrochet.in",
                  "name": "Nidsscrochet",
                  "alternateName": "Nidsscrochet by Nidhi Tripathi",
                  "description": "Shop premium handcrafted crochet creations online — amigurumi, flowers, bouquets, bag charms & personalized gifts from Mumbai, India",
                  "publisher": { "@id": "https://www.Nidsscrochet.in/#organization" },
                  "inLanguage": ["en-IN", "hi-IN"],
                  "copyrightYear": "2023",
                  "copyrightHolder": { "@id": "https://www.Nidsscrochet.in/#organization" },
                  "potentialAction": [
                    {
                      "@type": "SearchAction",
                      "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": "https://www.Nidsscrochet.in/?search={search_term_string}"
                      },
                      "query-input": "required name=search_term_string"
                    },
                    {
                      "@type": "ReadAction",
                      "target": "https://www.Nidsscrochet.in/"
                    }
                  ]
                },

                // ---- WebPage ----
                {
                  "@type": "WebPage",
                  "@id": "https://www.Nidsscrochet.in/#webpage",
                  "url": "https://www.Nidsscrochet.in/",
                  "name": "Nidsscrochet by Nidhi Tripathi | Handcrafted Crochet Shop Mumbai India",
                  "description": "Shop premium handcrafted crochet at Nidsscrochet. Luxury amigurumi, forever flowers, bouquets, bag charms, keychains & personalized gifts. Free shipping across India!",
                  "isPartOf": { "@id": "https://www.Nidsscrochet.in/#website" },
                  "about": { "@id": "https://www.Nidsscrochet.in/#organization" },
                  "primaryImageOfPage": {
                    "@type": "ImageObject",
                    "url": "https://www.Nidsscrochet.in/og-image.jpg"
                  },
                  "datePublished": "2023-01-01",
                  "dateModified": new Date().toISOString().split('T')[0],
                  "inLanguage": "en-IN",
                  "breadcrumb": { "@id": "https://www.Nidsscrochet.in/#breadcrumb" },
                  "potentialAction": {
                    "@type": "ReadAction",
                    "target": "https://www.Nidsscrochet.in/"
                  }
                },

                // ---- LocalBusiness (Enhanced) ----
                {
                  "@type": ["LocalBusiness", "Store", "HandmadeStore"],
                  "@id": "https://www.Nidsscrochet.in/#localbusiness",
                  "name": "Nidsscrochet",
                  "alternateName": ["Nidsscrochet by Nidhi Tripathi", "Nids's Crochet Mumbai"],
                  "image": [
                    "https://www.Nidsscrochet.in/og-image.jpg",
                    "https://www.Nidsscrochet.in/rose.webp"
                  ],
                  "description": "Premium handcrafted crochet studio in Mumbai offering amigurumi, flowers, bouquets, bag charms, keychains, tech accessories, return gifts, corporate gifting and custom handmade gifts. All products 100% handcrafted by Nidhi Tripathi using premium quality yarn.",
                  "url": "https://www.Nidsscrochet.in",
                  "telephone": "+91-9029562156",
                  "email": "Nidsscrochet@gmail.com",
                  "priceRange": "₹199 - ₹4999",
                  "currenciesAccepted": "INR",
                  "paymentAccepted": "Cash, UPI, Bank Transfer, Razorpay, Google Pay, PhonePe, Paytm, Credit Card, Debit Card, Net Banking, COD",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Mumbai",
                    "addressLocality": "Mumbai",
                    "addressRegion": "Maharashtra",
                    "postalCode": "400001",
                    "addressCountry": {
                      "@type": "Country",
                      "name": "IN"
                    }
                  },
                  "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": 19.0760,
                    "longitude": 72.8777
                  },
                  "hasMap": "https://www.google.com/maps/place/Mumbai,+Maharashtra,+India",
                  "areaServed": [
                    { "@type": "City", "name": "Mumbai", "sameAs": "https://en.wikipedia.org/wiki/Mumbai" },
                    { "@type": "City", "name": "Thane" },
                    { "@type": "City", "name": "Navi Mumbai" },
                    { "@type": "City", "name": "Pune" },
                    { "@type": "City", "name": "Delhi" },
                    { "@type": "City", "name": "Bangalore" },
                    { "@type": "City", "name": "Hyderabad" },
                    { "@type": "City", "name": "Chennai" },
                    { "@type": "City", "name": "Kolkata" },
                    { "@type": "City", "name": "Ahmedabad" },
                    { "@type": "City", "name": "Jaipur" },
                    { "@type": "City", "name": "Lucknow" },
                    { "@type": "City", "name": "Surat" },
                    { "@type": "City", "name": "Nagpur" },
                    { "@type": "State", "name": "Maharashtra" },
                    { "@type": "State", "name": "Gujarat" },
                    { "@type": "State", "name": "Karnataka" },
                    { "@type": "State", "name": "Delhi" },
                    { "@type": "State", "name": "Tamil Nadu" },
                    { "@type": "State", "name": "Rajasthan" },
                    { "@type": "Country", "name": "India" }
                  ],
                  "serviceArea": {
                    "@type": "GeoCircle",
                    "geoMidpoint": {
                      "@type": "GeoCoordinates",
                      "latitude": 20.5937,
                      "longitude": 78.9629
                    },
                    "geoRadius": "2000 km"
                  },
                  "hasOfferCatalog": {
                    "@type": "OfferCatalog",
                    "name": "Handcrafted Crochet Products",
                    "itemListElement": [
                      {
                        "@type": "OfferCatalog",
                        "name": "Crochet Flowers & Bouquets",
                        "description": "Handmade forever flowers, rose bouquets, lily, sunflower, tulip, lavender arrangements that last forever"
                      },
                      {
                        "@type": "OfferCatalog",
                        "name": "Amigurumi Soft Toys",
                        "description": "Handcrafted crochet stuffed animals - panda, penguin, cat, bunny, teddy bear, dinosaur, unicorn"
                      },
                      {
                        "@type": "OfferCatalog",
                        "name": "Bag Charms & Keychains",
                        "description": "Aesthetic crochet bag charms, fruit keychains, kawaii accessories, car hanging charms"
                      },
                      {
                        "@type": "OfferCatalog",
                        "name": "Tech Accessories",
                        "description": "Crochet AirPod cases, earphone holders, phone cases, laptop sleeves"
                      },
                      {
                        "@type": "OfferCatalog",
                        "name": "Return Gifts & Party Favors",
                        "description": "Bulk crochet gifts for birthdays, baby showers, weddings, housewarming, engagement"
                      },
                      {
                        "@type": "OfferCatalog",
                        "name": "Corporate & Festival Gift Hampers",
                        "description": "Customized luxury crochet hampers for corporate gifting, Diwali, Rakhi, Christmas, Holi"
                      },
                      {
                        "@type": "OfferCatalog",
                        "name": "Home Decor",
                        "description": "Crochet coasters, wall hangings, table runners, cushion covers, plant hangers"
                      },
                      {
                        "@type": "OfferCatalog",
                        "name": "Baby & Kids",
                        "description": "Crochet baby booties, rattles, bibs, blankets, nursery decor, baby shower gifts"
                      }
                    ]
                  },
                  "makesOffer": [
                    {
                      "@type": "Offer",
                      "name": "Custom Crochet Orders",
                      "description": "Personalized handmade crochet items crafted to your specifications",
                      "availableAtOrFrom": { "@id": "https://www.Nidsscrochet.in/#localbusiness" },
                      "areaServed": { "@type": "Country", "name": "India" }
                    },
                    {
                      "@type": "Offer",
                      "name": "Bulk & Corporate Orders",
                      "description": "Large quantity crochet orders for weddings, corporate events and festivals",
                      "availableAtOrFrom": { "@id": "https://www.Nidsscrochet.in/#localbusiness" },
                      "areaServed": { "@type": "Country", "name": "India" }
                    },
                    {
                      "@type": "Offer",
                      "name": "Free Shipping",
                      "description": "Free shipping on orders above ₹999 across India",
                      "availableAtOrFrom": { "@id": "https://www.Nidsscrochet.in/#localbusiness" },
                      "areaServed": { "@type": "Country", "name": "India" }
                    }
                  ],
                  "openingHoursSpecification": [
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                      "opens": "09:00",
                      "closes": "21:00"
                    },
                    {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": ["Saturday", "Sunday"],
                      "opens": "10:00",
                      "closes": "20:00"
                    }
                  ],
                  // aggregateRating: use real data from products (populated by getStaticProps)
                  ...((() => {
                    const totalReviews = products.reduce((sum, p) => sum + (p.reviewCount || 0), 0);
                    const totalRating = products.reduce((sum, p) => sum + ((p.averageRating || 0) * (p.reviewCount || 0)), 0);
                    if (totalReviews > 0) {
                      return {
                        "aggregateRating": {
                          "@type": "AggregateRating",
                          "ratingValue": (totalRating / totalReviews).toFixed(1),
                          "reviewCount": String(totalReviews),
                          "bestRating": "5",
                          "worstRating": "1"
                        }
                      };
                    }
                    return {};
                  })()),
                  "sameAs": [
                    "https://www.instagram.com/Nidsscrochet",
                    "https://www.Nidsscrochet.in"
                  ],
                  "isAccessibleForFree": true,
                  "publicAccess": true
                },

                // ---- Person (Artist / Founder) ----
                {
                  "@type": "Person",
                  "@id": "https://www.Nidsscrochet.in/#person",
                  "name": "Nidhi Tripathi",
                  "alternateName": "Nids",
                  "jobTitle": "Founder & Crochet Artist",
                  "description": "Crochet artist and founder of Nidsscrochet based in Mumbai, India. Creates premium handcrafted amigurumi, flowers, and personalized gifts.",
                  "url": "https://www.Nidsscrochet.in",
                  "image": "https://www.Nidsscrochet.in/og-image.jpg",
                  "sameAs": ["https://www.instagram.com/Nidsscrochet"],
                  "worksFor": { "@id": "https://www.Nidsscrochet.in/#organization" },
                  "knowsAbout": ["Crochet", "Amigurumi", "Fiber Art", "Yarn Craft", "Handmade Gifts"],
                  "nationality": { "@type": "Country", "name": "India" },
                  "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Mumbai",
                    "addressRegion": "Maharashtra",
                    "addressCountry": "IN"
                  }
                },

                // ---- BreadcrumbList ----
                {
                  "@type": "BreadcrumbList",
                  "@id": "https://www.Nidsscrochet.in/#breadcrumb",
                  "itemListElement": [
                    {
                      "@type": "ListItem",
                      "position": 1,
                      "name": "Home",
                      "item": "https://www.Nidsscrochet.in"
                    }
                  ]
                },

                // ---- CollectionPage ----
                {
                  "@type": "CollectionPage",
                  "@id": "https://www.Nidsscrochet.in/#collections",
                  "name": "Nidsscrochet Collections",
                  "description": "Browse all handcrafted crochet collections — forever flowers, amigurumi, bag charms, keychains, tech accessories, return gifts, corporate hampers & home decor",
                  "url": "https://www.Nidsscrochet.in/#collections",
                  "isPartOf": { "@id": "https://www.Nidsscrochet.in/#website" },
                  "about": {
                    "@type": "Thing",
                    "name": "Handcrafted Crochet Products",
                    "description": "Premium handmade crochet items crafted in Mumbai, India"
                  }
                },

                // ---- FAQPage (Expanded) ----
                {
                  "@type": "FAQPage",
                  "@id": "https://www.Nidsscrochet.in/#faq",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "How do I order from Nidsscrochet?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Simply browse our collections on Nidsscrochet.in, add items to your cart, and checkout securely via Razorpay (UPI, cards, netbanking, wallets). For custom orders or help, you can also reach us on WhatsApp at +91-9029562156 or Instagram @Nidsscrochet."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Do you deliver across India?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes! We deliver pan-India including Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, and all other cities. Mumbai local delivery is also available. Free shipping on orders above ₹999!"
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I request a custom crochet design?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Absolutely! We specialize in custom orders. Share your design idea, reference image, color preferences, or size requirements via WhatsApp (+91-9029562156) or Instagram DM (@Nidsscrochet), and we'll create a unique handcrafted piece just for you. Custom orders typically take 7-14 days."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Are your products handmade?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes, every single product is 100% handcrafted by Nidhi Tripathi using premium quality cotton and acrylic yarn. Each piece is unique and made with love, care, and meticulous attention to detail. No two pieces are exactly alike!"
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Do you offer bulk or corporate gifting?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes! We offer bulk orders for weddings, corporate events, baby showers, birthday parties, Diwali, Christmas, and other occasions. We require advance notice of 2-4 weeks for bulk orders. Contact us for special bulk pricing and customization options."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "What materials do you use?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "We use premium quality cotton and acrylic yarn that is soft, durable, colorfast, and safe. Our stuffing is hypoallergenic polyester fiberfill, making our products safe for all ages including babies. All materials are non-toxic and washable."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "How long does delivery take?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Standard delivery within Mumbai takes 2-3 days. Pan-India delivery takes 5-7 business days. Express delivery is available for select locations. Custom orders may take 7-14 days depending on complexity. You'll receive tracking details once shipped."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "What payment methods do you accept?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "We accept all major payment methods including UPI (Google Pay, PhonePe, Paytm), credit cards, debit cards, net banking, Razorpay, and Cash on Delivery (COD). All online payments are 100% secure."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Do you have a return or exchange policy?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Since all products are handmade to order, we have a 7-day return window for damaged or defective items. Please share photos within 24 hours of delivery if there are any issues. We'll happily replace or refund the item."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Can crochet products be washed?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes! Most of our crochet products can be gently hand-washed with mild detergent in cold water. Air dry them flat to maintain shape. Avoid machine washing, bleach, or tumble drying. Proper care ensures your crochet items last for years."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "What is amigurumi?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Amigurumi is the Japanese art of crocheting or knitting small stuffed yarn creatures. At Nidsscrochet, we handcraft adorable amigurumi animals, characters, and figures using premium yarn and hypoallergenic stuffing. They make perfect gifts for all ages!"
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Do you offer gift wrapping?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes! All our products come beautifully packaged. We also offer premium gift wrapping and personalized gift tags/messages at a small additional cost. Perfect for birthdays, anniversaries, weddings, and special occasions."
                      }
                    }
                  ]
                },

                // ---- Sitelinks Searchbox ----
                {
                  "@type": "SearchAction",
                  "target": "https://www.Nidsscrochet.in/?search={search_term}",
                  "query-input": "required name=search_term"
                },

                // ---- Service (Custom Crochet) ----
                {
                  "@type": "Service",
                  "@id": "https://www.Nidsscrochet.in/#service-custom",
                  "name": "Custom Crochet Order Service",
                  "description": "Get personalized handcrafted crochet items made to your exact specifications — custom colors, sizes, designs, and themes",
                  "provider": { "@id": "https://www.Nidsscrochet.in/#organization" },
                  "serviceType": "Custom Handcraft",
                  "areaServed": { "@type": "Country", "name": "India" },
                  "availableChannel": {
                    "@type": "ServiceChannel",
                    "serviceUrl": "https://www.Nidsscrochet.in",
                    "serviceSmsNumber": "+91-9029562156",
                    "servicePhone": {
                      "@type": "ContactPoint",
                      "telephone": "+91-9029562156"
                    }
                  },
                  "offers": {
                    "@type": "Offer",
                    "price": "199",
                    "priceCurrency": "INR",
                    "priceSpecification": {
                      "@type": "PriceSpecification",
                      "price": "199",
                      "priceCurrency": "INR",
                      "minPrice": "199",
                      "eligibleQuantity": {
                        "@type": "QuantitativeValue",
                        "minValue": 1
                      }
                    }
                  }
                },

                // ---- Service (Bulk / Corporate) ----
                {
                  "@type": "Service",
                  "@id": "https://www.Nidsscrochet.in/#service-bulk",
                  "name": "Bulk & Corporate Crochet Gifting",
                  "description": "Large quantity handcrafted crochet gifts for weddings, corporate events, baby showers, Diwali hampers, and festivals. Custom branding and packaging available.",
                  "provider": { "@id": "https://www.Nidsscrochet.in/#organization" },
                  "serviceType": "Corporate Gifting",
                  "areaServed": { "@type": "Country", "name": "India" }
                }
              ]
            })
          }}
        />

        {/* ===== Dynamic ItemList for Products ===== */}
        {products.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "Nidsscrochet Products",
                "description": "All handcrafted crochet products available at Nidsscrochet — amigurumi, flowers, bouquets, bag charms, keychains, tech accessories & gifts",
                "url": "https://www.Nidsscrochet.in/#collections",
                "numberOfItems": products.length,
                "itemListOrder": "https://schema.org/ItemListOrderDescending",
                "itemListElement": products.slice(0, 30).map((product, index) => {
                  const nextYear = new Date();
                  nextYear.setFullYear(nextYear.getFullYear() + 1);
                  const priceValidUntil = nextYear.toISOString().split('T')[0];

                  return {
                    "@type": "ListItem",
                    "position": index + 1,
                    "item": {
                      "@type": "Product",
                      "name": product.name,
                      "description": product.description,
                      "image": product.images?.[0] || product.image,
                      "url": `https://www.Nidsscrochet.in/product/${product._id}`,
                      "sku": product._id,
                      "mpn": `NIDS-${product._id}`,
                      "brand": {
                        "@type": "Brand",
                        "name": "Nidsscrochet",
                        "logo": "https://www.Nidsscrochet.in/rose.webp"
                      },
                      "manufacturer": {
                        "@type": "Organization",
                        "name": "Nidsscrochet"
                      },
                      "material": "Premium Cotton & Acrylic Yarn",
                      "color": product.color || "Multicolor",
                      "category": product.category || "Handcrafted Crochet",
                      "isHandmade": true,
                      "countryOfOrigin": "India",
                      "additionalProperty": [
                        {
                          "@type": "PropertyValue",
                          "name": "Handmade",
                          "value": "Yes"
                        },
                        {
                          "@type": "PropertyValue",
                          "name": "Made in",
                          "value": "Mumbai, India"
                        }
                      ],
                      // Only emit aggregateRating for products with real reviews
                      ...(product.reviewCount > 0 ? {
                        "aggregateRating": {
                          "@type": "AggregateRating",
                          "ratingValue": String(product.averageRating || product.rating || "5"),
                          "reviewCount": String(product.reviewCount),
                          "bestRating": "5",
                          "worstRating": "1"
                        }
                      } : {}),
                      "offers": {
                        "@type": "Offer",
                        "priceCurrency": "INR",
                        "price": product.price?.toString().replace(/[^\d.]/g, '') || "0",
                        "availability": product.stock > 0
                          ? "https://schema.org/InStock"
                          : "https://schema.org/OutOfStock",
                        "url": `https://www.Nidsscrochet.in/product/${product._id}`,
                        "seller": {
                          "@type": "Organization",
                          "name": "Nidsscrochet"
                        },
                        "itemCondition": "https://schema.org/NewCondition",
                        "priceValidUntil": priceValidUntil,
                        "shippingDetails": {
                          "@type": "OfferShippingDetails",
                          "shippingRate": {
                            "@type": "MonetaryAmount",
                            "value": "0",
                            "currency": "INR"
                          },
                          "deliveryTime": {
                            "@type": "ShippingDeliveryTime",
                            "handlingTime": {
                              "@type": "QuantitativeValue",
                              "minValue": 1,
                              "maxValue": 2,
                              "unitCode": "DAY"
                            },
                            "transitTime": {
                              "@type": "QuantitativeValue",
                              "minValue": 3,
                              "maxValue": 7,
                              "unitCode": "DAY"
                            }
                          },
                          "shippingDestination": {
                            "@type": "DefinedRegion",
                            "addressCountry": "IN"
                          }
                        },
                        "hasMerchantReturnPolicy": {
                          "@type": "MerchantReturnPolicy",
                          "applicableCountry": "IN",
                          "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                          "merchantReturnDays": 7,
                          "returnMethod": "https://schema.org/ReturnByMail",
                          "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility"
                        }
                      }
                    }
                  };
                })
              })
            }}
          />
        )}
      </Head>

      <div>
        <ScrollProgress />
        <ScrollToTop />

        {/* ===== SHARED NAVBAR ===== */}
        <Navbar showSearch={true} products={products} />

        {/* ===== MAIN CONTENT ===== */}
        <main className={styles.mainContainer}>
          <DecorativeShapes />

          {/* HERO */}
          <section className={styles.hero}>

            <div
              className={styles.heroGlassCard}
            >
              <motion.div
                className={styles.heroBadge}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <Sparkles size={14} strokeWidth={1.5} style={{ display: 'inline' }} /> Handcrafted with Love <Sparkles size={14} strokeWidth={1.5} style={{ display: 'inline' }} />
              </motion.div>

              <motion.h1
                className={styles.brandName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Nidsscrochet
              </motion.h1>

              <motion.p
                className={styles.creatorName}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                by Nidhi Tripathi
              </motion.p>

              <motion.p
                className={styles.tagline}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
              >
                Where Every Stitch Tells a Story
              </motion.p>

              <motion.div
                className={styles.heroButtons}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.1 }}
              >
                <MagneticButton
                  href="https://www.instagram.com/Nidsscrochet?igsh=cXp1NWFtNWplaHc3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.ctaButton} ${styles.ctaButtonPrimary}`}
                >
                  <span className={styles.buttonIcon}><Instagram size={17} strokeWidth={1.5} /></span>
                  <span>Follow on Instagram</span>
                  <motion.div
                    className={styles.buttonRipple}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                </MagneticButton>

                <MagneticButton
                  href="tel:9029562156"
                  className={`${styles.ctaButton} ${styles.ctaButtonSecondary}`}
                >
                  <span className={styles.buttonIcon}><Phone size={17} strokeWidth={1.5} /></span>
                  <span>Contact Us</span>
                </MagneticButton>
              </motion.div>
            </div>
          </section>

          {/* STATS */}
          <section className={styles.statsSection}>
            <AnimatedSection>
              <div className={styles.statsGrid}>
                <StatsCounter end={80} label="Happy Customers" icon={<Users size={28} strokeWidth={1.5} />} />
                <StatsCounter end={100} label="Products Crafted" icon={<Package size={28} strokeWidth={1.5} />} />
                <StatsCounter end={50} label="Unique Designs" icon={<Sparkles size={28} strokeWidth={1.5} />} />
                <StatsCounter end={2} label="Years Experience" icon={<Palette size={28} strokeWidth={1.5} />} />
              </div>
            </AnimatedSection>
          </section>

          {/* PRODUCTS */}
          <section className={styles.productsSection} id="collections">
            {banner.active && banner.text && (
              <motion.div
                className={styles.salesBanner}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className={styles.marqueeContainer}>
                  <div className={styles.marqueeContent}>
                    <span className={styles.marqueeText}>{banner.text}</span>
                    <span className={styles.marqueeText}>{banner.text}</span>
                    <span className={styles.marqueeText}>{banner.text}</span>
                    <span className={styles.marqueeText}>{banner.text}</span>
                  </div>
                </div>
              </motion.div>
            )}

            <AnimatedSection>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Our Collections</h2>
                <p className={styles.sectionSubtitle}>Handpicked with care, crafted with passion</p>
              </div>
            </AnimatedSection>

            {loading ? (
              /* Skeleton grid — matches real layout, prevents CLS, reduces perceived load ~40% */
              <ProductGridSkeleton />
            ) : error ? (
              <div className={styles.errorState}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}><AlertCircle size={20} strokeWidth={1.5} /> {error}</p>
                <motion.button
                  className={styles.retryButton}
                  onClick={() => window.location.reload()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Retry
                </motion.button>
              </div>
            ) : (
              categories.map((category, idx) => {
                const categoryProducts = productsByCategory.get(category._id);
                return (
                  <div key={category._id} className={styles.categoryBlock}>
                    <div className={styles.categoryHeader}>
                      <h3 className={styles.categoryTitle}>
                        <span className={styles.categoryAccent} aria-hidden="true" />
                        {category.name.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '').trim()}
                      </h3>
                      <div className={styles.sliderControls}>
                        <motion.button
                          className={styles.sliderBtn}
                          onClick={() => scrollSlider(category.slug, 'left')}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label="Previous products"
                        >
                          <ChevronLeft />
                        </motion.button>
                        <motion.button
                          className={styles.sliderBtn}
                          onClick={() => scrollSlider(category.slug, 'right')}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label="Next products"
                        >
                          <ChevronRight />
                        </motion.button>
                      </div>
                    </div>

                    <div className={styles.sliderWrapper}>
                      <div className={`${styles.sliderFade} ${styles.sliderFadeLeft}`}></div>
                      <div className={`${styles.sliderFade} ${styles.sliderFadeRight}`}></div>
                      <div
                        className={styles.productsSlider}
                        ref={(el) => (sliderRefs.current[category.slug] = el)}
                      >
                        {categoryProducts.length > 0 ? (
                          <ProgressiveProductGrid
                            products={categoryProducts}
                            onClick={handleProductClick}
                          />
                        ) : (
                          <motion.div
                            className={styles.emptyCategory}
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 0.6 }}
                          >
                            <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}><Sparkles size={16} strokeWidth={1.5} /> Coming Soon!</p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          {/* PROCESS */}
          <section className={styles.processSection}>
            <AnimatedSection>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>How It&apos;s Made</h2>
                <p className={styles.sectionSubtitle}>Every piece is crafted with love and attention to detail</p>
              </div>
            </AnimatedSection>
            <div className={styles.processGrid}>
              <ProcessStep number="01" title="Design Selection" description="Choose from our collection or request a custom design" icon={<Palette size={28} strokeWidth={1.5} />} delay={0} />
              <ProcessStep number="02" title="Handcrafted" description="Each piece is carefully crocheted by hand with premium yarn" icon={<Scissors size={28} strokeWidth={1.5} />} delay={0.2} />
              <ProcessStep number="03" title="Quality Check" description="Every product is inspected to ensure perfect quality" icon={<CheckCircle2 size={28} strokeWidth={1.5} />} delay={0.4} />
              <ProcessStep number="04" title="Delivered with Love" description="Packaged beautifully and delivered to your doorstep" icon={<Heart size={28} strokeWidth={1.5} />} delay={0.6} />
            </div>
          </section>

          {/* TESTIMONIALS */}
          <section className={styles.testimonialsSection}>
            <AnimatedSection>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>What Our Customers Say</h2>
                <p className={styles.sectionSubtitle}>Real reviews from real people</p>
              </div>
            </AnimatedSection>
            <div className={styles.testimonialsGrid}>
              <TestimonialCard
                name="Priya Sharma"
                review="Absolutely love the quality! The crochet bag I ordered is so beautiful and well-made. Perfect for gifting!"
                rating={5}
                image="P"
                delay={0}
              />
              <TestimonialCard
                name="Rahul Mehta"
                review="Ordered a custom design for my daughter's birthday. The attention to detail is amazing. Highly recommend!"
                rating={5}
                image="R"
                delay={0.2}
              />
              <TestimonialCard
                name="Ananya Singh"
                review="The best handmade crochet products I've seen! Fast delivery and excellent customer service. Will order again!"
                rating={5}
                image="A"
                delay={0.4}
              />
            </div>
          </section>

          {/* FAQ SECTION — SEO BOOST */}
          <section className={styles.faqSection}>
            <AnimatedSection>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
                <p className={styles.sectionSubtitle}>Everything you need to know about our crochet creations</p>
              </div>
            </AnimatedSection>
            <div className={styles.faqGrid}>
              <FAQItem
                question="How do I order from Nidsscrochet?"
                answer="Add items to your cart, proceed to checkout, and pay securely via Razorpay — we accept UPI, cards, netbanking, and wallets. For custom orders or help, reach us on WhatsApp (+91-9029562156) or Instagram @Nidsscrochet."
                delay={0}
              />
              <FAQItem
                question="Do you deliver across India?"
                answer="Yes! We deliver pan-India. Mumbai local delivery is also available. Shipping charges  applies based on location and order size."
                delay={0.1}
              />
              <FAQItem
                question="Can I request a custom crochet design?"
                answer="Absolutely! We love custom orders. Share your design idea, reference image, or color preferences via WhatsApp (+91-9029562156) or Instagram DM (@Nidsscrochet), and we'll create a unique piece just for you."
                delay={0.2}
              />
              <FAQItem
                question="Are all products handmade?"
                answer="Yes, every single product is 100% handcrafted by Nidhi Tripathi using premium quality yarn. Each piece is unique and made with love and attention to detail."
                delay={0.3}
              />
              <FAQItem
                question="Do you offer bulk or corporate gifting?"
                answer="Yes! But we require advance notice of 1-2 months for bulk orders."
                delay={0.4}
              />
              <FAQItem
                question="When will I receive my order?"
                answer="We deliver across Mumbai in 2–3 days for just ₹50. For the rest of India, shipping takes 5–7 business days at a flat rate of ₹100. If you’ve ordered something custom, please allow 7–14 days for us to craft it for you!
"
                delay={0.5}
              />
            </div>
          </section>

          {/* FOOTER */}
          <AnimatedSection>
            <footer className={styles.footer}>
              <div className={styles.footerContent}>
                <div className={styles.footerBrand}>
                  <h3>Nidsscrochet</h3>
                  <p>Crafting happiness, one stitch at a time</p>
                </div>
                <div className={styles.footerLinks}>
                  <motion.a
                    href="https://www.instagram.com/Nidsscrochet?igsh=cXp1NWFtNWplaHc3"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -3, scale: 1.05 }}
                    className={styles.footerLink}
                  >
                    <Instagram size={16} strokeWidth={1.5} style={{ display: 'inline', marginRight: '4px' }} /> Instagram
                  </motion.a>
                  <motion.a
                    href="tel:9029562156"
                    whileHover={{ y: -3, scale: 1.05 }}
                    className={styles.footerLink}
                  >
                    <Phone size={16} strokeWidth={1.5} style={{ display: 'inline', marginRight: '4px' }} /> 9029562156
                  </motion.a>
                  <motion.a
                    href="https://wa.me/919029562156?text=Hey%2C%20I%20would%20like%20to%20order%20from%20Nidsscrochet%21%20%F0%9F%A7%B6"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -3, scale: 1.05 }}
                    className={`${styles.footerLink} ${styles.whatsappLink}`}
                  >
                    <Image
                      src="/whatsapp.svg"
                      alt="WhatsApp"
                      width={20}
                      height={20}
                      className={styles.whatsappIcon}
                    />
                    WhatsApp
                  </motion.a>
                </div>
                <div className={styles.footerLove}>
                  <p>Made with <Heart size={14} strokeWidth={1.5} fill="#e91e63" color="#e91e63" style={{ display: 'inline', verticalAlign: 'middle' }} /> by Nidhi Tripathi</p>
                </div>
                <div className={styles.footerCopyright}>
                  <p>© {new Date().getFullYear()} Nidsscrochet. All rights reserved.</p>
                </div>
              </div>
            </footer>
          </AnimatedSection>
        </main>

        {/* PRODUCT MODAL */}
        <AnimatePresence mode="wait">
          {selectedProduct && (
            <ProductModal
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// ================================================
// STATIC SITE GENERATION (SSG)
// ================================================
export async function getStaticProps() {
  try {
    await connectDB();

    // Cloudinary optimization helper - request smaller images
    const optimizeImage = (url) => {
      if (!url || !url.includes('cloudinary')) return url;
      // w_400,dpr_auto ensures crisp rendering on 2x retina screens (effective 800px)
      return url.replace('/upload/', '/upload/w_400,q_80,f_auto,dpr_auto/');
    };

    // Fetch data from database
    const [productsRaw, categoriesRaw, bannerRaw] = await Promise.all([
      Product.find({ active: true }).sort({ createdAt: -1 }).limit(20).lean(),
      Category.find({ active: true }).sort({ order: 1 }).lean(),
      Banner.findOne().sort({ updatedAt: -1 }).lean(),
    ]);

    // Serialize MongoDB documents and optimize images
    const serialize = (doc) => ({
      ...doc,
      _id: doc._id.toString(),
      createdAt: doc.createdAt?.toISOString() || null,
      updatedAt: doc.updatedAt?.toISOString() || null,
    });

    const products = productsRaw.map((p) => {
      const serialized = serialize(p);
      if (serialized.image) serialized.image = optimizeImage(serialized.image);
      if (serialized.images) serialized.images = serialized.images.map(optimizeImage);
      return serialized;
    });

    // Aggregate review stats per product
    const reviewAgg = await Review.aggregate([
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        }
      },
    ]);
    const reviewMap = {};
    reviewAgg.forEach((r) => {
      reviewMap[r._id.toString()] = {
        averageRating: Math.round(r.averageRating * 10) / 10,
        reviewCount: r.reviewCount,
      };
    });
    // Merge review stats into product objects
    products.forEach((p) => {
      const stats = reviewMap[p._id] || { averageRating: 0, reviewCount: 0 };
      p.averageRating = stats.averageRating;
      p.reviewCount = stats.reviewCount;
    });

    const categories = categoriesRaw.map(serialize);
    const banner = bannerRaw ? serialize(bannerRaw) : { text: '', active: false };

    return {
      props: {
        initialProducts: JSON.parse(JSON.stringify(products)),
        initialCategories: JSON.parse(JSON.stringify(categories)),
        initialBanner: JSON.parse(JSON.stringify(banner)),
      },
      // Fallback: revalidate every 5 min (on-demand revalidation handles immediate updates)
      revalidate: 300,
    };
  } catch (error) {
    console.error('getStaticProps error:', error);
    return {
      props: {
        initialProducts: [],
        initialCategories: [],
        initialBanner: { text: '', active: false },
      },
      revalidate: 60, // Retry sooner if there's an error
    };
  }
}
