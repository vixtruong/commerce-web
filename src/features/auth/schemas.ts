import { messages } from '../../lib/messages';
import { z } from 'zod';
export const loginSchema = z.object({
  email: z.email(messages.invalidEmail),
  password: z.string().min(1, 'Enter your password.'),
});
export const registrationSchema = loginSchema.extend({
  password: z
    .string()
    .min(12, 'Use at least 12 characters.')
    .regex(/[A-Z]/, 'Include an uppercase letter.')
    .regex(/[a-z]/, 'Include a lowercase letter.')
    .regex(/[0-9]/, 'Include a number.')
    .regex(/[^a-zA-Z0-9]/, 'Include a symbol.'),
});
export type Credentials = z.infer<typeof loginSchema>;
