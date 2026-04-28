import { z } from 'zod';

export const TeamUpdateFormSchema = z.object({
  goals: z.string().min(1, 'Goals is required').max(500),
  achievements: z.string().min(1, 'Achievements is required').max(500),
  blockers: z.string().max(500).optional(),
});

export type TeamUpdateFormInput = z.infer<typeof TeamUpdateFormSchema>;

// Validates only the fields submitted by the client
export const TeamUpdateBodySchema = z.object({
  goals: z.string().min(1).max(500),
  achievements: z.string().min(1).max(500),
  blockers: z.string().max(500).optional().default(''),
});

// Full schema including server-side fields (used for type safety internally)
export const TeamUpdateSchema = z.object({
  submitted_by: z.string(),
  role: z.enum(['admin', 'mentor', 'placement']),
  date: z.string(),
  goals: z.string().min(1).max(500),
  achievements: z.string().min(1).max(500),
  blockers: z.string().max(500).optional().default(''),
});

export type TeamUpdateInput = z.infer<typeof TeamUpdateSchema>;