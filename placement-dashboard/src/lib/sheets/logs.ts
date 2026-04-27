import { readSheet, appendRow } from './client';
import type { AttendanceLog, ProgressLog } from '@/types';
import { subDays, format } from 'date-fns';

const ATTENDANCE_HEADERS = ['id', 'student_id', 'date', 'present', 'logged_by'];
const PROGRESS_HEADERS = ['id', 'student_id', 'note', 'logged_at', 'logged_by'];

function rowToAttendanceLog(row: string[]): AttendanceLog {
  return {
    id: row[0] || '',
    student_id: row[1] || '',
    date: row[2] || '',
    present: row[3] === 'true',
    logged_by: row[4] || '',
  };
}

function rowToProgressLog(row: string[]): ProgressLog {
  return {
    id: row[0] || '',
    student_id: row[1] || '',
    note: row[2] || '',
    logged_at: row[3] || '',
    logged_by: row[4] || '',
  };
}

export async function getAttendanceByStudent(studentId: string, days: number = 30): Promise<AttendanceLog[]> {
  const cutoffDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
  const rows = await readSheet('attendance_logs');
  return rows
    .map(rowToAttendanceLog)
    .filter(log => log.student_id === studentId && log.date >= cutoffDate);
}

export async function appendAttendanceLog(log: Omit<AttendanceLog, 'id'>): Promise<void> {
  const { v4: uuidv4 } = await import('uuid');
  const newLog: AttendanceLog = {
    id: uuidv4(),
    ...log,
  };
  await appendRow('attendance_logs', [
    newLog.id,
    newLog.student_id,
    newLog.date,
    String(newLog.present),
    newLog.logged_by,
  ]);
}

export async function getProgressByStudent(studentId: string): Promise<ProgressLog[]> {
  const rows = await readSheet('progress_logs');
  return rows.map(rowToProgressLog).filter(log => log.student_id === studentId);
}

export async function getLastProgressLog(studentId: string): Promise<ProgressLog | null> {
  const logs = await getProgressByStudent(studentId);
  if (logs.length === 0) return null;
  return logs.sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())[0];
}

export async function appendProgressLog(log: Omit<ProgressLog, 'id'>): Promise<void> {
  const { v4: uuidv4 } = await import('uuid');
  const newLog: ProgressLog = {
    id: uuidv4(),
    ...log,
  };
  await appendRow('progress_logs', [
    newLog.id,
    newLog.student_id,
    newLog.note,
    newLog.logged_at,
    newLog.logged_by,
  ]);
}