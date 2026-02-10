import "@/styles/globals.css";
import { Poppins } from 'next/font/google';
import Head from 'next/head';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
});

export default function App({ Component, pageProps }) {
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
      </main>
    </>
  );
}
