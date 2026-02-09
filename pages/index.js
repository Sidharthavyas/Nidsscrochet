import { useState, useEffect, useRef, useMemo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { motion, useScroll, useTransform, useMotionValue, AnimatePresence, useInView } from 'framer-motion';
import styles from '../styles/Home.module.css';

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
            <span className={styles.shareIcon}>{copied ? '✓' : '🔗'}</span>
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
            <span className={styles.shareIcon}>💬</span>
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
            <span className={styles.shareIcon}>📘</span>
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
            <span className={styles.shareIcon}>🐦</span>
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
            <span className={styles.shareIcon}>📌</span>
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
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
          <span className={styles.noSuggestionsIcon}>🔍</span>
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
        <span className={styles.suggestionsHint}>↑↓ to navigate · Enter to select</span>
      </div>

      {/* Suggestions list */}
      <div className={styles.suggestionsList} ref={listRef} role="listbox">
        {suggestions.map((item, idx) => (
          <motion.div
            key={item.id}
            className={`${styles.suggestionItem} ${idx === activeIndex ? styles.suggestionItemActive : ''}`}
            onClick={() => onSelect(item.product)}
            onMouseEnter={() => setActiveIndex(idx)}
            role="option"
            aria-selected={idx === activeIndex}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.2 }}
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
                <div className={styles.suggestionImagePlaceholder}>🧶</div>
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
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ================================================
// ROSE BURST INTRO
// ================================================
function RoseBurstIntro({ onComplete }) {
  const [showRose, setShowRose] = useState(true);
  const [isBursting, setIsBursting] = useState(false);

  useEffect(() => {
    const burstTimer = setTimeout(() => {
      setIsBursting(true);
    }, 2000);

    const removeTimer = setTimeout(() => {
      setShowRose(false);
      if (onComplete) onComplete();
    }, 2800);

    return () => {
      clearTimeout(burstTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  const petalCount = 12;
  const petals = Array.from({ length: petalCount }, (_, i) => ({
    angle: (360 / petalCount) * i,
    delay: i * 0.02,
  }));

  return (
    <AnimatePresence>
      {showRose && (
        <motion.div
          className={styles.roseBurstOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.roseBurstContainer}>
            <motion.div
              className={styles.mainRose}
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={
                isBursting
                  ? {
                    scale: [1, 1.3, 0],
                    rotate: [0, 180, 360],
                    opacity: [1, 0.8, 0],
                  }
                  : {
                    scale: 1,
                    rotate: 0,
                    opacity: 1,
                    y: [0, -20, 0],
                  }
              }
              transition={
                isBursting
                  ? { duration: 0.8, ease: "easeOut" }
                  : {
                    scale: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
                    rotate: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
                    opacity: { duration: 0.8 },
                    y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                  }
              }
            >
              <Image
                src="/rose.webp"
                alt="Crochet Rose"
                width={200}
                height={200}
                className={styles.roseMainImage}
                priority
                quality={85}
              />
              <motion.div
                className={styles.roseGlow}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>

            {isBursting &&
              petals.map((petal, index) => (
                <motion.div
                  key={index}
                  className={styles.burstPetal}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
                  animate={{
                    x: Math.cos((petal.angle * Math.PI) / 180) * 300,
                    y: Math.sin((petal.angle * Math.PI) / 180) * 300,
                    scale: [1, 0.5, 0],
                    opacity: [1, 0.8, 0],
                    rotate: [0, petal.angle * 2, petal.angle * 4],
                  }}
                  transition={{ duration: 0.8, delay: petal.delay, ease: "easeOut" }}
                >
                  <Image
                    src="/rose.webp"
                    alt=""
                    width={60}
                    height={60}
                    className={styles.petalImage}
                    loading="lazy"
                    quality={80}
                  />
                </motion.div>
              ))}

            {isBursting &&
              Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  className={styles.sparkleParticle}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{
                    x: (Math.random() - 0.5) * 400,
                    y: (Math.random() - 0.5) * 400,
                    scale: [0, 1, 0],
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 1, delay: i * 0.03, ease: "easeOut" }}
                >
                  ✨
                </motion.div>
              ))}

            {isBursting && (
              <motion.div
                className={styles.burstFlash}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 3, opacity: [0, 1, 0] }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ================================================
// DECORATIVE SHAPES
// ================================================
function DecorativeShapes() {
  return (
    <>
      <motion.div
        className={styles.decorativeCircle}
        style={{ top: '10%', left: '5%' }}
        animate={{ y: [0, -30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={styles.decorativeCircle}
        style={{ top: '60%', right: '8%' }}
        animate={{ y: [0, 40, 0], scale: [1, 1.3, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className={styles.blobShape}
        style={{ top: '30%', left: '10%' }}
        animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className={styles.blobShape}
        style={{ bottom: '20%', right: '15%' }}
        animate={{ rotate: [360, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className={styles.sparkle}
        style={{ top: '20%', left: '15%' }}
        animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
      >
        ✨
      </motion.div>
      <motion.div
        className={styles.sparkle}
        style={{ top: '70%', right: '20%' }}
        animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 1, delay: 1 }}
      >
        💫
      </motion.div>
      <motion.div
        className={styles.sparkle}
        style={{ bottom: '30%', left: '20%' }}
        animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, delay: 2 }}
      >
        ⭐
      </motion.div>
      <motion.div
        className={styles.floatingHeart}
        style={{ top: '40%', right: '10%' }}
        animate={{ y: [0, -20, 0], rotate: [-10, 10, -10] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        💕
      </motion.div>
      <motion.div
        className={styles.floatingHeart}
        style={{ bottom: '40%', left: '12%' }}
        animate={{ y: [0, 15, 0], rotate: [10, -10, 10] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        💖
      </motion.div>
    </>
  );
}

// ================================================
// SCROLL PROGRESS
// ================================================
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className={styles.scrollProgress}
      style={{ scaleX: scrollYProgress }}
    />
  );
}

// ================================================
// SCROLL TO TOP
// ================================================
function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 300);
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          className={styles.scrollToTop}
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.span
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ↑
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ================================================
// MAGNETIC BUTTON
// ================================================
function MagneticButton({ children, className, href, target, rel, ...props }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * 0.3;
    const y = (clientY - (top + height / 2)) * 0.3;
    setPosition({ x, y });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.a
      ref={ref}
      href={href}
      target={target}
      rel={rel}
      className={className}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      {...props}
    >
      {children}
    </motion.a>
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
      transition={{ duration, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      {emoji}
    </motion.div>
  );
}

// ================================================
// ANIMATED SECTION
// ================================================
function AnimatedSection({ children, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 1, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ================================================
// STATS COUNTER
// ================================================
function StatsCounter({ end, duration = 2, label, icon }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      let startTime;
      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = (currentTime - startTime) / (duration * 1000);
        if (progress < 1) {
          setCount(Math.floor(end * progress));
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  return (
    <motion.div
      ref={ref}
      className={styles.statCard}
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <motion.div
        className={styles.statIcon}
        whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.div>
      <div className={styles.statNumber}>{count}+</div>
      <div className={styles.statLabel}>{label}</div>
    </motion.div>
  );
}

// ================================================
// TESTIMONIAL CARD
// ================================================
function TestimonialCard({ name, review, rating, image, delay }) {
  return (
    <motion.div
      className={styles.testimonialCard}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -8, scale: 1.02 }}
    >
      <div className={styles.testimonialRating}>
        {[...Array(rating)].map((_, i) => (
          <motion.span
            key={i}
            whileHover={{ scale: 1.3, rotate: 360 }}
            transition={{ duration: 0.3 }}
          >
            ⭐
          </motion.span>
        ))}
      </div>
      <p className={styles.testimonialReview}>{review}</p>
      <div className={styles.testimonialAuthor}>
        <motion.div
          className={styles.testimonialAvatar}
          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
        >
          {image || name.charAt(0)}
        </motion.div>
        <div className={styles.testimonialName}>{name}</div>
      </div>
    </motion.div>
  );
}

// ================================================
// PROCESS STEP
// ================================================
function ProcessStep({ number, title, description, icon, delay }) {
  return (
    <motion.div
      className={styles.processStep}
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.05, rotateY: 5 }}
    >
      <motion.div
        className={styles.processNumber}
        whileHover={{ rotate: 360, scale: 1.2 }}
        transition={{ duration: 0.6 }}
      >
        {number}
      </motion.div>
      <motion.div
        className={styles.processIcon}
        whileHover={{ scale: 1.2, rotate: 10 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {icon}
      </motion.div>
      <h3 className={styles.processTitle}>{title}</h3>
      <p className={styles.processDescription}>{description}</p>
    </motion.div>
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
// PRODUCT CARD
// ================================================
function ProductCard({ product, index, onClick }) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const productImages = product.images && product.images.length > 0
    ? product.images
    : [product.image];

  const productUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/product/${product._id}`
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/product/${product._id}`;

  const handleMouseMove = (e) => {
    if (!cardRef.current || window.innerWidth < 768) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / 25);
    y.set((e.clientY - centerY) / 25);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setCurrentImageIndex(0);
    setIsZoomed(false);
  };

  const getBadge = () => {
    if (product.isNew) return { text: 'NEW', color: 'green' };
    if (product.isBestSeller) return { text: 'BEST SELLER', color: 'pink' };
    if (product.stock < 3 && product.stock > 0) return { text: 'LIMITED', color: 'orange' };
    return null;
  };

  const badge = getBadge();

  useEffect(() => {
    if (!isHovered || productImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isHovered, productImages.length]);

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const handleShare = async (e) => {
    e.stopPropagation();
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

  const handleCardClick = () => {
    router.push(`/product/${product._id}`);
  };

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.6,
          delay: index * 0.08,
          ease: [0.25, 0.1, 0.25, 1]
        }}
        className={styles.productCard}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          handleMouseLeave();
        }}
        onMouseMove={handleMouseMove}
        onClick={handleCardClick}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleCardClick();
        }}
        style={{ rotateX: y, rotateY: x }}
        role="button"
        tabIndex={0}
        aria-label={`View ${product.name}`}
        whileHover={{ scale: 1.02 }}
      >
        <div className={styles.productImageWrapper}>
          {badge && (
            <motion.div
              className={`${styles.productBadge} ${styles[`badge${badge.color}`]}`}
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: -12 }}
              transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
              whileHover={{ scale: 1.1, rotate: 0 }}
            >
              {badge.text}
            </motion.div>
          )}

          <AnimatePresence>
            {isHovered && (
              <motion.button
                className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlisted : ''}`}
                onClick={handleWishlistToggle}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Add to favorites"
              >
                <motion.span
                  animate={{ scale: isWishlisted ? [1, 1.3, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {isWishlisted ? '❤️' : '🤍'}
                </motion.span>
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isHovered && (
              <motion.button
                className={styles.shareCardBtn}
                onClick={handleShare}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Share product"
              >
                🔗
              </motion.button>
            )}
          </AnimatePresence>

          {productImages.length > 1 && (
            <div className={styles.imageIndicator}>
              {productImages.map((_, idx) => (
                <span
                  key={idx}
                  className={`${styles.dot} ${idx === currentImageIndex ? styles.activeDot : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                />
              ))}
            </div>
          )}

          {imageLoading && (
            <div className={styles.imageSkeleton}>
              <div className={styles.skeletonShimmer} />
            </div>
          )}

          <div
            className={styles.imageContainer}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className={styles.imageWrapper}
              >
                <Image
                  src={productImages[currentImageIndex]}
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`${styles.productImage} ${isZoomed ? styles.zoomed : ''}`}
                  loading="lazy"
                  unoptimized
                  onLoadingComplete={() => setImageLoading(false)}
                  style={{ objectFit: 'contain', objectPosition: 'center' }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {isHovered && (
            <motion.div
              className={styles.shimmer}
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          )}
        </div>

        <div className={styles.productInfo}>
          <div className={styles.productHeader}>
            <motion.span
              className={styles.productCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              {product.category}
            </motion.span>

            <div className={styles.ratingStars}>
              {[...Array(5)].map((_, i) => (
                <motion.span
                  key={i}
                  className={i < (product.rating || 5) ? styles.starFilled : styles.starEmpty}
                  whileHover={{ scale: 1.2, rotate: 15 }}
                  transition={{ duration: 0.2 }}
                >
                  ⭐
                </motion.span>
              ))}
            </div>
          </div>

          <h4 className={styles.productName}>{product.name}</h4>
          <p className={styles.productDescription}>{product.description}</p>

          {product.colors && product.colors.length > 0 && (
            <motion.div
              className={styles.colorVariants}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.4 }}
            >
              <span className={styles.colorLabel}>Colors:</span>
              {product.colors.slice(0, 5).map((color, idx) => (
                <motion.span
                  key={idx}
                  className={styles.colorDot}
                  style={{ backgroundColor: color }}
                  whileHover={{ scale: 1.3, y: -3 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              ))}
              {product.colors.length > 5 && (
                <span className={styles.moreColors}>+{product.colors.length - 5}</span>
              )}
            </motion.div>
          )}

          <div className={styles.productFooter}>
            <motion.div
              className={styles.priceContainer}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {product.salePrice ? (
                <>
                  <motion.div className={styles.productPriceSale} whileHover={{ scale: 1.05 }}>
                    <span className={styles.priceSymbol}>₹</span>
                    <span className={styles.priceAmount}>{product.salePrice?.toString().replace(/[^\d]/g, '')}</span>
                    <span className={styles.saleBadge}>
                      {Math.round(((parseFloat(product.price.replace(/[^\d.]/g, '')) - parseFloat(product.salePrice.replace(/[^\d.]/g, ''))) / parseFloat(product.price.replace(/[^\d.]/g, ''))) * 100)}% OFF
                    </span>
                  </motion.div>
                  <div className={styles.productPriceOriginal}>
                    <span>₹{product.price?.toString().replace(/[^\d]/g, '')}</span>
                  </div>
                </>
              ) : (
                <motion.div className={styles.productPrice} whileHover={{ scale: 1.05 }}>
                  <span className={styles.priceSymbol}>₹</span>
                  <span className={styles.priceAmount}>{product.price?.toString().replace(/[^\d]/g, '')}</span>
                </motion.div>
              )}
            </motion.div>

            {product.stock !== undefined && (
              <motion.div
                className={styles.stockBadge}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                {product.stock > 0 ? (
                  <span className={styles.inStock}>
                    <span className={styles.stockIcon}>✓</span>
                    In Stock
                  </span>
                ) : (
                  <span className={styles.outOfStock}>
                    <span className={styles.stockIcon}>✗</span>
                    Out of Stock
                  </span>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showShareModal && (
          <ShareModalComponent
            product={product}
            productUrl={productUrl}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ================================================
// PRODUCT MODAL
// ================================================
function ProductModal({ product, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const productImages = product.images && product.images.length > 0
    ? product.images
    : [product.image];

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50 && currentImageIndex < productImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
    if (distance < -50 && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
    setTouchStart(0);
    setTouchEnd(0);
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
                >
                  ←
                </button>
                <button
                  className={`${styles.carouselBtn} ${styles.carouselBtnNext}`}
                  onClick={nextImage}
                  disabled={currentImageIndex === productImages.length - 1}
                >
                  →
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
              {product.description}
            </motion.p>

            <motion.div
              className={styles.modalPriceSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className={styles.priceWrapper}>
                <span className={styles.priceLabel}>Price</span>
                <span className={styles.modalPrice}>{formatPrice(product.price)}</span>
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
            </motion.div>

            <motion.div
              className={styles.modalActions}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
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
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ================================================
// HOME PAGE
// ================================================
export default function Home() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Intro animation
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('introSeen');
    }
    return true;
  });
  const [contentVisible, setContentVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!sessionStorage.getItem('introSeen');
    }
    return false;
  });

  const [banner, setBanner] = useState({ text: '', active: false });
  const sliderRefs = useRef({});

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  // Scroll handler for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close suggestions on scroll (mobile UX)
  useEffect(() => {
    const handleScroll = () => {
      if (showSuggestions) {
        setShowSuggestions(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showSuggestions]);

  // Intro timer
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('introSeen')) {
      setContentVisible(true);
      setShowIntro(false);
      return;
    }
    const timer = setTimeout(() => {
      setContentVisible(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('introSeen', 'true');
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  // Fetch data
  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => {
        if (!r.ok) throw new Error('Failed to fetch categories');
        return r.json();
      }),
      fetch('/api/products').then(r => {
        if (!r.ok) throw new Error('Failed to fetch products');
        return r.json();
      }),
      fetch('/api/banner').then(r => {
        if (!r.ok) throw new Error('Failed to fetch banner');
        return r.json();
      })
    ])
      .then(([catData, prodData, bannerData]) => {
        if (catData.success) setCategories(catData.data);
        if (prodData.success) setProducts(prodData.data);
        if (bannerData.success && bannerData.data) {
          setBanner(bannerData.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getProductsByCategory = useMemo(() => {
    return (category) => products.filter((p) => p.category === category.name);
  }, [products]);

  // Search index for instant filtering
  const searchIndex = useMemo(() => {
    return products.map((p) => ({
      id: p._id,
      searchText: `${p.name || ''} ${p.description || ''} ${p.category || ''}`.toLowerCase(),
      name: p.name,
      category: p.category,
      image: p.image || (p.images && p.images[0]),
      price: p.price,
      product: p
    }));
  }, [products]);

  // Search suggestions - instant filtering as you type
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const matches = searchIndex
      .filter(item => item.searchText.includes(query))
      .slice(0, 6);

    setSearchSuggestions(matches);
    setShowSuggestions(true);
  }, [searchQuery, searchIndex]);

  // Click outside handler to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
        // On mobile, also close the search bar when clicking outside
        if (window.innerWidth <= 768) {
          setSearchActive(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Handle selecting a suggestion — navigate to product page
  const handleSuggestionSelect = (product) => {
    setShowSuggestions(false);
    setSearchQuery('');
    setSearchActive(false);
    router.push(`/product/${product._id}`);
  };

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
        <title>nidsscrochet</title>
        <meta name="description" content="Nidsscrochet by Nidhi Tripathi - Premium handcrafted crochet creations in Mumbai, India. Shop luxury amigurumi, forever flowers, crochet bouquets, bag charms, keychains, custom AirPod cases & personalized gifts. Perfect for weddings, return gifts, corporate gifting & Diwali hampers. Handmade with love, delivered across Mumbai. Order via Instagram or WhatsApp!" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="keywords" content="Nidsscrochet, Nidhi Tripathi, crochet, handmade crochet, amigurumi, fiber art, handcrafted, sustainable living, slow fashion, makersgonnamake, crochet flowers, forever flowers, handcrafted rose bouquet, sustainable florals, crochet lily, crochet sunflower, allergy-friendly flowers, luxury crochet wedding centerpieces, bag charms, crochet keychain, aesthetic keychains, kawaii accessories, lily of the valley bag charm, fruit themed crochet accessories, soft toys, luxury amigurumi, collectible plushies, handmade nursery decor, crochet panda, crochet penguin, crochet cat, eco-friendly cotton toys, crochet AirPod case, custom mobile cover, aesthetic tech case, tomato design AirPod case, strawberry crochet earphone holder, cottagecore, kawaii aesthetic, cozy home, handmade gifts, support small business, fiber artist, Mumbai made, Mumbai artisans, handmade in India, vocal for local India, Mumbai gifts, return gifts Mumbai, return gifts for birthday party, wedding return gifts Mumbai, luxury giveaways, customized gift hampers Mumbai, birthday hampers, corporate gift boxes, Diwali hampers, personalized anniversary gift baskets, high-end corporate gifts Mumbai, employee appreciation gifts, sustainable B2B gifts, luxury home decor India, handcrafted interior accessories, modern Indian handicrafts, crochet table decor Mumbai, handmade gifts Mumbai, crochet studio Mumbai, customized hampers Mumbai, gift shop Bandra, bespoke hampers Juhu, artisan gifts South Mumbai, corporate gifting services Andheri, same day gift delivery Mumbai, bulk return gifts Mumbai, custom crochet commissions Mumbai, personalized gifts, eco-friendly crochet gift hampers, handmade luxury gifts for her, contemporary fiber art, textile sculpture, artisan-made interior accents, limited edition, one-of-a-kind, bespoke commission, heirloom quality, crochet bouquet, buy crochet online India" />
        <link rel="canonical" href="https://www.nidsscrochet.in/" />
        <meta name="author" content="Nidhi Tripathi" />
        <meta name="copyright" content="Nidsscrochet" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.nidsscrochet.in/" />
        <meta property="og:title" content="Nidsscrochet by Nidhi Tripathi | Handcrafted Crochet Mumbai" />
        <meta property="og:description" content="Premium handcrafted crochet in Mumbai - Luxury amigurumi, forever flowers, crochet bouquets, bag charms & custom gifts. Perfect for weddings, return gifts & corporate gifting!" />
        <meta property="og:image" content="https://www.nidsscrochet.in/rose.webp" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Nidsscrochet" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.nidsscrochet.in/" />
        <meta name="twitter:title" content="Nidsscrochet | Handcrafted Crochet Mumbai" />
        <meta name="twitter:description" content="Luxury amigurumi, forever flowers, crochet bouquets & custom gifts. Handmade in Mumbai with love!" />
        <meta name="twitter:image" content="https://www.nidsscrochet.in/rose.webp" />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://www.nidsscrochet.in/#organization",
                  "name": "Nidsscrochet",
                  "url": "https://www.nidsscrochet.in",
                  "logo": "https://www.nidsscrochet.in/rose.webp",
                  "description": "Handcrafted crochet creations by Nidhi Tripathi",
                  "founder": { "@type": "Person", "name": "Nidhi Tripathi" },
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": "+91-9029562156",
                    "contactType": "customer service",
                    "availableLanguage": ["English", "Hindi"]
                  },
                  "sameAs": ["https://www.instagram.com/nidsscrochet"]
                },
                {
                  "@type": "WebSite",
                  "@id": "https://www.nidsscrochet.in/#website",
                  "url": "https://www.nidsscrochet.in",
                  "name": "Nidsscrochet",
                  "description": "Handcrafted Crochet Creations",
                  "publisher": { "@id": "https://www.nidsscrochet.in/#organization" },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://www.nidsscrochet.in/?search={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "LocalBusiness",
                  "@id": "https://www.nidsscrochet.in/#localbusiness",
                  "name": "Nidsscrochet",
                  "alternateName": "Nidsscrochet by Nidhi Tripathi",
                  "image": "https://www.nidsscrochet.in/rose.webp",
                  "description": "Premium handcrafted crochet studio in Mumbai, India.",
                  "url": "https://www.nidsscrochet.in",
                  "telephone": "+91-9029562156",
                  "priceRange": "₹₹",
                  "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Mumbai",
                    "addressRegion": "Maharashtra",
                    "addressCountry": "IN"
                  },
                  "geo": { "@type": "GeoCoordinates", "addressCountry": "IN" },
                  "areaServed": [
                    { "@type": "City", "name": "Mumbai" },
                    { "@type": "Country", "name": "India" }
                  ],
                  "hasOfferCatalog": {
                    "@type": "OfferCatalog",
                    "name": "Handcrafted Crochet Products",
                    "itemListElement": [
                      { "@type": "OfferCatalog", "name": "Crochet Flowers & Bouquets" },
                      { "@type": "OfferCatalog", "name": "Amigurumi Soft Toys" },
                      { "@type": "OfferCatalog", "name": "Bag Charms & Keychains" },
                      { "@type": "OfferCatalog", "name": "Tech Accessories" },
                      { "@type": "OfferCatalog", "name": "Return Gifts" },
                      { "@type": "OfferCatalog", "name": "Corporate Gift Hampers" }
                    ]
                  },
                  "openingHoursSpecification": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "09:00",
                    "closes": "21:00"
                  },
                  "sameAs": ["https://www.instagram.com/nidsscrochet"]
                }
              ]
            })
          }}
        />
      </Head>

      {showIntro && <RoseBurstIntro onComplete={() => setShowIntro(false)} />}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: contentVisible ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <ScrollProgress />
        <ScrollToTop />

        {/* ===== NAVBAR ===== */}
        <motion.nav
          className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className={styles.navWrapper}>
            <div className={styles.navContent}>
              <motion.div
                className={styles.navBrand}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4 }}
              >
                Nidsscrochet
              </motion.div>

              {/* ===== SEARCH BAR — IMPROVED ===== */}
              <div
                ref={searchContainerRef}
                className={`${styles.searchContainer} ${searchActive ? styles.searchActive : ''}`}
              >
                <button
                  className={styles.searchIcon}
                  onClick={() => {
                    setSearchActive(!searchActive);
                    if (!searchActive && searchInputRef.current) {
                      setTimeout(() => searchInputRef.current?.focus(), 100);
                    }
                    if (searchActive) {
                      setShowSuggestions(false);
                      setSearchQuery('');
                    }
                  }}
                  aria-label="Toggle search"
                >
                  🔍
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    setSearchActive(true);
                    if (searchQuery.trim()) setShowSuggestions(true);
                  }}
                  aria-label="Search products"
                  aria-autocomplete="list"
                  role="combobox"
                  aria-expanded={showSuggestions}
                />
                {searchQuery && (
                  <button
                    className={styles.searchClear}
                    onClick={() => {
                      setSearchQuery('');
                      setShowSuggestions(false);
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {(showSuggestions || (searchActive && searchQuery.trim() && searchSuggestions.length === 0)) && (
                    <SearchSuggestions
                      suggestions={searchSuggestions}
                      query={searchQuery}
                      onSelect={handleSuggestionSelect}
                      onClose={() => setShowSuggestions(false)}
                      visible={showSuggestions || (searchActive && searchQuery.trim().length > 0)}
                      noResults={searchActive && searchQuery.trim().length > 0 && searchSuggestions.length === 0}
                    />
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                className={styles.mobileMenuBtn}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </motion.button>

              <div className={`${styles.navLinks} ${mobileMenuOpen ? styles.navLinksMobile : ''}`}>
                <motion.a
                  href="#collections"
                  whileHover={{ y: -2 }}
                  className={styles.navLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Collections
                </motion.a>
                <motion.a
                  href="https://www.instagram.com/nidsscrochet?igsh=cXp1NWFtNWplaHc3"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -2 }}
                  className={styles.navLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Instagram
                </motion.a>
                <motion.a
                  href="tel:9029562156"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={styles.navCta}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  📞 Call Us
                </motion.a>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* ===== MAIN CONTENT ===== */}
        <main className={styles.mainContainer}>
          <DecorativeShapes />

          {/* HERO */}
          <section className={styles.hero}>
            <FloatingEmoji emoji="🧶" delay={0} duration={8} x={100} y={100} />
            <FloatingEmoji emoji="💕" delay={2} duration={10} x={300} y={150} />
            <FloatingEmoji emoji="✨" delay={4} duration={9} x={500} y={80} />
            <FloatingEmoji emoji="🌸" delay={1} duration={11} x={700} y={120} />
            <FloatingEmoji emoji="🎀" delay={3} duration={10} x={200} y={200} />

            <motion.div
              className={styles.heroGlassCard}
              style={{ y: heroY, opacity: heroOpacity }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <motion.div
                className={styles.heroBadge}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                ✨ Handcrafted with Love ✨
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
                  href="https://www.instagram.com/nidsscrochet?igsh=cXp1NWFtNWplaHc3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.ctaButton} ${styles.ctaButtonPrimary}`}
                >
                  <span className={styles.buttonIcon}>📷</span>
                  <span>Follow on Instagram</span>
                  <motion.div
                    className={styles.buttonRipple}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
                  />
                </MagneticButton>

                <MagneticButton
                  href="tel:9029562156"
                  className={`${styles.ctaButton} ${styles.ctaButtonSecondary}`}
                >
                  <span className={styles.buttonIcon}>📞</span>
                  <span>Contact Us</span>
                </MagneticButton>
              </motion.div>
            </motion.div>
          </section>

          {/* STATS */}
          <section className={styles.statsSection}>
            <AnimatedSection>
              <div className={styles.statsGrid}>
                <StatsCounter end={80} label="Happy Customers" icon="😊" />
                <StatsCounter end={100} label="Products Crafted" icon="🧶" />
                <StatsCounter end={50} label="Unique Designs" icon="✨" />
                <StatsCounter end={1.5} label="Years Experience" icon="🎨" />
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
              <div className={styles.loadingState}>
                <motion.div
                  className={styles.loader}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  🧶
                </motion.div>
                <p>Loading beautiful creations...</p>
              </div>
            ) : error ? (
              <div className={styles.errorState}>
                <p>😔 {error}</p>
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
                const categoryProducts = getProductsByCategory(category);
                return (
                  <AnimatedSection key={category._id} delay={idx * 0.15}>
                    <div className={styles.categoryBlock}>
                      <div className={styles.categoryHeader}>
                        <h3 className={styles.categoryTitle}>
                          <motion.span
                            className={styles.categoryIcon}
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                            transition={{ duration: 0.5 }}
                          >
                            {category.icon}
                          </motion.span>
                          {category.name}
                        </h3>
                        <div className={styles.sliderControls}>
                          <motion.button
                            className={styles.sliderBtn}
                            onClick={() => scrollSlider(category.slug, 'left')}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Previous products"
                          >
                            ←
                          </motion.button>
                          <motion.button
                            className={styles.sliderBtn}
                            onClick={() => scrollSlider(category.slug, 'right')}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Next products"
                          >
                            →
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
                            categoryProducts.map((product, index) => (
                              <ProductCard
                                key={product._id}
                                product={product}
                                index={index}
                                onClick={setSelectedProduct}
                              />
                            ))
                          ) : (
                            <motion.div
                              className={styles.emptyCategory}
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <p>✨ Coming Soon!</p>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </AnimatedSection>
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
              <ProcessStep number="01" title="Design Selection" description="Choose from our collection or request a custom design" icon="🎨" delay={0} />
              <ProcessStep number="02" title="Handcrafted" description="Each piece is carefully crocheted by hand with premium yarn" icon="🧶" delay={0.2} />
              <ProcessStep number="03" title="Quality Check" description="Every product is inspected to ensure perfect quality" icon="✨" delay={0.4} />
              <ProcessStep number="04" title="Delivered with Love" description="Packaged beautifully and delivered to your doorstep" icon="💝" delay={0.6} />
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
                    href="https://www.instagram.com/nidsscrochet?igsh=cXp1NWFtNWplaHc3"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -3, scale: 1.05 }}
                    className={styles.footerLink}
                  >
                    📷 Instagram
                  </motion.a>
                  <motion.a
                    href="tel:9029562156"
                    whileHover={{ y: -3, scale: 1.05 }}
                    className={styles.footerLink}
                  >
                    📞 9029562156
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
                  <p>Made with 💖 by Nidhi Tripathi</p>
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
      </motion.div>
    </>
  );
}