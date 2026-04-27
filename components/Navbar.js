import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Phone, X, Menu, ExternalLink } from 'lucide-react';
import { useAuth, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import CartButton from '@/components/CartButton';
import styles from '../styles/Navbar.module.css';

// ================================================
// SHARED NAVBAR (used across all pages)
// Props:
//   showSearch  {boolean}  — show the search bar (homepage only)
//   products    {array}    — required when showSearch=true
// ================================================
export default function Navbar({ showSearch = false, products = [] }) {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search state (only relevant when showSearch=true)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Build search index when products change
  const searchIndex = products.map((p) => ({
    id: p._id,
    searchText: `${p.name || ''} ${p.description || ''} ${p.category || ''}`.toLowerCase(),
    name: p.name,
    category: p.category,
    image: p.image || (p.images && p.images[0]),
    price: p.price,
    product: p,
  }));

  // Scroll listener for navbar shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close suggestions on scroll (mobile UX)
  useEffect(() => {
    if (!showSuggestions) return;
    const handleScroll = () => setShowSuggestions(false);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showSuggestions]);

  // Search filtering
  useEffect(() => {
    if (!showSearch || !searchQuery.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const query = searchQuery.toLowerCase().trim();
    const matches = searchIndex.filter((item) => item.searchText.includes(query)).slice(0, 6);
    setSearchSuggestions(matches);
    setShowSuggestions(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, showSearch]);

  // Click outside closes suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
        if (window.innerWidth <= 768) setSearchActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSuggestionSelect = useCallback((product) => {
    setShowSuggestions(false);
    setSearchQuery('');
    setSearchActive(false);
    router.push(`/product/${product._id}`);
  }, [router]);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.navWrapper}>
          <div className={styles.navContent}>

            {/* ── Brand ── */}
            <Link href="/" className={styles.navBrand} aria-label="Nidsscrochet home">
              <span style={{ color: '#e75480', fontFamily: 'inherit', fontWeight: 700, fontSize: '1.35rem', letterSpacing: '0.01em' }}>
                Nidsscrochet
              </span>
            </Link>

            {/* ── Search Bar (homepage only) ── */}
            {showSearch && (
              <div
                ref={searchContainerRef}
                className={`${styles.searchContainer} ${searchActive ? styles.searchActive : ''}`}
              >
                <button
                  className={styles.searchIconBtn}
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
                  <Search size={18} strokeWidth={1.5} />
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
                  aria-controls="search-suggestions-listbox"
                  aria-haspopup="listbox"
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
                    <X size={16} strokeWidth={1.5} />
                  </button>
                )}

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <motion.div
                      className={styles.suggestionsDropdown}
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className={styles.suggestionsHeader}>
                        <span className={styles.suggestionsCount}>
                          {searchSuggestions.length} result{searchSuggestions.length !== 1 ? 's' : ''}
                        </span>
                        <span className={styles.suggestionsHint}>↑↓ navigate · Enter select</span>
                      </div>
                      <div className={styles.suggestionsList} role="listbox" id="search-suggestions-listbox">
                        {searchSuggestions.map((item) => (
                          <div
                            key={item.id}
                            className={styles.suggestionItem}
                            onClick={() => handleSuggestionSelect(item.product)}
                            role="option"
                            aria-selected={false}
                          >
                            <div className={styles.suggestionImageWrap}>
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                />
                              ) : (
                                <div className={styles.suggestionImagePlaceholder} />
                              )}
                            </div>
                            <div className={styles.suggestionInfo}>
                              <span className={styles.suggestionName}>{item.name}</span>
                              <span className={styles.suggestionCategory}>{item.category}</span>
                            </div>
                            <div className={styles.suggestionPriceWrap}>
                              <span className={styles.suggestionPrice}>
                                ₹{item.price?.toString().replace(/[^\d]/g, '')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {showSearch && searchActive && searchQuery.trim().length > 0 && searchSuggestions.length === 0 && (
                    <motion.div
                      className={styles.suggestionsDropdown}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className={styles.noResultsContent}>
                        <Search size={24} strokeWidth={1} style={{ opacity: 0.3 }} />
                        <span className={styles.noResultsTitle}>No results for &ldquo;{searchQuery}&rdquo;</span>
                        <span className={styles.noResultsHint}>Try a different keyword or browse our collections</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── Mobile menu toggle ── */}
            <motion.button
              className={styles.mobileMenuBtn}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {mobileMenuOpen
                ? <X size={22} strokeWidth={1.5} />
                : <Menu size={22} strokeWidth={1.5} />
              }
            </motion.button>

            {/* ── Nav Links ── */}
            <div className={`${styles.navLinks} ${mobileMenuOpen ? styles.navLinksMobile : ''}`}>
              <motion.a
                href={router.pathname === '/' ? '#collections' : '/#collections'}
                whileHover={{ y: -2 }}
                className={styles.navLink}
                onClick={closeMenu}
              >
                Collections
              </motion.a>

              <SignedIn>
                <Link href="/orders" passHref legacyBehavior>
                  <motion.a
                    whileHover={{ y: -2 }}
                    className={styles.navLink}
                    onClick={closeMenu}
                  >
                    My Orders
                  </motion.a>
                </Link>
              </SignedIn>

              <CartButton variant="menu" onClick={closeMenu} />

              <SignedOut>
                <div className={styles.authButtons}>
                  <SignInButton mode="modal">
                    <motion.button
                      whileHover={{ y: -2 }}
                      className={styles.navLink}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
                    >
                      Sign In
                    </motion.button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <motion.button
                      whileHover={{ y: -2 }}
                      className={styles.navLink}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
                    >
                      Sign Up
                    </motion.button>
                  </SignUpButton>
                </div>
              </SignedOut>

              <SignedIn>
                <div className={styles.navProfileItem}>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{ elements: { avatarBox: 'w-8 h-8' } }}
                  />
                  <span className={styles.navProfileLabel}>Profile</span>
                </div>
              </SignedIn>

              <motion.a
                href="https://www.instagram.com/Nidsscrochet?igsh=cXp1NWFtNWplaHc3"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2 }}
                className={styles.navLink}
                onClick={closeMenu}
              >
                Instagram
              </motion.a>

              <motion.a
                href="tel:9029562156"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={styles.navCta}
                onClick={closeMenu}
              >
                <Phone size={15} strokeWidth={1.5} />
                Call Us
              </motion.a>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Mobile menu backdrop ── */}
      <div
        className={`${styles.mobileBackdrop} ${mobileMenuOpen ? styles.active : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />
    </>
  );
}
