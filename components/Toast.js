// components/Toast.js
// Global toast/snackbar notification — used for cart feedback, errors, etc.
import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

const ToastContext = createContext();

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  const showToast = useCallback(({ message, link, linkText, duration = 3500 }) => {
    // Clear any existing toast
    if (timerRef.current) clearTimeout(timerRef.current);
    setExiting(false);
    setToast({ message, link, linkText });

    timerRef.current = setTimeout(() => {
      setExiting(true);
      // Wait for exit animation before unmounting
      setTimeout(() => {
        setToast(null);
        setExiting(false);
      }, 260);
    }, duration);
  }, []);

  const dismissToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setExiting(true);
    setTimeout(() => {
      setToast(null);
      setExiting(false);
    }, 260);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {toast && (
        <div
          className={`${styles.cartToast} ${exiting ? styles.toastOut : ''}`}
          role="status"
          aria-live="polite"
          onClick={dismissToast}
        >
          <span className={styles.cartToastDot} />
          <span>{toast.message}</span>
          {toast.link && (
            <Link href={toast.link} className={styles.cartToastLink}>
              {toast.linkText || 'View'}
            </Link>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}
