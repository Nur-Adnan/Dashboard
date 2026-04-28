import { readSheet, appendRow, updateRow, deleteRow, findRowIndex } from './client';
import type { TeamUpdate, UserRole } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Columns: id, submitted_by, role, date, goals, achievements, blockers, submitted_at, edited_at
function rowToTeamUpdate(row: string[]): TeamUpdate {
  return {
    id: row[0] || '',
    submitted_by: row[1] || '',
    role: (row[2] as UserRole) || 'mentor',
    date: row[3] || '',
    goals: row[4] || '',
    achievements: row[5] || '',
    blockers: row[6] || '',
    submitted_at: row[7] || '',
    edited_at: row[8] || undefined,
  };
}

export async function getUpdatesByDate(date: string): Promise<TeamUpdate[]> {
  const rows = await readSheet('team_updates');
  return rows.map(rowToTeamUpdate).filter(update => update.date === date);
}

export async function hasSubmittedToday(userEmail: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const updates = await getUpdatesByDate(today);
  return updates.some(u => u.submitted_by === userEmail);
}

export async function submitUpdate(data: Omit<TeamUpdate, 'id' | 'submitted_at' | 'edited_at'>): Promise<TeamUpdate> {
  const update: TeamUpdate = {
    id: uuidv4(),
    ...data,
    submitted_at: new Date().toISOString(),
  };

  await appendRow('team_updates', [
    update.id,
    update.submitted_by,
    update.role,
    update.date,
    update.goals,
    update.achievements,
    update.blockers,
    update.submitted_at,
    '', // edited_at empty on first submit
  ]);

  return update;
}

export async function editUpdate(
  id: string,
  ownerEmail: string,
  fields: { goals: string; achievements: string; blockers: string }
): Promise<TeamUpdate> {
  const rowIndex = await findRowIndex('team_updates', 0, id);
  if (rowIndex === -1) throw Object.assign(new Error('Update not found'), { status: 404 });

  const rows = await readSheet('team_updates');
  // findRowIndex returns 1-based sheet row (including header), readSheet skips header
  // so the data row index in `rows` is rowIndex - 2
  const existing = rowToTeamUpdate(rows[rowIndex - 2]);

  if (existing.submitted_by !== ownerEmail) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  const edited_at = new Date().toISOString();
  const updated: TeamUpdate = { ...existing, ...fields, edited_at };

  await updateRow('team_updates', rowIndex, [
    updated.id,
    updated.submitted_by,
    updated.role,
    updated.date,
    updated.goals,
    updated.achievements,
    updated.blockers,
    updated.submitted_at,
    updated.edited_at,
  ]);

  return updated;
}

export async function deleteUpdate(id: string, ownerEmail: string): Promise<void> {
  const rowIndex = await findRowIndex('team_updates', 0, id);
  if (rowIndex === -1) throw Object.assign(new Error('Update not found'), { status: 404 });

  const rows = await readSheet('team_updates');
  const existing = rowToTeamUpdate(rows[rowIndex - 2]);

  if (existing.submitted_by !== ownerEmail) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  await deleteRow('team_updates', rowIndex);
}

export async function getAllBlockers(date?: string): Promise<string[]> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const updates = await getUpdatesByDate(targetDate);
  return updates
    .map(u => u.blockers)
    .filter(blockers => blockers && blockers.trim() !== '');
}
