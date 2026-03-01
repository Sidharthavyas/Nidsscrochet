import "@/styles/globals.css";
import { Poppins } from 'next/font/google';
import Script from 'next/script';
import Head from 'next/head';
import { Analytics } from "@vercel/analytics/react";
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ClerkProvider } from '@clerk/nextjs';
import { CartProvider } from '@/context/CartContext';

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
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.classList.remove('modal-open');
      document.body.classList.remove('no-scroll');
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
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
        <Head>
          {/* Preconnect to Cloudinary for faster image loading */}
          <link rel="preconnect" href="https://res.cloudinary.com" />
          <link rel="dns-prefetch" href="https://res.cloudinary.com" />
          {/* Preload the LCP image to eliminate resource load delay */}
          <link
            rel="preload"
            href="/rose.webp"
            as="image"
            type="image/webp"
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
      </CartProvider>
    </ClerkProvider>
  );
}
