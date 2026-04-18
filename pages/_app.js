import "@/styles/globals.css";
import { Poppins } from 'next/font/google';
import Script from 'next/script';
import Head from 'next/head';
import { Analytics } from "@vercel/analytics/react";
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ClerkProvider } from '@clerk/nextjs';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/components/Toast';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
});

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Global safety: Reset body overflow on every route change
  // This prevents pages from getting "stuck" if a modal/lightbox leaks overflow:hidden
  useEffect(() => {
    const handleRouteChange = () => {
      // CRITICAL FIX: Aggressively clean up ALL scroll-lock styles
      document.body.style.overflow = '';
      document.body.style.position = ''; // ADDED: Clean up position:fixed
      document.body.style.top = ''; // ADDED: Clean up top offset
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
      document.body.classList.remove('modal-open');
      document.body.classList.remove('no-scroll');
    };
    
    // Run cleanup immediately on mount (fixes cart page on direct navigation)
    handleRouteChange();
    
    router.events.on('routeChangeStart', handleRouteChange);
    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        layout: {
          logoImageUrl: "/rose.webp",
          socialButtonsVariant: "iconButton",
        },
        variables: {
          colorPrimary: "#FFB6C1",
          colorBackground: "#FFF5F5",
          colorInputBackground: "#FFFFFF",
          colorInputText: "#333333",
        },
      }}
    >
      <CartProvider>
        <ToastProvider>
        <Head>
          {/* Preconnect to Cloudinary — crossOrigin enables full TCP+TLS reuse */}
          <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://res.cloudinary.com" />
          {/* Preload the LCP rose image — fetchpriority=high moves it to top of queue */}
          <link
            rel="preload"
            href="/rose.webp"
            as="image"
            type="image/webp"
            // @ts-expect-error — fetchpriority is valid HTML but not yet in TS types
            fetchpriority="high"
          />
        </Head>
        <main className={poppins.className}>
          {/* Google Analytics */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-09GH5HGWGX"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-09GH5HGWGX', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
          <Component {...pageProps} />
          <Analytics />
        </main>
        </ToastProvider>
      </CartProvider>
    </ClerkProvider>
  );
}
