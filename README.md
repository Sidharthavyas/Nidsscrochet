# Nidsscrochet – Premium E‑Commerce Landing & Storefront

A modern, responsive **Next.js 15** application powering the **Nidsscrochet** online store. It includes a full catalog, shopping cart, checkout (Razorpay & COD), admin panel, and a suite of security hardening measures.

---

## 📋 Table of Contents
- [About](#about)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [File Index & Descriptions](#file-index--descriptions)
- [API Reference](#api-reference)
- [Middleware & Edge Security](#middleware--edge-security)
- [Configuration Files](#configuration-files)
- [Lib Utilities](#lib-utilities)
- [Data Models](#data-models)
- [Components](#components)
- [Pages (Routes)](#pages-routes)
- [Security Hardening Summary](#security-hardening-summary)
- [Rate Limiting & Request Store](#rate-limiting--request-store)
- [JWT & Admin Guard](#jwt--admin-guard)
- [Content‑Security‑Policy (CSP) & Nonce](#csp--nonce)
- [File Upload Validation (Magic Bytes)](#file-upload-validation-magic-bytes)
- [CORS Settings](#cors-settings)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing & Linting](#testing--linting)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 🧐 About
Nidsscrochet is a boutique crochet‑shop storefront built with **Next.js 15**. It provides:
- Product catalog with real‑time inventory tracking
- Shopping cart & checkout (Razorpay & Cash‑On‑Delivery)
- User authentication via **Clerk**
- Admin‑only APIs for managing products, banners, coupons, and categories
- Server‑side price recomputation to prevent manipulation
- Robust file‑upload validation (magic‑bytes) to stop malicious payloads

Live demo: https://www.nidsscrochet.in

---

## 🛠 Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | **Next.js 15** (App Router) |
| Language | **JavaScript** (ES2024) |
| Styling | Vanilla CSS modules |
| Auth | **@clerk/nextjs** |
| Payments | **razorpay** SDK |
| Database | **mongoose** (MongoDB) |
| Media | **cloudinary** |
| Rate‑limiting | **rate‑limiter‑flexible** |
| Crypto | Native **Web Crypto API** (Edge Runtime) |
| Deployment | **Vercel** (`vercel.json`) |
| Linting | **ESLint** (`eslint.config.mjs`) |

---

## 🏗 Architecture Overview
```mermaid
flowchart TD
    subgraph Browser[Client]
        UI[React UI]
        Cart[Cart State]
    end
    subgraph Edge[Edge Runtime]
        MW[Middleware (CSP nonce, admin guard)]
        API[API Routes]
    end
    subgraph Server[Node.js Server]
        DB[(MongoDB)]
        Cloud[Cloudinary]
    end
    UI -->|fetch| API
    API -->|verify| MW
    MW -->|auth| API
    API -->|CRUD| DB
    API -->|upload| Cloud
    API -->|payment| Razorpay
    classDef edge fill:#f9f,stroke:#333,stroke-width:2px;
    class MW,API edge;
```

---

## 📂 Project Structure
```
/
├─ .env.local               # Environment variables (example provided)
├─ .gitignore
├─ README.md                # ← This file
├─ components/              # UI components
│   ├─ Cart.js
│   ├─ CartButton.js
│   ├─ CartItem.js
│   └─ ProtectedRoute.js
├─ context/                 # React context providers (e.g., auth, cart)
├─ lib/                     # Helper utilities
│   ├─ authMiddleware.js   # JWT generation (1h TTL)
│   ├─ email.js            # Email sending via Resend
│   ├─ mongodb.js          # MongoDB connection helper
│   └─ security.js         # Rate limiter, magic‑bytes validator
├─ middleware.js            # Edge middleware (CSP nonce, admin JWT guard)
├─ models/                  # Mongoose schemas
│   ├─ Banner.js
│   ├─ Category.js
│   ├─ Coupon.js
│   ├─ Order.js
│   ├─ Product.js
│   └─ Review.js
├─ next.config.mjs          # Next.js custom config (CSP, caching, body limit)
├─ pages/                   # Next.js pages & API routes
│   ├─ _app.js
│   ├─ _document.js
│   ├─ index.js
│   ├─ cart.js
│   ├─ checkout.js
│   ├─ order-success.js
│   ├─ orders.js
│   ├─ sitemap.xml.js
│   ├─ admin/               # Admin UI (protected)
│   ├─ api/                 # API endpoints
│   │   ├─ auth.js
│   │   ├─ banner.js
│   │   ├─ cart.js
│   │   ├─ cart/            # Cart sub‑routes (add, update, delete)
│   │   ├─ categories.js
│   │   ├─ coupons/          # CRUD for coupons
│   │   ├─ orders/           # CRUD for orders (incl. create‑cod)
│   │   ├─ products/         # CRUD for products (admin‑protected)
│   │   ├─ razorpay/         # Razorpay integration (create‑order, verify‑payment)
│   │   ├─ revalidate.js
│   │   ├─ reviews.js
│   │   └─ users.js
│   ├─ login/               # Clerk login pages
│   ├─ signup/              # Clerk signup pages
│   └─ product/             # Dynamic product detail pages
├─ public/                  # Static assets (favicon, images)
├─ styles/                  # Global & module CSS
├─ vercel.json              # Vercel config (CORS whitelist, rewrites)
└─ package.json
```

---

## 📄 File Index & Descriptions
| Path | Description |
|------|-------------|
| `.env.local` | Environment variables (Clerk keys, MongoDB URI, JWT secret, Razorpay credentials, Cloudinary URL) |
| `components/Cart.js` | Renders the cart overlay with list of items and total price |
| `components/CartButton.js` | Header button that toggles the cart visibility |
| `components/CartItem.js` | Individual cart line‑item component |
| `components/ProtectedRoute.js` | HOC that redirects unauthenticated users to login |
| `lib/authMiddleware.js` | `generateToken(payload, expiresIn='1h')` – creates HS256 JWTs for admin sessions |
| `lib/email.js` | Wrapper around **Resend** for transactional emails (order confirmations) |
| `lib/mongodb.js` | Singleton MongoDB connection using **mongoose** |
| `lib/security.js` | Rate‑limiter (`RateLimiterMemory`), `validateMagicBytes(buffer)` for upload safety, in‑memory request store warning |
| `middleware.js` | Edge middleware: generates CSP nonce, injects `x‑nonce` header, validates admin JWT on mutating admin routes |
| `models/Banner.js` | Mongoose schema for site banner (image URL, CTA) |
| `models/Category.js` | Category schema (name, slug) |
| `models/Coupon.js` | Coupon schema (code, discount, expiry, usage limits) |
| `models/Order.js` | Order schema (items, total, payment status, user reference) |
| `models/Product.js` | Product schema (title, description, price, stock, images, category) |
| `models/Review.js` | Review schema (rating, comment, user, product) |
| `next.config.mjs` | Custom Next.js config: CSP header, aggressive static‑asset caching, `serverActions.bodySizeLimit='2mb'` |
| `vercel.json` | Vercel deployment config – rewrites, CORS whitelist (`https://www.nidsscrochet.in`) |
| `pages/api/auth.js` | Clerk session utilities (login, logout) |
| `pages/api/banner.js` | Public GET for banner; admin POST/PUT/DELETE guarded by JWT |
| `pages/api/cart.js` & `pages/api/cart/*` | Cart CRUD for the current user (session‑based) |
| `pages/api/categories.js` | List all product categories (public) |
| `pages/api/coupons.js` & `pages/api/coupons/*` | Coupon CRUD – admin‑protected mutating routes |
| `pages/api/orders/create-cod.js` | COD order creation – uses `crypto.randomBytes` for order ID suffix |
| `pages/api/razorpay/create-order.js` | Creates Razorpay order; recomputes subtotal, validates coupons, adds shipping – **no client‑provided amount** |
| `pages/api/razorpay/verify-payment.js` | Verifies Razorpay payment, atomically deducts stock (`findOneAndUpdate` with `$gte`) |
| `pages/api/revalidate.js` | On‑demand ISR revalidation endpoint |
| `pages/api/reviews.js` | CRUD for product reviews (authenticated users) |
| `pages/api/users.js` | User profile utilities (Clerk integration) |
| `pages/_app.js` | Global app wrapper (Clerk provider, global CSS) |
| `pages/_document.js` | Custom document to inject CSP nonce meta tag |
| `pages/index.js` | Home page – hero, featured products, banner carousel |
| `pages/cart.js` | Cart page – detailed view, quantity controls |
| `pages/checkout.js` | Checkout flow (address, payment selection) |
| `pages/order-success.js` | Confirmation page after successful order |
| `pages/orders.js` | User order history page |
| `pages/product/[id].js` | Dynamic product detail page (SSR) |
| `pages/login/*` & `pages/signup/*` | Clerk authentication pages |
| `pages/admin/*` | Admin dashboard (protected via middleware) |
| `pages/404.js` | Custom 404 page |
| `styles/` | Global CSS (`globals.css`) and component‑scoped modules |
| `package.json` | Project dependencies (Clerk, Razorpay, Mongoose, Cloudinary, rate‑limiter‑flexible, etc.) |

---

## 📡 API Reference
Below is a **complete** list of API endpoints, HTTP methods, purpose, and security requirements.

| Method | Path | Description | Auth / Guard |
|--------|------|-------------|--------------|
| **POST** | `/api/auth/login` | Clerk login (handled by Clerk SDK) | Public |
| **POST** | `/api/auth/logout` | End session | Public |
| **GET** | `/api/banner` | Retrieve current site banner | Public |
| **POST** | `/api/banner` | Create/replace banner | Admin JWT (mutating) |
| **PUT** | `/api/banner` | Update banner fields | Admin JWT |
| **DELETE** | `/api/banner` | Delete banner | Admin JWT |
| **GET** | `/api/categories` | List all product categories | Public |
| **GET** | `/api/coupons` | List active coupons | Public |
| **POST** | `/api/coupons` | Add new coupon | Admin JWT |
| **PUT** | `/api/coupons/:id` | Update coupon | Admin JWT |
| **DELETE** | `/api/coupons/:id` | Remove coupon | Admin JWT |
| **GET** | `/api/products` | Paginated product list | Public |
| **POST** | `/api/products` | Create new product (incl. image upload) | Admin JWT |
| **PUT** | `/api/products/:id` | Update product details | Admin JWT |
| **DELETE** | `/api/products/:id` | Delete product | Admin JWT |
| **GET** | `/api/products/:id` | Get single product (used by product page) | Public |
| **GET** | `/api/banner` | Fetch banner data | Public |
| **GET** | `/api/cart` | Get current user's cart | Clerk session |
| **POST** | `/api/cart` | Add item to cart | Clerk session |
| **PUT** | `/api/cart/:itemId` | Update quantity | Clerk session |
| **DELETE** | `/api/cart/:itemId` | Remove item | Clerk session |
| **POST** | `/api/razorpay/create-order` | Create Razorpay order – server‑side price recompute, coupon validation, shipping calculation | Clerk session |
| **POST** | `/api/razorpay/verify-payment` | Verify Razorpay payment, atomically deduct stock, mark order status | Clerk session |
| **POST** | `/api/orders/create-cod` | Create Cash‑On‑Delivery order – secure ID generation | Clerk session |
| **GET** | `/api/orders` | List user's orders | Clerk session |
| **GET** | `/api/orders/:id` | Get order details | Clerk session (owner) |
| **POST** | `/api/revalidate` | Trigger ISR revalidation for a path | Secret token (optional) |
| **GET** | `/api/reviews` | List reviews for a product | Public |
| **POST** | `/api/reviews` | Add a review (authenticated) | Clerk session |
| **PUT** | `/api/reviews/:id` | Edit own review | Clerk session |
| **DELETE** | `/api/reviews/:id` | Delete own review | Clerk session |
| **GET** | `/api/users/me` | Get current user profile | Clerk session |

*All admin‑mutating routes (`POST/PUT/DELETE` on `/api/products`, `/api/banner`, `/api/coupons`, `/api/categories`) are protected by the **admin JWT guard** implemented in `middleware.js`.*

---

## 🛡 Middleware & Edge Security
- **Nonce‑based CSP** – `middleware.js` generates a UUID, base64‑encodes it, and adds it as `x‑nonce`. `next.config.mjs` reads this header to construct the `Content‑Security‑Policy` header, removing `'unsafe-inline'`.
- **Admin API Guard** – Mutating requests to admin routes require a valid HS256 JWT. Verification uses the native **Web Crypto API** (`crypto.subtle.verify`). No external `jose` dependency.
- **Clerk Middleware** – `clerkMiddleware` runs first to attach the user session.

---

## ⚙️ Configuration Files
### `next.config.mjs`
```js
export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'nonce-${process.env.NEXT_PUBLIC_NONCE}' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://res.cloudinary.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.razorpay.com https://api.clerk.com;`,
          },
        ],
      },
      // Aggressive caching for static assets
      {
        source: '/(.*)\\.(jpg|jpeg|png|webp|avif|svg|ico|woff|woff2|css|js)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  serverActions: { bodySizeLimit: '2mb' }, // L‑3
};
```
### `vercel.json`
```json
{
  "rewrites": [{ "source": "/api/(.*)", "destination": "/api/$1" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [{ "key": "Access-Control-Allow-Origin", "value": "https://www.nidsscrochet.in" }]
    }
  ]
}
```
### `.env.local` (example)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

JWT_SECRET=super‑strong‑random‑string
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

---

## 📦 Lib Utilities
- **`authMiddleware.js`** – `generateToken(payload, expiresIn='1h')` creates HS256 JWTs for admin sessions (TTL reduced to 1 hour – **L‑1**).
- **`email.js`** – Sends transactional emails via **Resend** (order confirmations, password resets).
- **`mongodb.js`** – Singleton connection helper that caches the Mongoose connection.
- **`security.js`** – Implements:
  - Rate limiting with `RateLimiterMemory`
  - In‑memory `requestStore` (warning: not persistent – **M‑3**)
  - `validateMagicBytes(buffer)` – checks JPEG, PNG, GIF, WebP signatures (**L‑2**).

---

## 📊 Data Models
| Model | Fields (key) |
|-------|--------------|
| **Banner** | `imageUrl`, `ctaUrl`, `altText` |
| **Category** | `name`, `slug` |
| **Coupon** | `code`, `discountPercent`, `maxUses`, `expiresAt`, `minPurchaseAmount` |
| **Product** | `title`, `description`, `price`, `stock`, `images[]`, `category`, `slug` |
| **Order** | `userId`, `items[]`, `totalAmount`, `paymentMethod`, `status`, `createdAt` |
| **Review** | `productId`, `userId`, `rating`, `comment`, `createdAt` |

All schemas enforce validation (required fields, value ranges) and include timestamps.

---

## 🧩 Components
- **Cart** – Displays cart overlay, calculates totals, integrates with Stripe/ Razorpay.
- **CartButton** – Header button showing item count badge.
- **CartItem** – Individual line‑item with quantity controls.
- **ProtectedRoute** – Higher‑order component that redirects unauthenticated users to `/login`.

---

## 📄 Pages (Routes)
| Route | Purpose |
|-------|---------|
| `/` | Home page – hero, featured products, banner carousel |
| `/product/[id]` | Dynamic product detail page (SSR) |
| `/cart` | Full cart view with edit/remove actions |
| `/checkout` | Checkout flow – address, payment selection (Razorpay or COD) |
| `/order-success` | Order confirmation after successful payment |
| `/orders` | User order history |
| `/login/*` | Clerk authentication pages |
| `/signup/*` | Clerk sign‑up pages |
| `/admin/*` | Admin dashboard (protected by middleware) |
| `/_error` / `404` | Custom error pages |

---

## 🔐 Security Hardening Summary
| Ref | File | Fix |
|-----|------|-----|
| **C‑1** | `pages/api/razorpay/create-order.js` | Server‑side price recompute, coupon validation, shipping calculation |
| **C‑2** | `vercel.json` | CORS wildcard removed; only `https://www.nidsscrochet.in` allowed |
| **H‑2** | `pages/api/razorpay/verify-payment.js` | Atomic stock deduction using `$gte`; order marked *failed* on insufficient stock |
| **H‑1** | `middleware.js` | Per‑request CSP nonce (`x‑nonce`) generated via `crypto.randomUUID()` |
| **M‑1** | `middleware.js` | Edge‑level admin JWT guard (HS256) using native Web Crypto – no external `jose` dependency |
| **M‑2** | `pages/api/orders/create-cod.js` | Secure COD order ID suffix (`crypto.randomBytes(4)`) |
| **M‑3** | `lib/security.js` | Warning that in‑memory rate limiter isn’t persistent; recommend Upstash Redis |
| **L‑1** | `lib/authMiddleware.js` | JWT TTL reduced from **7d** to **1h** |
| **L‑2** | `lib/security.js` | Magic‑bytes validation for JPEG, PNG, GIF, WebP |
| **L‑3** | `next.config.mjs` | Server‑action body size limit lowered to **2 MB** |
| **H‑1** | `next.config.mjs` | CSP `script-src` no longer contains `'unsafe-inline'` |

---

## ⏱ Rate Limiting & Request Store (`lib/security.js`)
- **In‑memory `requestStore`** – simple map tracking timestamps per IP. **⚠️** Not persistent across Vercel serverless instances; for production replace with a Redis store (e.g., Upstash).
- **`RateLimiterMemory`** – limits to 100 requests per minute per IP (configurable).

---

## 🔑 JWT & Admin Guard (`middleware.js`)
- HS256 token signed with `process.env.JWT_SECRET`.
- `verifyAdminJwt(token)` imports the secret, creates an HMAC key via `crypto.subtle.importKey`, verifies the signature, and checks the `exp` claim.
- Admin routes reject missing/invalid tokens with **401**.

---

## 🛡 CSP & Nonce (`middleware.js` & `next.config.mjs`)
- Middleware generates `nonce = Buffer.from(crypto.randomUUID()).toString('base64')`.
- Header `x‑nonce` is added to the response; `next.config.mjs` injects it into the CSP header.
- Inline scripts in the app must include `nonce={nonce}` (e.g., `<script nonce={nonce}>`).

---

## 📁 File Upload Validation (Magic Bytes)
```js
export function validateMagicBytes(buffer) {
  const signatures = {
    jpg: [0xff, 0xd8, 0xff],
    png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    gif: [0x47, 0x49, 0x46, 0x38],
    webp: [0x52, 0x49, 0x46, 0x46], // "RIFF" – further check for "WEBP"
  };
  const bytes = Array.from(buffer.slice(0, 12));
  if (bytes.slice(0, signatures.jpg.length).every((b,i)=>b===signatures.jpg[i])) return true;
  if (bytes.slice(0, signatures.png.length).every((b,i)=>b===signatures.png[i])) return true;
  if (bytes.slice(0, signatures.gif.length).every((b,i)=>b===signatures.gif[i])) return true;
  // WebP: "RIFF" + size + "WEBP"
  if (bytes.slice(0,4).every((b,i)=>b===signatures.webp[i]) &&
      bytes.slice(8,12).every((b,i)=>b===[0x57,0x45,0x42,0x50][i])) return true;
  return false;
}
```
Use this function before uploading any file to Cloudinary.

---

## 🌐 CORS Settings (`vercel.json`)
Only the production origin `https://www.nidsscrochet.in` is allowed, mitigating CSRF and data‑exfiltration from malicious origins.

---

## 🚀 Getting Started
```bash
git clone https://github.com/Sidharthavyas/Nidsscrochet.git
cd Nidsscrochet
npm install   # or yarn install
npm run dev   # http://localhost:3000
```
Create a `.env.local` file with the variables shown above.

---

## 🛠 Development Workflow
1. **Lint** – `npm run lint`
2. **Run tests** – (Add Jest/React Testing Library as needed)
3. **Commit** – Follow Conventional Commits
4. **Push** – Open a PR; CI runs `npm run build`

---

## ✅ Testing & Linting
- ESLint configuration lives in `eslint.config.mjs`.
- No unit tests are present yet; consider adding Jest tests for API routes and utility functions (`security.js`, `authMiddleware.js`).

---

## 📦 Deployment
Deploy directly from the repository to Vercel. Vercel reads `vercel.json` for CORS and rewrites. Ensure all environment variables are set in the Vercel dashboard.

---

## 🤝 Contributing
1. Fork the repo
2. Create a feature branch (`git checkout -b feature/awesome‑feature`)
3. Commit your changes (`git commit -m "feat: add awesome feature"`)
4. Push and open a Pull Request
5. CI must pass (`npm run build`)

---

## 📄 License
MIT License © 2025 Nidsscrochet

---

## 📬 Contact
- **Maintainer**: Sidhartha – Software Engineer
- **GitHub**: [Sidharthavyas](https://github.com/Sidharthavyas)
- **Project**: Nidsscrochet
- For questions or suggestions, open an issue or submit a PR.
