import { readSheet, appendRow, findRowIndex, deleteRow } from './client';
import type { ProgressLog, ProgressLogType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Sheet columns: id, student_id, student_name, student_email, log_type, company_name,
//                scheduled_date, scheduled_time, note, logged_at, logged_by
function rowToProgressLog(row: string[]): ProgressLog {
  return {
    id: row[0] || '',
    student_id: row[1] || '',
    student_name: row[2] || '',
    student_email: row[3] || '',
    log_type: (row[4] as ProgressLogType) || 'Other',
    company_name: row[5] || '',
    scheduled_date: row[6] || '',
    scheduled_time: row[7] || '',
    note: row[8] || '',
    logged_at: row[9] || '',
    logged_by: row[10] || '',
  };
}

function progressLogToRow(log: ProgressLog): unknown[] {
  return [
    log.id,
    log.student_id,
    log.student_name,
    log.student_email,
    log.log_type,
    log.company_name,
    log.scheduled_date,
    log.scheduled_time,
    log.note,
    log.logged_at,
    log.logged_by,
  ];
}

export async function getProgressLogsByStudent(studentId: string): Promise<ProgressLog[]> {
  const rows = await readSheet('progress_logs');
  return rows
    .map(rowToProgressLog)
    .filter(log => log.student_id === studentId)
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
}

export async function getAllProgressLogs(): Promise<ProgressLog[]> {
  const rows = await readSheet('progress_logs');
  return rows
    .map(rowToProgressLog)
    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
}

export async function createProgressLog(
  data: Omit<ProgressLog, 'id' | 'logged_at'>
): Promise<ProgressLog> {
  const log: ProgressLog = {
    ...data,
    id: uuidv4(),
    logged_at: new Date().toISOString(),
  };
  await appendRow('progress_logs', progressLogToRow(log));
  return log;
}

export async function deleteProgressLog(id: string, requesterEmail: string, isAdmin: boolean): Promise<void> {
  const rowIndex = await findRowIndex('progress_logs', 0, id);
  if (rowIndex === -1) throw Object.assign(new Error('Log not found'), { status: 404 });

  const rows = await readSheet('progress_logs');
  const existing = rowToProgressLog(rows[rowIndex - 2]);

  if (!isAdmin && existing.logged_by !== requesterEmail) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  await deleteRow('progress_logs', rowIndex);
}
