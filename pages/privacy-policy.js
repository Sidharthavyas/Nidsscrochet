import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

const LAST_UPDATED = "27 April 2026";
const EFFECTIVE_DATE = "27 April 2026";

const sections = [
  { id: "overview", label: "Overview" },
  { id: "information-collected", label: "Information We Collect" },
  { id: "how-we-use", label: "How We Use It" },
  { id: "third-parties", label: "Third-Party Services" },
  { id: "cookies", label: "Cookies & Storage" },
  { id: "data-retention", label: "Data Retention" },
  { id: "security", label: "Data Security" },
  { id: "your-rights", label: "Your Rights" },
  { id: "children", label: "Children's Privacy" },
  { id: "grievance", label: "Grievance Officer" },
  { id: "changes", label: "Policy Changes" },
  { id: "contact", label: "Contact Us" },
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState("overview");

  const scrollTo = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Head>
        <title>Privacy Policy | Nidsscrochet</title>
        <meta
          name="description"
          content="Privacy Policy for Nidsscrochet – how we collect, use, and protect your personal information in compliance with Indian law."
        />
        <meta name="robots" content="index, follow" />
      </Head>

      <style>{`
       @import url('https://fonts.googleapis.com/css2?family=Pacifico&family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;1,500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .pp-root {
          font-family: 'Poppins', sans-serif;
          background: #fdf8f5;
          color: #2c1a14;
          min-height: 100vh;
        }

        /* ── HERO ── */
        .pp-hero {
          background: linear-gradient(135deg, #f9eee8 0%, #fce8f0 60%, #f5e0ea 100%);
          border-bottom: 1px solid #e8c9d6;
          padding: 64px 24px 48px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .pp-hero::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 240px; height: 240px;
          border-radius: 50%;
          background: rgba(212, 83, 126, 0.07);
        }
        .pp-hero::after {
          content: '';
          position: absolute;
          bottom: -80px; left: -40px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: rgba(212, 83, 126, 0.05);
        }
        .pp-hero-badge {
          display: inline-block;
          background: #fce8f0;
          border: 1px solid #e8a8c0;
          color: #993556;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px 16px;
          border-radius: 100px;
          margin-bottom: 20px;
        }
        .pp-hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 600;
          color: #2c1a14;
          line-height: 1.15;
          margin-bottom: 16px;
        }
        .pp-hero h1 em {
          font-style: italic;
          color: #c44070;
        }
        .pp-hero-meta {
          font-size: 13px;
          color: #7a5060;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
        .pp-hero-meta span {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pp-hero-meta .dot {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: #c44070;
          display: inline-block;
        }

        /* ── LAYOUT ── */
        .pp-layout {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 0;
          padding: 48px 24px;
        }
        @media (max-width: 768px) {
          .pp-layout { grid-template-columns: 1fr; padding: 32px 16px; }
          .pp-sidebar { display: none; }
        }

        /* ── SIDEBAR ── */
        .pp-sidebar {
          position: sticky;
          top: 80px;
          align-self: start;
          padding-right: 32px;
        }
        .pp-sidebar-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #9a7080;
          margin-bottom: 14px;
        }
        .pp-sidebar nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pp-sidebar-link {
          font-size: 13px;
          color: #7a5060;
          text-decoration: none;
          padding: 7px 12px;
          border-radius: 8px;
          border-left: 2px solid transparent;
          transition: all 0.18s ease;
          cursor: pointer;
          background: none;
          border: none;
          text-align: left;
          font-family: 'Poppins', sans-serif;
          display: block;
          width: 100%;
        }
        .pp-sidebar-link:hover {
          color: #c44070;
          background: #fce8f0;
        }
        .pp-sidebar-link.active {
          color: #c44070;
          background: #fce8f0;
          font-weight: 600;
          border-left: 2px solid #c44070;
        }

        /* ── CONTENT ── */
        .pp-content {
          min-width: 0;
        }

        .pp-section {
          margin-bottom: 56px;
          scroll-margin-top: 90px;
        }

        .pp-section-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }
        .pp-section-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #fce8f0, #f9d0e2);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .pp-section h2 {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 600;
          color: #2c1a14;
        }

        .pp-section p {
          font-size: 14.5px;
          line-height: 1.85;
          color: #4a2e38;
          margin-bottom: 14px;
        }
        .pp-section p:last-child { margin-bottom: 0; }

        /* ── CARDS ── */
        .pp-card {
          background: #fff;
          border: 1px solid #ecd4de;
          border-radius: 14px;
          padding: 20px 22px;
          margin-bottom: 14px;
        }
        .pp-card-title {
          font-size: 13px;
          font-weight: 700;
          color: #993556;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .pp-card p {
          margin-bottom: 0 !important;
        }

        .pp-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }

        .pp-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 12px 0;
        }
        .pp-chip {
          background: #fce8f0;
          border: 1px solid #e8b0c4;
          color: #8c2e50;
          font-size: 12px;
          font-weight: 500;
          padding: 5px 12px;
          border-radius: 100px;
        }

        /* ── TABLE ── */
        .pp-table-wrap {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid #ecd4de;
          margin: 14px 0;
        }
        .pp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .pp-table thead {
          background: linear-gradient(90deg, #fce8f0, #f9d0e2);
        }
        .pp-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #993556;
          white-space: nowrap;
        }
        .pp-table td {
          padding: 12px 16px;
          color: #4a2e38;
          line-height: 1.6;
          border-top: 1px solid #f0dce6;
        }
        .pp-table tr:last-child td { border-bottom: none; }
        .pp-table tbody tr:hover { background: #fdf5f8; }

        /* ── HIGHLIGHT BOXES ── */
        .pp-highlight {
          background: linear-gradient(135deg, #fce8f0 0%, #f9eaf5 100%);
          border: 1px solid #e0b0c8;
          border-radius: 12px;
          padding: 18px 20px;
          margin: 16px 0;
        }
        .pp-highlight-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #993556;
          margin-bottom: 8px;
        }
        .pp-highlight p {
          font-size: 13.5px !important;
          color: #5a2840 !important;
          margin-bottom: 0 !important;
        }

        .pp-warning {
          background: #fff8ec;
          border: 1px solid #f5c96a;
          border-radius: 12px;
          padding: 16px 20px;
          margin: 16px 0;
        }
        .pp-warning p {
          font-size: 13.5px !important;
          color: #6b4a00 !important;
          margin-bottom: 0 !important;
        }

        /* ── RIGHTS LIST ── */
        .pp-rights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin: 16px 0;
        }
        .pp-right-card {
          background: #fff;
          border: 1px solid #ecd4de;
          border-radius: 12px;
          padding: 16px 18px;
        }
        .pp-right-icon {
          font-size: 22px;
          margin-bottom: 8px;
          display: block;
        }
        .pp-right-title {
          font-size: 13px;
          font-weight: 700;
          color: #2c1a14;
          margin-bottom: 4px;
        }
        .pp-right-desc {
          font-size: 12px;
          color: #7a5060;
          line-height: 1.6;
        }

        /* ── GRIEVANCE OFFICER ── */
        .pp-grievance-card {
          background: #fff;
          border: 2px solid #e0a8be;
          border-radius: 16px;
          padding: 28px;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 20px;
          align-items: start;
        }
        .pp-grievance-avatar {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f9d0e2, #e8a8c0);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          color: #993556;
          font-weight: 600;
          flex-shrink: 0;
        }
        .pp-grievance-name {
          font-size: 17px;
          font-weight: 700;
          color: #2c1a14;
          margin-bottom: 2px;
        }
        .pp-grievance-role {
          font-size: 12px;
          color: #993556;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .pp-grievance-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pp-grievance-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
          color: #4a2e38;
        }
        .pp-grievance-row a {
          color: #c44070;
          text-decoration: none;
        }
        .pp-grievance-row a:hover { text-decoration: underline; }

        /* ── DIVIDER ── */
        .pp-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e0b0c8, transparent);
          margin: 32px 0;
        }

        /* ── FOOTER ── */
        .pp-footer {
          background: #2c1a14;
          color: #c8a0b0;
          text-align: center;
          padding: 32px 24px;
          font-size: 13px;
          line-height: 1.7;
        }
        .pp-footer a {
          color: #f4c0d1;
          text-decoration: none;
        }
        .pp-footer a:hover { text-decoration: underline; }
        .pp-footer-links {
          display: flex;
          justify-content: center;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        /* ── NAV BAR ── */
        .pp-nav {
          background: #fff;
          border-bottom: 1px solid #ecd4de;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .pp-nav-brand {
  font-family: 'Pacifico', cursive;
  font-size: 18px;
  font-weight: 400;  /* Pacifico only has 400 */
  color: #e75480;    /* match the navbar's pink */
  text-decoration: none;

        }
        .pp-nav-sep {
          color: #e0b0c8;
          font-size: 18px;
        }
        .pp-nav-page {
          font-size: 13px;
          color: #9a7080;
        }
        .pp-nav-back {
          margin-left: auto;
          font-size: 13px;
          color: #c44070;
          text-decoration: none;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .pp-nav-back:hover { text-decoration: underline; }
      `}</style>

      <div className="pp-root">
        {/* NAV */}
        <div className="pp-nav">
          <Link href="/" className="pp-nav-brand">Nidsscrochet</Link>
          <span className="pp-nav-sep">/</span>
          <span className="pp-nav-page">Privacy Policy</span>
          <Link href="/" className="pp-nav-back">← Back to Shop</Link>
        </div>

        {/* HERO */}
        <div className="pp-hero">
          <div className="pp-hero-badge">Legal &amp; Privacy</div>
          <h1>Your Privacy <em>Matters</em> to Us</h1>
          <div className="pp-hero-meta">
            <span>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{display:'inline'}}>
                <rect x="1" y="4" width="14" height="11" rx="2" stroke="#c44070" strokeWidth="1.5"/>
                <path d="M5 4V3a3 3 0 1 1 6 0v1" stroke="#c44070" strokeWidth="1.5"/>
              </svg>
              Effective: {EFFECTIVE_DATE}
            </span>
            <span className="dot" />
            <span>Last updated: {LAST_UPDATED}</span>
            <span className="dot" />
            <span>Governed by Indian Law</span>
          </div>
        </div>

        {/* LAYOUT */}
        <div className="pp-layout">
          {/* SIDEBAR */}
          <div className="pp-sidebar">
            <div className="pp-sidebar-title">Contents</div>
            <nav>
              {sections.map((s) => (
                <button
                  key={s.id}
                  className={`pp-sidebar-link${activeSection === s.id ? " active" : ""}`}
                  onClick={() => scrollTo(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </div>

          {/* CONTENT */}
          <div className="pp-content">

            {/* 1. OVERVIEW */}
            <section className="pp-section" id="overview">
              <div className="pp-section-header">
                <div className="pp-section-icon">🌸</div>
                <h2>Overview</h2>
              </div>
              <p>
                Welcome to <strong>Nidsscrochet</strong> ("we", "our", or "us"), a handcrafted crochet brand owned and operated by <strong>Nidhi Tripathi</strong>, based in <strong>Mumbai, Maharashtra, India</strong>. Our website is located at <a href="https://www.nidsscrochet.in" style={{color:'#c44070'}}>www.nidsscrochet.in</a>.
              </p>
              <p>
                This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit our website or place an order with us. It is drawn up in compliance with the <strong>Information Technology Act, 2000</strong>, the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong> ("SPDI Rules"), and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>.
              </p>
              <div className="pp-highlight">
                <div className="pp-highlight-title">Plain Language Summary</div>
                <p>
                  We only collect what we need to process your orders, keep your account secure, and improve your shopping experience. We do not sell your personal data. Ever.
                </p>
              </div>
              <p>
                By using our website, creating an account, or placing an order, you consent to the practices described in this policy. If you do not agree, please discontinue use of the website.
              </p>
            </section>

            <div className="pp-divider" />

            {/* 2. INFORMATION COLLECTED */}
            <section className="pp-section" id="information-collected">
              <div className="pp-section-header">
                <div className="pp-section-icon">📋</div>
                <h2>Information We Collect</h2>
              </div>
              <p>We collect information in the following categories:</p>

              <div className="pp-card">
                <div className="pp-card-title">A. Account Information (via Clerk)</div>
                <p>When you create an account or sign in using Google OAuth, we receive your <strong>name, email address, and profile picture</strong> from Clerk (our authentication provider). You may also provide this directly during sign-up. This constitutes "personal information" under the SPDI Rules.</p>
              </div>

              <div className="pp-card">
                <div className="pp-card-title">B. Sensitive Personal Data — Shipping &amp; Contact</div>
                <p>During checkout, we collect your <strong>full delivery address, phone number, and name</strong>. This is necessary to fulfil your order and is classified as sensitive personal data under the SPDI Rules. We collect it only with your explicit consent at the point of checkout.</p>
              </div>

              <div className="pp-card">
                <div className="pp-card-title">C. Payment Information</div>
                <p>Payments are processed exclusively by <strong>Razorpay</strong>. We do not store your card number, CVV, UPI VPA, or net-banking credentials on our servers. We only retain the <strong>Razorpay Order ID, Payment ID, and payment status</strong> for order tracking and dispute resolution. For Cash on Delivery (COD) orders, no financial data is collected.</p>
              </div>

              <div className="pp-card">
                <div className="pp-card-title">D. Order &amp; Transaction Records</div>
                <p>Every placed order creates an immutable snapshot containing your order items, quantities, prices paid, applied coupons, shipping address, contact details, and payment status. This is retained for legal, accounting, and customer support purposes.</p>
              </div>

              <div className="pp-card">
                <div className="pp-card-title">E. Reviews &amp; User-Generated Content</div>
                <p>If you submit a product review, we store your <strong>review text, star rating, and your Clerk User ID</strong>. Reviews are linked to your account to prevent duplicate submissions and spam.</p>
              </div>

              <div className="pp-card">
                <div className="pp-card-title">F. Usage &amp; Device Data (Google Analytics)</div>
                <p>We use <strong>Google Analytics</strong> to understand how visitors use our website. This includes your approximate location, browser type, device type, pages visited, and time spent. This data is anonymised and aggregated and cannot directly identify you.</p>
              </div>

              <div className="pp-card">
                <div className="pp-card-title">G. WhatsApp &amp; Instagram Messages</div>
                <p>If you contact us via <strong>WhatsApp (+91 90295 62156)</strong> or <strong>Instagram (@Nidsscrochet)</strong>, the content of those messages is handled by Meta's platforms and their respective privacy policies. We only use such messages to respond to your queries.</p>
              </div>
            </section>

            <div className="pp-divider" />

            {/* 3. HOW WE USE */}
            <section className="pp-section" id="how-we-use">
              <div className="pp-section-header">
                <div className="pp-section-icon">🎯</div>
                <h2>How We Use Your Information</h2>
              </div>

              <div className="pp-table-wrap">
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th>Purpose</th>
                      <th>Data Used</th>
                      <th>Legal Basis (IT Act / SPDI Rules)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Process and fulfil your orders</td>
                      <td>Name, address, phone, order details</td>
                      <td>Contract performance; consent at checkout</td>
                    </tr>
                    <tr>
                      <td>Send order confirmation emails</td>
                      <td>Email address, order summary</td>
                      <td>Contract performance; consent at sign-up</td>
                    </tr>
                    <tr>
                      <td>Verify and secure payments</td>
                      <td>Razorpay Order/Payment ID</td>
                      <td>Legal obligation (RBI Guidelines); contract</td>
                    </tr>
                    <tr>
                      <td>Prevent fraud and overselling</td>
                      <td>Order status, stock data</td>
                      <td>Legitimate interest</td>
                    </tr>
                    <tr>
                      <td>Display your order history</td>
                      <td>Clerk User ID, order records</td>
                      <td>Contract; consent</td>
                    </tr>
                    <tr>
                      <td>Moderate product reviews</td>
                      <td>Review text, Clerk User ID</td>
                      <td>Legitimate interest; consent</td>
                    </tr>
                    <tr>
                      <td>Analyse website usage</td>
                      <td>Anonymised analytics data</td>
                      <td>Legitimate interest</td>
                    </tr>
                    <tr>
                      <td>Respond to customer queries</td>
                      <td>Contact details, message content</td>
                      <td>Consent; legitimate interest</td>
                    </tr>
                    <tr>
                      <td>Comply with legal obligations</td>
                      <td>Transaction records</td>
                      <td>Legal obligation (IT Act, Tax law)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pp-warning">
                <p>
                  <strong>We do not use your personal information for unsolicited marketing.</strong> We do not send promotional emails or SMS unless you have explicitly opted in.
                </p>
              </div>
            </section>

            <div className="pp-divider" />

            {/* 4. THIRD PARTIES */}
            <section className="pp-section" id="third-parties">
              <div className="pp-section-header">
                <div className="pp-section-icon">🔗</div>
                <h2>Third-Party Services</h2>
              </div>
              <p>
                We work with trusted third-party service providers to operate our platform. Each processes your data solely for the purpose described below and is bound by their own privacy policies.
              </p>

              <div className="pp-info-grid">
                <div className="pp-card" style={{marginBottom:0}}>
                  <div className="pp-card-title">Clerk — Authentication</div>
                  <p>Manages your account, sign-in, and Google OAuth. Stores your email, name, and profile picture. <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" style={{color:'#c44070'}}>Clerk Privacy Policy →</a></p>
                </div>
                <div className="pp-card" style={{marginBottom:0}}>
                  <div className="pp-card-title">Razorpay — Payments</div>
                  <p>Processes all online payments. Fully PCI-DSS compliant. We never receive your card data. <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" style={{color:'#c44070'}}>Razorpay Privacy Policy →</a></p>
                </div>
                <div className="pp-card" style={{marginBottom:0}}>
                  <div className="pp-card-title">Cloudinary — Image Storage</div>
                  <p>Stores and serves product images. Does not process any personal customer data. <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" style={{color:'#c44070'}}>Cloudinary Privacy Policy →</a></p>
                </div>
                <div className="pp-card" style={{marginBottom:0}}>
                  <div className="pp-card-title">Resend — Transactional Email</div>
                  <p>Sends order confirmation emails using your email address and order details. <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{color:'#c44070'}}>Resend Privacy Policy →</a></p>
                </div>
                <div className="pp-card" style={{marginBottom:0}}>
                  <div className="pp-card-title">Google Analytics — Analytics</div>
                  <p>Tracks anonymised website usage data. You can opt out via <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{color:'#c44070'}}>Google's opt-out tool →</a></p>
                </div>
                <div className="pp-card" style={{marginBottom:0}}>
                  <div className="pp-card-title">MongoDB Atlas — Database</div>
                  <p>Hosts our product catalogue, orders, and review data on encrypted cloud infrastructure. <a href="https://www.mongodb.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{color:'#c44070'}}>MongoDB Privacy Policy →</a></p>
                </div>
                <div className="pp-card" style={{marginBottom:0}}>
                  <div className="pp-card-title">Vercel — Hosting</div>
                  <p>Hosts our Next.js application. Processes request logs briefly for performance and security. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{color:'#c44070'}}>Vercel Privacy Policy →</a></p>
                </div>
                <div className="pp-card" style={{marginBottom:0}}>
                  <div className="pp-card-title">Meta (Instagram &amp; WhatsApp)</div>
                  <p>If you contact us via Instagram or WhatsApp, messages are handled by Meta's platforms. <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" style={{color:'#c44070'}}>Meta Privacy Policy →</a></p>
                </div>
              </div>

              <p style={{marginTop:'16px'}}>
                We do not sell, rent, or trade your personal data to any third party for marketing purposes. Data is shared with the above providers only to the extent necessary to operate our service.
              </p>
            </section>

            <div className="pp-divider" />

            {/* 5. COOKIES */}
            <section className="pp-section" id="cookies">
              <div className="pp-section-header">
                <div className="pp-section-icon">🍪</div>
                <h2>Cookies &amp; Local Storage</h2>
              </div>

              <p>
                Our website uses browser-based storage technologies to enhance your experience. In accordance with the IT Act and SPDI Rules, we inform you of the following:
              </p>

              <div className="pp-table-wrap">
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th>Technology</th>
                      <th>What It Stores</th>
                      <th>Purpose</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>localStorage</strong> (Cart)</td>
                      <td>Cart items, quantities, product IDs</td>
                      <td>Persists your cart across browser sessions and tabs without requiring login</td>
                      <td>Until cleared by you</td>
                    </tr>
                    <tr>
                      <td><strong>Clerk Session Cookie</strong></td>
                      <td>Authentication token (JWT)</td>
                      <td>Keeps you logged in securely; validates your identity with our backend</td>
                      <td>Session / Clerk's policy</td>
                    </tr>
                    <tr>
                      <td><strong>Google Analytics Cookies</strong> (_ga, _gid)</td>
                      <td>Anonymised visitor ID, session data</td>
                      <td>Measures website traffic and user behaviour in aggregate</td>
                      <td>Up to 2 years</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                You can delete cookies and localStorage data at any time through your browser settings. Please note that clearing cart data will empty your shopping cart. Disabling Clerk session cookies will log you out and prevent order history access.
              </p>
              <div className="pp-highlight">
                <div className="pp-highlight-title">No Tracking Cookies for Advertising</div>
                <p>We do not use any advertising, retargeting, or behavioural tracking cookies. No third-party ad networks have access to your browsing behaviour on our site.</p>
              </div>
            </section>

            <div className="pp-divider" />

            {/* 6. DATA RETENTION */}
            <section className="pp-section" id="data-retention">
              <div className="pp-section-header">
                <div className="pp-section-icon">🗂️</div>
                <h2>Data Retention</h2>
              </div>
              <p>
                We retain personal data only for as long as necessary to fulfil the purposes described in this policy or as required by applicable Indian law.
              </p>

              <div className="pp-table-wrap">
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th>Data Category</th>
                      <th>Retention Period</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Account information</td>
                      <td>Until account deletion</td>
                      <td>Service provision</td>
                    </tr>
                    <tr>
                      <td>Order records (including address &amp; phone)</td>
                      <td>7 years minimum</td>
                      <td>Accounting, GST compliance, and consumer dispute resolution under Indian law</td>
                    </tr>
                    <tr>
                      <td>Payment IDs (Razorpay)</td>
                      <td>7 years</td>
                      <td>RBI record-keeping guidelines</td>
                    </tr>
                    <tr>
                      <td>Product reviews</td>
                      <td>Until deleted by you or us</td>
                      <td>Public product information</td>
                    </tr>
                    <tr>
                      <td>Analytics data</td>
                      <td>26 months (Google's default)</td>
                      <td>Performance analysis</td>
                    </tr>
                    <tr>
                      <td>Server / request logs</td>
                      <td>Up to 30 days (Vercel)</td>
                      <td>Security and debugging</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                After the applicable retention period, data is securely deleted or anonymised. Deletion requests may be submitted to our Grievance Officer (see below); however, legally mandated records cannot be erased before their required retention period.
              </p>
            </section>

            <div className="pp-divider" />

            {/* 7. SECURITY */}
            <section className="pp-section" id="security">
              <div className="pp-section-header">
                <div className="pp-section-icon">🔒</div>
                <h2>Data Security</h2>
              </div>
              <p>
                We implement reasonable security practices as mandated by <strong>Rule 8 of the SPDI Rules, 2011</strong>. Our technical safeguards include:
              </p>

              <div className="pp-chip-list">
                <span className="pp-chip">JWT authentication with Web Crypto</span>
                <span className="pp-chip">Rate limiting on all auth endpoints</span>
                <span className="pp-chip">Razorpay HMAC webhook signature verification</span>
                <span className="pp-chip">HTTPS (TLS) across the entire site</span>
                <span className="pp-chip">Mongoose $gte guards against stock manipulation</span>
                <span className="pp-chip">XSS sanitisation (DOMPurify &amp; validator.escape)</span>
                <span className="pp-chip">Content Security Policy (CSP) nonce headers</span>
                <span className="pp-chip">Server-side price recalculation (no client tampering)</span>
                <span className="pp-chip">Admin routes protected by Edge Middleware</span>
                <span className="pp-chip">Encrypted MongoDB Atlas storage</span>
              </div>

              <div className="pp-warning">
                <p>
                  <strong>Important:</strong> No method of electronic transmission or storage is 100% secure. While we strive to protect your personal data using industry-standard measures, we cannot guarantee absolute security. In the event of a data breach that affects your rights, we will notify you as required by law.
                </p>
              </div>
            </section>

            <div className="pp-divider" />

            {/* 8. YOUR RIGHTS */}
            <section className="pp-section" id="your-rights">
              <div className="pp-section-header">
                <div className="pp-section-icon">⚖️</div>
                <h2>Your Rights</h2>
              </div>
              <p>
                As a data subject under the <strong>IT Act, 2000</strong> and the <strong>SPDI Rules, 2011</strong>, and as a consumer under the <strong>Consumer Protection Act, 2019</strong>, you have the following rights with respect to your personal data:
              </p>

              <div className="pp-rights-grid">
                <div className="pp-right-card">
                  <span className="pp-right-icon">👁️</span>
                  <div className="pp-right-title">Right to Access</div>
                  <div className="pp-right-desc">You may request a copy of the personal information we hold about you at any time.</div>
                </div>
                <div className="pp-right-card">
                  <span className="pp-right-icon">✏️</span>
                  <div className="pp-right-title">Right to Correction</div>
                  <div className="pp-right-desc">You may request correction of inaccurate or incomplete data. Account details can be updated directly via your profile.</div>
                </div>
                <div className="pp-right-card">
                  <span className="pp-right-icon">🗑️</span>
                  <div className="pp-right-title">Right to Deletion</div>
                  <div className="pp-right-desc">You may request deletion of your account and associated data, subject to our legal retention obligations.</div>
                </div>
                <div className="pp-right-card">
                  <span className="pp-right-icon">🚫</span>
                  <div className="pp-right-title">Right to Withdraw Consent</div>
                  <div className="pp-right-desc">You may withdraw consent for data processing at any time. This may affect your ability to use certain features.</div>
                </div>
                <div className="pp-right-card">
                  <span className="pp-right-icon">📦</span>
                  <div className="pp-right-title">Right to Data Portability</div>
                  <div className="pp-right-desc">You may request a copy of your order history and account data in a machine-readable format.</div>
                </div>
                <div className="pp-right-card">
                  <span className="pp-right-icon">📣</span>
                  <div className="pp-right-title">Right to Grievance Redressal</div>
                  <div className="pp-right-desc">You may lodge a complaint with our Grievance Officer, who will respond within 30 days as required by law.</div>
                </div>
              </div>

              <p style={{marginTop:'16px'}}>
                To exercise any of these rights, please contact our Grievance Officer (details below). We will respond within <strong>30 days</strong> of receiving a verifiable request, as required under the SPDI Rules.
              </p>
            </section>

            <div className="pp-divider" />

            {/* 9. CHILDREN */}
            <section className="pp-section" id="children">
              <div className="pp-section-header">
                <div className="pp-section-icon">🧒</div>
                <h2>Children's Privacy</h2>
              </div>
              <p>
                Our website is not directed at children under the age of <strong>18 years</strong>. We do not knowingly collect personal information from minors. If you are a parent or guardian and believe your child has provided us with personal information, please contact our Grievance Officer immediately and we will delete such information promptly.
              </p>
              <p>
                Purchases by minors must be made with the involvement and consent of a parent or guardian, in accordance with the <strong>Indian Contract Act, 1872</strong>, which requires parties to a contract to be of legal age.
              </p>
            </section>

            <div className="pp-divider" />

            {/* 10. GRIEVANCE OFFICER */}
            <section className="pp-section" id="grievance">
              <div className="pp-section-header">
                <div className="pp-section-icon">📮</div>
                <h2>Grievance Officer</h2>
              </div>
              <p>
                In accordance with <strong>Rule 5(9) of the SPDI Rules, 2011</strong> and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, we have designated the following person as our Grievance Officer:
              </p>

              <div className="pp-grievance-card">
                <div className="pp-grievance-avatar">N</div>
                <div>
                  <div className="pp-grievance-name">Nidhi Tripathi</div>
                  <div className="pp-grievance-role">Grievance Officer &amp; Owner</div>
                  <div className="pp-grievance-details">
                    <div className="pp-grievance-row">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4l6 5 6-5M2 4h12v9a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="#c44070" strokeWidth="1.4"/></svg>
                      <span>Email: <a href="mailto:business@nidsscrochet.in">business@nidsscrochet.in</a></span>
                    </div>
                    <div className="pp-grievance-row">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="3" stroke="#c44070" strokeWidth="1.4"/><circle cx="8" cy="8" r="2.5" stroke="#c44070" strokeWidth="1.4"/><circle cx="11.5" cy="4.5" r="0.75" fill="#c44070"/></svg>
                      <span>Instagram: <a href="https://www.instagram.com/Nidsscrochet" target="_blank" rel="noopener noreferrer">@Nidsscrochet</a></span>
                    </div>
                    <div className="pp-grievance-row">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8c0 1.16.3 2.26.84 3.2L1.5 14.5l3.3-.84A6.5 6.5 0 108 1.5z" stroke="#c44070" strokeWidth="1.4"/></svg>
                      <span>WhatsApp: <a href="https://wa.me/919029562156">wa.me/919029562156</a></span>
                    </div>
                    <div className="pp-grievance-row">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 9.5A1.5 1.5 0 108 6.5 1.5 1.5 0 008 9.5zM8 2C5.24 2 3 4.24 3 7c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5z" stroke="#c44070" strokeWidth="1.4"/></svg>
                      <span>Location: Mumbai, Maharashtra, India</span>
                    </div>
                  </div>
                </div>
              </div>

              <p style={{marginTop:'16px'}}>
                Grievances shall be acknowledged within <strong>48 hours</strong> and redressed within <strong>30 days</strong> of receipt, as mandated under the Consumer Protection (E-Commerce) Rules, 2020. If your grievance is not resolved to your satisfaction, you may also approach the <strong>National Consumer Helpline</strong> at <a href="tel:1800-11-4000" style={{color:'#c44070'}}>1800-11-4000</a> or visit <a href="https://consumerhelpline.gov.in" target="_blank" rel="noopener noreferrer" style={{color:'#c44070'}}>consumerhelpline.gov.in</a>.
              </p>
            </section>

            <div className="pp-divider" />

            {/* 11. CHANGES */}
            <section className="pp-section" id="changes">
              <div className="pp-section-header">
                <div className="pp-section-icon">🔄</div>
                <h2>Policy Changes</h2>
              </div>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. When we do, we will update the "Last Updated" date at the top of this page.
              </p>
              <p>
                For material changes — such as changes to what sensitive personal data we collect or how we use it — we will notify you via email (if you have an account) or by placing a prominent notice on our homepage, at least 7 days before the change takes effect. Your continued use of the website after the effective date constitutes your acceptance of the updated policy.
              </p>
            </section>

            <div className="pp-divider" />

            {/* 12. CONTACT */}
            <section className="pp-section" id="contact">
              <div className="pp-section-header">
                <div className="pp-section-icon">💌</div>
                <h2>Contact Us</h2>
              </div>
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or the handling of your personal data, please reach out to us through any of the following channels:
              </p>

              <div className="pp-info-grid">
                <div className="pp-card" style={{marginBottom:0}}>
                  <div className="pp-card-title">Email</div>
                  <p><a href="mailto:business@nidsscrochet.in" style={{color:'#c44070'}}>business@nidsscrochet.in</a><br/><span style={{fontSize:'12px', color:'#7a5060'}}>For formal / legal requests</span></p>
                </div>
                <div className="pp-card" style={{marginBottom:0}}>
                  <div className="pp-card-title">WhatsApp</div>
                  <p><a href="https://wa.me/919029562156" style={{color:'#c44070'}}>+91 90295 62156</a><br/><span style={{fontSize:'12px', color:'#7a5060'}}>Fastest response</span></p>
                </div>
                <div className="pp-card" style={{marginBottom:0}}>
                  <div className="pp-card-title">Instagram DM</div>
                  <p><a href="https://www.instagram.com/Nidsscrochet" target="_blank" rel="noopener noreferrer" style={{color:'#c44070'}}>@Nidsscrochet</a></p>
                </div>
                <div className="pp-card" style={{marginBottom:0}}>
                  <div className="pp-card-title">Phone</div>
                  <p><a href="tel:9029562156" style={{color:'#c44070'}}>90295 62156</a></p>
                </div>
              </div>

              <p style={{marginTop:'16px', fontSize:'13px', color:'#7a5060'}}>
                This Privacy Policy is governed by the laws of the Republic of India. Any disputes arising out of or in connection with this policy shall be subject to the exclusive jurisdiction of the courts in <strong>Mumbai, Maharashtra</strong>.
              </p>
            </section>

          </div>
        </div>

        {/* FOOTER */}
        <div className="pp-footer">
          <div className="pp-footer-links">
            <Link href="/">Home</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/orders">My Orders</Link>
            <a href="https://www.instagram.com/Nidsscrochet" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://wa.me/919029562156" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
          <p>© {new Date().getFullYear()} Nidsscrochet by Nidhi Tripathi. All rights reserved.</p>
          <p style={{marginTop:'6px', fontSize:'12px', opacity:0.7}}>
            Mumbai, Maharashtra, India · Governed by the IT Act 2000, SPDI Rules 2011 &amp; Consumer Protection (E-Commerce) Rules 2020
          </p>
        </div>
      </div>
    </>
  );
}