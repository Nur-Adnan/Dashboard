import { NextResponse } from 'next/server';
import { readSheet, appendRow, findRowIndex, updateRow } from '@/lib/sheets/client';
import { requireRole } from '@/lib/auth/helpers';
import type { ApiError } from '@/lib/auth/helpers';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'status' in e;
}

const LogSchema = z.object({
  student_id: z.string().min(1),
  date: z.string().min(1),           // YYYY-MM-DD
  present: z.boolean(),
  session_label: z.string().default(''), // e.g. "Orientation", "Javascript"
});

// Sheet columns: id | student_id | date | present | logged_by | session_label
function rowToLog(row: string[]) {
  return {
    id: row[0] || '',
    student_id: row[1] || '',
    date: row[2] || '',
    present: row[3] === 'true',
    logged_by: row[4] || '',
    session_label: row[5] || '',
  };
}

// GET /api/attendance?student_id=xxx
export async function GET(request: Request) {
  try {
    requireRole(request.headers, ['admin', 'mentor', 'placement']);
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    const rows = await readSheet('attendance_logs');
    let logs = rows.map(rowToLog).filter(l => l.id); // skip empty rows

    if (studentId) {
      logs = logs.filter(l => l.student_id === studentId);
    }

    // Sort by date ascending
    logs.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ data: logs, total: logs.length });
  } catch (e) {
    const status = isApiError(e) ? e.status : 500;
    const message = isApiError(e) ? e.message : 'Internal server error';
    return NextResponse.json({ message }, { status });
  }
}

// POST /api/attendance — create or update a single attendance record
export async function POST(request: Request) {
  try {
    const user = requireRole(request.headers, ['admin', 'mentor', 'placement']);
    const body = await request.json();
    const result = LogSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { student_id, date, present, session_label } = result.data;

    // Check if a record already exists for this student+date — update it
    const rows = await readSheet('attendance_logs');
    const existingIdx = rows.findIndex(
      r => r[1] === student_id && r[2] === date
    );

    if (existingIdx !== -1) {
      // +2: +1 for header row, +1 for 1-based sheet index
      const sheetRow = existingIdx + 2;
      const existing = rowToLog(rows[existingIdx]);
      await updateRow('attendance_logs', sheetRow, [
        existing.id,
        student_id,
        date,
        String(present),
        user.email,
        session_label,
      ]);
      return NextResponse.json({ data: { ...existing, present, logged_by: user.email, session_label } });
    }

    // Create new record
    const id = uuidv4();
    await appendRow('attendance_logs', [id, student_id, date, String(present), user.email, session_label]);
    return NextResponse.json(
      { data: { id, student_id, date, present, logged_by: user.email, session_label } },
      { status: 201 }
    );
  } catch (e) {
    const status = isApiError(e) ? e.status : 500;
    const message = isApiError(e) ? e.message : 'Internal server error';
    return NextResponse.json({ message }, { status });
  }
}
