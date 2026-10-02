import { messages } from '../../lib/messages';
import { z } from 'zod';
export const checkoutSchema = z.object({
  recipientName: z.string().trim().min(1, messages.enterRecipient).max(200),
  addressLine1: z.string().trim().min(1, messages.enterAddress).max(300),
  city: z.string().trim().min(1, messages.enterCity).max(100),
  postalCode: z.string().trim().min(1, messages.enterPostalCode).max(30),
  countryCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, messages.countryValidation)
    .transform((s) => s.toUpperCase()),
});
export type CheckoutAddress = z.infer<typeof checkoutSchema>;
