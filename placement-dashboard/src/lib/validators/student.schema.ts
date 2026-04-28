import { z } from 'zod';
import type { StudentStage, RiskStatus } from '@/types';

export const CreateStudentSchema = z.object({
  name: z.string().min(2).max(100),
  batch: z.string().min(1).max(50),
  mentor_email: z.string().email(),
  job_focus: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  experience: z.enum(['fresher', 'experienced']).optional(),
});

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;

export const UpdateStudentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  batch: z.string().min(1).max(50).optional(),
  mentor_email: z.string().email().optional(),
  stage: z.enum(['learning', 'applying', 'interviewing', 'offer_pending', 'placed', 'hired']).optional(),
  risk_status: z.enum(['safe', 'at_risk']).optional(),
  risk_reasons: z.string().optional(),
  last_activity_date: z.string().optional(),
  job_focus: z.enum(['remote', 'onsite', 'hybrid', '']).optional(),
  terminated: z.boolean().optional(),
  hired: z.boolean().optional(),
  experience: z.enum(['fresher', 'experienced', '']).optional(),
});

export type UpdateStudentInput = z.infer<typeof UpdateStudentSchema>;

export const AttendanceSchema = z.object({
  student_id: z.string().uuid(),
  date: z.string(),
  present: z.boolean(),
  logged_by: z.string(),
});

export type AttendanceInput = z.infer<typeof AttendanceSchema>;

export const ProgressLogSchema = z.object({
  student_id: z.string().uuid(),
  note: z.string().min(1).max(1000),
  logged_by: z.string(),
});

export type ProgressLogInput = z.infer<typeof ProgressLogSchema>;