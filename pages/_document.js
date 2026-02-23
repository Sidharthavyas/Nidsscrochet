// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        {/* Favicon set */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-192.png" />

        {/* Canonical URL for SEO */}
        <link rel="canonical" href="https://www.nidsscrochet.in" />

        {/* Google Search Console */}
        <meta name="google-site-verification" content="googleaf9e83b16acc72ba" />

        {/* Theme & Tile */}
        <meta name="theme-color" content="#FFB6C1" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#FFB6C1" media="(prefers-color-scheme: dark)" />
        <meta name="msapplication-TileColor" content="#FFB6C1" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
        <meta name="application-name" content="nidsscrochet" />
        <meta name="apple-mobile-web-app-title" content="nidsscrochet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=yes" />

        {/* Preconnect critical origins */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />

        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Razorpay Checkout SDK */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </Head>
      <body>
        {/* Noscript fallback for SEO */}
        <noscript>
          <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h1>nidsscrochet - Handcrafted Crochet by Nidhi Tripathi</h1>
            <p>Please enable JavaScript to browse our handcrafted crochet collections.
              Visit us on <a href="https://www.instagram.com/nidsscrochet">Instagram</a>
              or call <a href="tel:9029562156">9029562156</a>.</p>
          </div>
        </noscript>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}