import { messages } from '../../lib/messages';
import { z } from 'zod';
export const productSchema = z.object({
  sku: z.string().trim().min(1, messages.enterSku).max(64),
  name: z.string().trim().min(1, messages.enterProductName).max(200),
  description: z.string().max(2000),
  priceAmount: z.number().min(0).max(999999999999.99),
  priceCurrency: z
    .string()
    .regex(/^[A-Za-z]{3}$/, messages.currencyValidation)
    .transform((s) => s.toUpperCase()),
});
export type ProductInput = z.infer<typeof productSchema>;
