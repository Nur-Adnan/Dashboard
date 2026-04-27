export type StudentStage = "learning" | "applying" | "interviewing" | "offer_pending" | "placed";

export type RiskStatus = "safe" | "at_risk";

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
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: string;
  student_id: string;
  date: string;
  present: boolean;
  logged_by: string;
}

export interface ProgressLog {
  id: string;
  student_id: string;
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