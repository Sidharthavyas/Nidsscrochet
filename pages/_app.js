import "@/styles/globals.css";
import { Poppins } from 'next/font/google';
import Head from 'next/head';
import { Analytics } from "@vercel/analytics/react";
import { useEffect } from 'react';
import { useRouter } from 'next/router';

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
      document.body.classList.remove('modal-open');
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  return (
    <>
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
        <Component {...pageProps} />
        <Analytics />
      </main>
    </>
  );
}
