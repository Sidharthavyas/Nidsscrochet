// lib/email.js — Order confirmation emails via Resend
// IMPORTANT: To send to real customers, you MUST:
//   1. Add your domain at https://resend.com/domains
//   2. Add DNS records (SPF, DKIM, etc.)
//   3. Set RESEND_FROM_EMAIL=orders@yourdomain.com in .env
//
// onboarding@resend.dev ONLY delivers to the email you signed up with!

import { Resend } from 'resend';

let resend;
try {
  resend = new Resend(process.env.RESEND_API_KEY);
} catch (err) {
  console.error('[email] Failed to initialize Resend:', err.message);
}

/**
 * Send order confirmation email to customer after successful order
 * @param {Object} order - Order document from MongoDB
 * @param {Object} customer - { name, email, phone, address }
 * @param {string} paymentMethod - 'online' | 'cod'
 */
export async function sendOrderConfirmationEmail(
  order,
  customer,
  paymentMethod = 'online'
) {
  // ─── Pre-flight checks with detailed logging ───────────────────
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] ❌ RESEND_API_KEY not set in environment variables');
    return { success: false, reason: 'not_configured' };
  }

  if (!resend) {
    console.warn('[email] ❌ Resend client not initialized');
    return { success: false, reason: 'client_not_initialized' };
  }

  const customerEmail = customer?.email;
  if (!customerEmail) {
    console.warn('[email] ❌ No customer email found in:', JSON.stringify(customer));
    return { success: false, reason: 'no_email' };
  }

  console.log('[email] ✅ Attempting to send email to:', customerEmail);

  // ─── Build email content ───────────────────────────────────────
  const orderId = order?.orderId || order?._id?.toString() || '—';
  const amount = order?.amount ? `₹${order.amount.toFixed(2)}` : '—';

  const itemsList = (order?.items || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #ffe5ec;font-size:0.88rem;color:#1a1a2e">${item.name || 'Item'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #ffe5ec;text-align:center;font-size:0.88rem;color:#6b7280">${item.quantity || 1}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #ffe5ec;text-align:right;font-size:0.88rem;font-weight:600;color:#ff4d8a">₹${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const paymentBadge =
    paymentMethod === 'cod'
      ? '<span style="background:#fef3c7;color:#d97706;padding:3px 10px;border-radius:20px;font-size:0.8rem;font-weight:600">📦 Cash on Delivery</span>'
      : '<span style="background:#d1fae5;color:#059669;padding:3px 10px;border-radius:20px;font-size:0.8rem;font-weight:600">✅ Paid Online</span>';

  const shortId = typeof orderId === 'string' ? orderId.slice(-8).toUpperCase() : 'ORDER';

  const subject =
    paymentMethod === 'cod'
      ? `Order Confirmed! 📦 #${shortId}`
      : `Payment Successful! 🎉 #${shortId}`;

  const customerName = customer?.name || 'Valued Customer';
  const customerAddress = customer?.address || '';
  const orderDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fffbf7;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">

  <!-- Header -->
  <div style="text-align:center;padding:24px 0 16px">
    <h1 style="margin:0;font-size:2rem;color:#ff4d8a">Nidsscrochet</h1>
    <p style="margin:4px 0 0;color:#6b7280;font-size:0.85rem">Handcrafted with ❤️ by Nidhi Tripathi</p>
  </div>

  <!-- Success Banner -->
  <div style="background:linear-gradient(135deg,#ff6b9d,#ff4d8a);border-radius:16px;padding:24px;text-align:center;margin-bottom:20px">
    <div style="font-size:2.5rem;margin-bottom:8px">${paymentMethod === 'cod' ? '📦' : '🎉'}</div>
    <h2 style="margin:0 0 8px;color:#fff;font-size:1.4rem">${paymentMethod === 'cod' ? 'Order Confirmed!' : 'Payment Successful!'}</h2>
    <p style="margin:0;color:rgba(255,255,255,0.9);font-size:0.88rem">
      Thank you, ${customerName}! Your order has been ${paymentMethod === 'cod' ? 'placed' : 'confirmed'}.
    </p>
  </div>

  <!-- Order Details -->
  <div style="background:#fff;border-radius:14px;padding:20px;margin-bottom:16px;border:1px solid rgba(255,107,157,0.1);box-shadow:0 4px 16px rgba(0,0,0,0.04)">
    <h3 style="margin:0 0 14px;font-size:0.95rem;color:#1a1a2e;font-weight:700">📋 Order Details</h3>
    <table style="width:100%;border-collapse:collapse;font-size:0.88rem">
      <tr>
        <td style="padding:6px 0;color:#6b7280">Order ID</td>
        <td style="padding:6px 0;text-align:right;font-family:monospace;font-weight:600;color:#1a1a2e;font-size:0.78rem">${orderId}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280">Date</td>
        <td style="padding:6px 0;text-align:right;font-weight:600;color:#1a1a2e">${orderDate}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280">Amount</td>
        <td style="padding:6px 0;text-align:right;font-weight:700;color:#ff4d8a;font-size:1rem">${amount}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280">Payment</td>
        <td style="padding:6px 0;text-align:right">${paymentBadge}</td>
      </tr>
      ${customerAddress ? `<tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">Delivery To</td><td style="padding:6px 0;text-align:right;color:#1a1a2e;font-size:0.83rem;line-height:1.4">${customerAddress}</td></tr>` : ''}
    </table>
  </div>

  <!-- Items List -->
  ${itemsList
      ? `<div style="background:#fff;border-radius:14px;padding:20px;margin-bottom:16px;border:1px solid rgba(255,107,157,0.1);box-shadow:0 4px 16px rgba(0,0,0,0.04)">
    <h3 style="margin:0 0 14px;font-size:0.95rem;color:#1a1a2e;font-weight:700">🧶 Items Ordered</h3>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#ffe5ec">
          <th style="padding:8px 12px;text-align:left;font-size:0.78rem;color:#ff4d8a;font-weight:600">Item</th>
          <th style="padding:8px 12px;text-align:center;font-size:0.78rem;color:#ff4d8a;font-weight:600">Qty</th>
          <th style="padding:8px 12px;text-align:right;font-size:0.78rem;color:#ff4d8a;font-weight:600">Price</th>
        </tr>
      </thead>
      <tbody>${itemsList}</tbody>
    </table>
  </div>`
      : ''
    }

  <!-- Whats Next -->
  <div style="background:#ffe5ec;border-radius:14px;padding:16px 20px;margin-bottom:16px">
    <h3 style="margin:0 0 10px;font-size:0.88rem;color:#ff4d8a;font-weight:700">What's Next?</h3>
    <ul style="margin:0;padding-left:16px;font-size:0.83rem;color:#1a1a2e;line-height:2">
      <li>We'll process your order within 1–2 business days</li>
      <li>You'll receive tracking info once shipped</li>
      <li>Estimated delivery: 3–5 business days</li>
      ${paymentMethod === 'cod' ? `<li>Please keep ${amount} ready for cash payment on delivery</li>` : ''}
    </ul>
  </div>

  <!-- Help -->
  <div style="text-align:center;padding:16px 0">
    <p style="margin:0 0 8px;color:#6b7280;font-size:0.83rem">Need help? We're here for you!</p>
    <a href="tel:9029562156" style="display:inline-block;margin:4px 8px;color:#ff6b9d;text-decoration:none;font-size:0.83rem;font-weight:500">📞 9029562156</a>
    <a href="https://www.instagram.com/Nidsscrochet" style="display:inline-block;margin:4px 8px;color:#ff6b9d;text-decoration:none;font-size:0.83rem;font-weight:500">📷 @Nidsscrochet</a>
  </div>

  <!-- Footer -->
  <div style="text-align:center;padding:16px 0;border-top:1px solid rgba(255,107,157,0.1)">
    <p style="margin:0;color:#6b7280;font-size:0.75rem">Nidsscrochet · Handcrafted Crochet by Nidhi Tripathi · Mumbai, India</p>
    <p style="margin:4px 0 0;color:#6b7280;font-size:0.7rem">© ${new Date().getFullYear()} Nidsscrochet. All rights reserved.</p>
  </div>

</div>
</body>
</html>`;

  // ─── Send via Resend ───────────────────────────────────────────
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || 'Nidsscrochet <onboarding@resend.dev>';

  console.log('[email] Sending with config:', {
    from: fromEmail,
    to: customerEmail,
    subject: subject,
    hasHtml: !!html,
  });

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: [customerEmail],
      subject,
      html,
    });

    // Resend returns { data: { id }, error: null } on success
    // or { data: null, error: { message, statusCode } } on failure
    if (result?.error) {
      console.error('[email] ❌ Resend API error:', JSON.stringify(result.error));
      return { success: false, error: result.error.message || 'Resend API error' };
    }

    console.log(
      '[email] ✅ Order confirmation sent to',
      customerEmail,
      '| id:',
      result?.data?.id
    );
    return { success: true, id: result?.data?.id };
  } catch (err) {
    console.error(
      '[email] ❌ Failed to send order confirmation:',
      err?.message || err
    );
    console.error('[email] Full error:', JSON.stringify(err, null, 2));
    return { success: false, error: err?.message };
  }
}