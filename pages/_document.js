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
        <link rel="canonical" href="https://www.Nidsscrochet.in" />

        {/* Google Search Console */}
        <meta name="google-site-verification" content="googleaf9e83b16acc72ba" />

        {/* Theme & Tile */}
        <meta name="theme-color" content="#FFB6C1" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#FFB6C1" media="(prefers-color-scheme: dark)" />
        <meta name="msapplication-TileColor" content="#FFB6C1" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
        <meta name="application-name" content="Nidsscrochet" />
        <meta name="apple-mobile-web-app-title" content="Nidsscrochet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=yes" />

        {/* Google Fonts — Pacifico for brand logo (preconnect must come first) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap"
        />

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

        {/* Noscript fallback for SEO — visible to bots and script-blocked users */}
        <noscript>
          <style>{`
            .noscript-fallback {
              font-family: Georgia, 'Times New Roman', serif;
              max-width: 520px;
              margin: 72px auto;
              text-align: center;
              padding: 0 24px;
              color: #1a1a1a;
            }
            .noscript-fallback h1 {
              font-size: 2rem;
              margin-bottom: 6px;
              letter-spacing: 0.5px;
            }
            .noscript-fallback .tagline {
              font-size: 1rem;
              color: #555;
              margin-bottom: 4px;
            }
            .noscript-fallback .location {
              font-size: 0.9rem;
              color: #888;
              margin-bottom: 24px;
            }
            .noscript-fallback p {
              font-size: 0.95rem;
              color: #555;
              line-height: 1.7;
              margin-bottom: 8px;
            }
            .noscript-fallback a {
              color: #c9879a;
              text-decoration: none;
              font-weight: 600;
            }
            .noscript-fallback a:hover {
              text-decoration: underline;
            }
            .noscript-fallback .divider {
              width: 48px;
              height: 2px;
              background: #c9879a;
              margin: 20px auto;
              border-radius: 2px;
            }
          `}</style>
          <div className="noscript-fallback">
            <h1>Nidsscrochet</h1>
            <p className="tagline">Handcrafted crochet by Nidhi Tripathi</p>
            <p className="location">Mumbai, India</p>
            <div className="divider"></div>
            <p>
              Browse our amigurumi, bouquets, keychains &amp; gifts on{' '}
              <a href="https://www.instagram.com/Nidsscrochet" rel="noopener noreferrer">Instagram @Nidsscrochet</a>
            </p>
            <p>
              Order via WhatsApp:{' '}
              <a href="https://wa.me/919029562156">+91 90295 62156</a>
            </p>
            <p>
              Enable JavaScript to shop online at{' '}
              <a href="https://www.nidsscrochet.in">nidsscrochet.in</a>
            </p>
          </div>
        </noscript>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}