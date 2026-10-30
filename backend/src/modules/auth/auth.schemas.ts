/**
 * zod schemas for the auth module (BL-1 step 2, BR-1). Both fields must be present and non-blank.
 */
import { z } from 'zod';

export const loginBodySchema = z.object({
  identifier: z.string().trim().min(1, 'Identifier is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
