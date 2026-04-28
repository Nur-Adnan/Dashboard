export type StudentStage = "learning" | "applying" | "interviewing" | "offer_pending" | "placed" | "hired";

export type RiskStatus = "safe" | "at_risk";

export type JobFocus = "remote" | "onsite" | "hybrid";

export type ExperienceLevel = "fresher" | "experienced";

export type UserRole = "admin" | "mentor" | "placement";

export interface Student {
  id: string;
  name: string;
  batch: string;
  mentor_email: string;
  stage: StudentStage;
  risk_status: RiskStatus;
  risk_reasons: string;
  last_activity_date: string;
  job_focus: JobFocus | "";
  terminated: boolean;
  hired: boolean;
  created_at: string;
  updated_at: string;
  experience: ExperienceLevel | "";
}

export interface AttendanceLog {
  id: string;
  student_id: string;
  date: string;
  present: boolean;
  logged_by: string;
}

export type ProgressLogType = "Interview Call" | "Job Task" | "Offer" | "Other";

export interface ProgressLog {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  log_type: ProgressLogType;
  company_name: string;
  scheduled_date: string;
  scheduled_time: string;
  note: string;
  logged_at: string;
  logged_by: string;
}

export interface TeamUpdate {
  id: string;
  submitted_by: string;
  role: UserRole;
  date: string;
  goals: string;
  achievements: string;
  blockers: string;
  submitted_at: string;
  edited_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RiskResult {
  is_at_risk: boolean;
  reasons: string[];
}

export interface PlacementStats {
  learning: number;
  applying: number;
  interviewing: number;
  offer_pending: number;
  placed: number;
}