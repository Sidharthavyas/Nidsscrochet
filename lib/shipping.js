/**
 * lib/shipping.js
 * Single source of truth for shipping charges.
 *
 * Admin override: if ALL items have shipping_charges === 0 (explicitly set
 * in the admin), the whole order ships free, regardless of subtotal.
 *
 * Default tier (applied to discounted subtotal):
 *   < ₹500          → ₹80
 *   ₹500 – ₹799     → ₹50
 *   ≥ ₹800          → ₹0 (free)
 *
 * NOTE: shipping_charges === null means "use tier" (not set by admin).
 *       shipping_charges === 0   means "admin explicitly made it free".
 */
export function computeShipping(items, discountedSubtotal) {
  if (!items || items.length === 0) return 0;

  // If every item was explicitly marked free by admin → order ships free
  const allAdminFree = items.every((item) => item.shipping_charges === 0);
  if (allAdminFree) return 0;

  // Tiered default
  if (discountedSubtotal < 500) return 80;
  if (discountedSubtotal < 800) return 50;
  return 0;
}