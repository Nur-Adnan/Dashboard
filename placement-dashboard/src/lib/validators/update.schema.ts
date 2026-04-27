import { z } from 'zod';

export const TeamUpdateFormSchema = z.object({
  goals: z.string().min(1, 'Goals is required').max(500),
  achievements: z.string().min(1, 'Achievements is required').max(500),
  blockers: z.string().max(500).optional(),
});

export type TeamUpdateFormInput = z.infer<typeof TeamUpdateFormSchema>;

export const TeamUpdateSchema = z.object({
  submitted_by: z.string().email(),
  role: z.enum(['admin', 'mentor', 'placement']),
  date: z.string(),
  goals: z.string().min(1).max(500),
  achievements: z.string().min(1).max(500),
  blockers: z.string().max(500).optional().default(''),
});

export type TeamUpdateInput = z.infer<typeof TeamUpdateSchema>;