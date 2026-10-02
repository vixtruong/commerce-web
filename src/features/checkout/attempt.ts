import { z } from 'zod';
import type { CheckoutAddress } from './schema';
const attemptSchema = z.object({
  key: z.string(),
  owner: z.string(),
  payload: z.object({
    recipientName: z.string(),
    addressLine1: z.string(),
    city: z.string(),
    postalCode: z.string(),
    countryCode: z.string(),
  }),
  fingerprint: z.string(),
  orderId: z.string().optional(),
});
export type Attempt = z.infer<typeof attemptSchema>;
const key = 'commerce.checkout-attempt';
export function loadAttempt(owner: string): Attempt | null {
  try {
    const parsed = attemptSchema.safeParse(JSON.parse(sessionStorage.getItem(key) || 'null'));
    return parsed.success && parsed.data.owner === owner ? parsed.data : null;
  } catch {
    return null;
  }
}
export function saveAttempt(attempt: Attempt) {
  sessionStorage.setItem(key, JSON.stringify(attempt));
}
export function checkoutAttempt(owner: string, payload: CheckoutAddress, fingerprint: string): Attempt {
  const current = loadAttempt(owner);
  if (current) return current;
  const attempt: Attempt = { owner, payload, fingerprint, key: crypto.randomUUID() };
  saveAttempt(attempt);
  return attempt;
}
export function clearAttempt() {
  sessionStorage.removeItem(key);
}
window.addEventListener('commerce:session-ended', (event) => {
  // Expiry may interrupt an accepted checkout response; retain the owner's key for their next sign-in.
  if (event instanceof CustomEvent && event.detail?.reason === 'logout') clearAttempt();
});
