# Nidsscrochet Full-Stack Technical Reference

This document serves as the absolute, comprehensive file-by-file technical reference for the Nidsscrochet application. It covers **every facet of the system**, from the root configuration files (`package.json`, `vercel.json`) to every individual CSS module, React component, Admin page, and backend API route.

---

## 1. Root Configuration Files

At the root of the project, these files dictate the build process, deployment settings, and application environments.

*   `package.json`: Defines project dependencies (e.g., `mongoose`, `@clerk/nextjs`, `framer-motion`, `razorpay`, `cloudinary`) and standard scripts (`dev`, `build`, `start`, `lint`).
*   `vercel.json`: Vercel deployment configurations. Defines strict cache-control headers, specific deployment routes, and serverless function behaviors for production environments.
*   `next.config.mjs`: Next.js compiler settings. Handles domain whitelists for remote images (like Cloudinary and Clerk avatars) and disables default body parsers for specific API routes (like the multipart form handlers).
*   `middleware.js`: The Next.js Edge Middleware. Secures the entire application by checking Admin JWT validity using Native Web Crypto before serverless functions execute, injects Clerk authentications, and dynamically yields CSP `x-nonce` headers.
*   `.env.local`: The schema mapping for all environmental secrets required across the app (MongoDB URIs, Razorpay keys, Cloudinary secrets, and Clerk keys).
*   `eslint.config.mjs` & `jsconfig.json`: Defines code linting rules tailored to Next.js and compiler module resolution for clean imports within the IDE.
*   `test-email.cjs`: A standalone commonJS diagnostic script used to verify the Resend email deliverability locally.

---

## 2. Global Styling & CSS Modules (`/styles`)

The styling architecture avoids utility classes (like Tailwind) to maintain absolute bespoke control dynamically.

*   `globals.css`: The foundational stylesheet. It handles native resets, establishes the root CSS variables (brand colors: soft pinks, deep charcoals), applies the Poppins font globally, and controls native interactive behaviors (like hiding scrollbars and fixing modal overflow states).
*   `Home.module.css`: The largest stylesheet governing the landing page (`pages/index.js`), product filtering grids, responsive hero banners, and complex CSS grid structures.
*   `Cart.module.css`: Styles exactly targeted for the sliding cart drawer (`components/Cart.js`), governing off-canvas animations and internal scroll boundaries.
*   `Admin.module.css`: The locked, localized styling specifically for the Admin Dashboard (`pages/admin/dashboard.js`), structuring robust data tables, sidebar navigation, and stat widgets cleanly.

---

## 3. Frontend Document Hierarchy (`/pages`)

The application's visible frontend mapped cleanly to Next.js file-system routing.

### 3.1 Core Setup & Roots
*   `_app.js`: The root wrapper injecting the `ClerkProvider` (Auth), `CartProvider` (State), Google Analytics components, global fonts, and CSS routines. Operates global DOM cleanup on route navigation.
*   `_document.js`: Mutates the raw HTML document sent from the server to inject specific language markers (`lang="en"`) or preliminary scripts.
*   `404.js`: The specialized custom "Not Found" page maintaining the application's premium aesthetic for broken links.
*   `sitemap.xml.js`: Dynamically generates SEO-compliant `sitemap.xml` referencing current products and categories at build time.

### 3.2 Main Storefront
*   `index.js`: The central landing page. Features hero banners, horizontally scrolling category markers, and a master product grid featuring dynamic client-side filtering and sorting.
*   `cart.js`: A specialized standalone cart page representing the full cart details (acting alongside the standard slide-out drawer).
*   `checkout.js`: The secure payment routing page capturing shipping details, calculating Razorpay intentions natively with the backend, or initiating backend Cash On Delivery functions.
*   `orders.js`: An authenticated customer portal fetching their active and historical order invoices directly from the database mapping to their active Clerk token.
*   `order-success.js`: The post-purchase congratulatory redirect, dynamically showing confetti animations and confirming order IDs explicitly.

### 3.3 Product Display
*   `product/[id].js`: The dynamic individual product page mapped by `_id`. Implements robust Cloudinary image carousels, detailed DOMPurify-cleaned HTML descriptions, explicit stock availability guards, and handles the interactive Review submission form.

### 3.4 Public Authentication (`/login` & `/signup`)
*   `login/index.js` & `signup/index.js`: Custom-styled public portals wrapping the `<SignIn>` and `<SignUp>` Clerk standard UI components precisely.
*   `login/sso-callback.js` & `signup/sso-callback.js`: Technical routing pages that finalize third-party OAuth flows (like Google logins) rendering success states cleanly back to the internal `/` homepage.

### 3.5 Protected Admin Dashboard (`/admin`)
*   `admin/index.js`: The specific Administrator authentication wall. Submits the `.env` tied credentials to `/api/auth` seeking a verified JWT token utilizing `rate-limiter-flexible` barriers.
*   `admin/dashboard.js`: The colossal monolithic dashboard logic. Once authenticated natively, this single page manages complex states rendering individual interactive tables for: Catalog management, Category ordering, dynamic Coupon generation, active Order tracking, and public Banners.

---

## 4. UI Components & Context (`/components` & `/context`)

The encapsulated tools used throughout the main Application logic.

### 4.1 State Management (Context)
*   `CartContext.js`: The `React.createContext` provider executing synchronous state updates across the DOM. Keeps track of items iteratively, saves changes smoothly to `window.localStorage` (preventing data loss across tabs or refeshes), and computes dynamic sub-totals synchronously.

### 4.2 Reusable Components
*   `Cart.js`: The visual off-canvas slider drawer overlaying pages to show basket state dynamically.
*   `CartItem.js`: The discrete isolated mapping element displaying an individual product within the Cart, handling immediate `+` or `-` state calculations for precise modifications.
*   `CartButton.js`: The universal trigger floating securely across the interface to activate the slider.
*   `ProtectedRoute.js`: The strict Higher-Order Component natively querying `/api/auth` checking the `localStorage` Admin JWT token before allowing `children` (the `admin/dashboard.js`) to render locally onto the Document Object Model.

---

## 5. Backend Mongoose Architecture (`/models`)

The definitive database schemas governing MongoDB native transactions.

*   `Product.js`: Core catalog handling features (`name`, `price`), boolean availability maps (`cod_available`), validation logics (ensuring `salePrice` < `price`), robust recursive tracking of `images`/`cloudinaryIds` arrays, and highly indexed full-text `{name, description}` queries.
*   `Order.js`: The immutable transactional snapshot object freezing prices, snapshots of customer states (`customer.phone`), Razorpay explicit tracking IDs (`receiptId`), and current statuses securely preventing unexpected data alterations long-term.
*   `Coupon.js`: Stores discrete tracking models dictating exact `minOrderValue` metrics, Boolean expiration conditions natively through `validUntil` timestamps, and limiting metrics natively via `usageCount` relative to `maxUses`.
*   `Review.js`: Links natively into `productId`. Defends natively via sparse compound unique indexes querying exactly (`{ productId: 1, clerkUserId: 1 }`) avoiding single users spamming multiple identical submissions dynamically.
*   `Banner.js` & `Category.js`: Internal logic dictates priority sequences (`order` limits) modifying the priority logic rendered natively across the storefront application.

---

## 6. Backend API Controllers (`/pages/api`)

The entirety of the serverless backend interface resolving logic cleanly via HTTP methodologies.

### 6.1 Administrator Logic
*   `auth.js`: Logs administrators in natively checking local `.env` variables mapped concurrently against native Rate Limitations.
*   `users.js`: Connects administrators natively directly into the secure Clerk Node SDK traversing standard `clerkClient().users.getUserList` actions tracking the application's actual active user registrations effortlessly.

### 6.2 Catalog Endpoints
*   `products.js`: Exposes REST `GET` protocols mapping towards internal `limit` and `page` parameters sorting the active catalog safely. Mutating verbs (`POST`/`PUT`/`DELETE`) face JWT verification wrappers prior to utilizing explicit `formidable` data parsers directly pushing raw Multipart form bodies into robust multi-level Cloudinary upload implementations.
*   `categories.js`, `banner.js`, `coupons.js`: Native CRUD matrices guarded defensively mapping simple reads natively to anonymous users while intercepting mutations accurately to confirmed verified JWT identities.

### 6.3 Secure Transactions (The Payment Architecture)
*   `razorpay/create-order.js`: Recalculates every value securely from native MongoDB reads ensuring clients cannot pass tampered order totals natively mapping accurate values natively to Razorpay Instances utilizing the `@clerk/nextjs` identity tracker.
*   `razorpay/verify-payment.js`: Exposes native Webhooks ensuring immediate native verification. Translates explicit `crypto.createHmac` hashes verifying against explicit `RAZORPAY_KEY_SECRET`. Upon parity, it decrements atomic stock thresholds natively utilizing explicit `$gte` Mongoose Guard definitions (blocking active overselling automatically).
*   `orders/create-cod.js`: Translates explicit checkout definitions natively mapping a Cash on Delivery methodology seamlessly verifying internal logic precisely like the Razorpay intent, dispatching automatic order placements safely tracking to active identities natively tracking out confirmation dispatch emails directly utilizing Resend.
*   `orders/index.js` & `orders/user.js`: Validates explicit searches defining complex user or admin dashboard read sequences resolving nested arrays gracefully into native JSON streams.

### 6.4 Public Interactions
*   `reviews.js`: Operates uniquely explicitly verifying public interactions native to Clerk users safely sanitizing internal representations via explicit `validator.escape()` wrappers rendering inputs entirely inert securing datasets natively from complex XSS injections natively applying explicit memory-based rate limitations sequentially preventing rapid bot spam behaviors strictly.
