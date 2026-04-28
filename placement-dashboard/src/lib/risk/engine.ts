import { getAllStudents, updateStudent } from '@/lib/sheets/students';
import { getAttendanceByStudent, getProgressByStudent } from '@/lib/sheets/logs';
import type { Student, RiskResult, AttendanceLog, ProgressLog } from '@/types';
import { differenceInDays } from 'date-fns';

export type RiskReason = 'absent_2_consecutive_days' | 'no_progress_update_7_days' | 'no_interview_or_task_7_days';

export function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return Infinity;
  return differenceInDays(new Date(), new Date(dateStr));
}

export function hasConsecutiveAbsences(logs: AttendanceLog[], count: number): boolean {
  if (logs.length < count) return false;
  
  const sortedLogs = [...logs]
    .filter(log => !log.present)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (sortedLogs.length < count) return false;
  
  for (let i = 0; i < count - 1; i++) {
    const currentDate = new Date(sortedLogs[i].date);
    const nextDate = new Date(sortedLogs[i + 1].date);
    const diff = differenceInDays(currentDate, nextDate);
    if (diff !== 1) return false;
  }
  
  return true;
}

/**
 * A student is terminated when they have accumulated 3 or more total absences
 * (not necessarily consecutive) across all their attendance logs.
 */
export function shouldTerminate(logs: AttendanceLog[]): boolean {
  const totalAbsences = logs.filter(log => !log.present).length;
  return totalAbsences >= 3;
}

export async function evaluateStudentRisk(
  student: Student,
  attendanceLogs: AttendanceLog[],
  progressLogs: ProgressLog[]
): Promise<RiskResult> {
  const reasons: RiskReason[] = [];

  if (hasConsecutiveAbsences(attendanceLogs, 2)) {
    reasons.push('absent_2_consecutive_days');
  }

  if (progressLogs.length > 0) {
    const lastProgress = progressLogs.sort(
      (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    )[0];
    if (daysSince(lastProgress.logged_at) >= 7) {
      reasons.push('no_progress_update_7_days');
    }
  } else if (daysSince(student.created_at) >= 7) {
    reasons.push('no_progress_update_7_days');
  }

  if (student.stage === 'applying' || student.stage === 'interviewing') {
    if (daysSince(student.last_activity_date) >= 7) {
      reasons.push('no_interview_or_task_7_days');
    }
  }

  return {
    is_at_risk: reasons.length > 0,
    reasons,
  };
}

export async function runRiskScan(): Promise<{ updated: number; newly_at_risk: string[] }> {
  const students = await getAllStudents();
  let updated = 0;
  const newlyAtRisk: string[] = [];

  for (const student of students) {
    // Skip already-terminated or hired students from risk/termination re-evaluation
    if (student.terminated || student.hired) continue;

    const attendanceLogs = await getAttendanceByStudent(student.id, 14);
    const progressLogs = await getProgressByStudent(student.id);

    // Termination check: 3+ total absences
    if (shouldTerminate(attendanceLogs) && !student.terminated) {
      await updateStudent(student.id, { terminated: true });
      updated++;
      continue; // terminated students don't need risk evaluation
    }

    const result = await evaluateStudentRisk(student, attendanceLogs, progressLogs);

    if (result.is_at_risk && student.risk_status === 'safe') {
      await updateStudent(student.id, {
        risk_status: 'at_risk',
        risk_reasons: result.reasons.join(', '),
      });
      updated++;
      newlyAtRisk.push(student.name);
    } else if (!result.is_at_risk && student.risk_status === 'at_risk') {
      await updateStudent(student.id, {
        risk_status: 'safe',
        risk_reasons: '',
      });
      updated++;
    }
  }

  return { updated, newly_at_risk: newlyAtRisk };
}