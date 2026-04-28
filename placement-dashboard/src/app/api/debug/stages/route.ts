import { NextResponse } from 'next/server';
import { readSheet } from '@/lib/sheets/client';
import { requireRole } from '@/lib/auth/helpers';
import type { ApiError } from '@/lib/auth/helpers';

function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'status' in e;
}

// GET /api/debug/stages — shows raw stage values from the sheet vs normalized
// Admin only. Remove this route once the migration is confirmed.
export async function GET(request: Request) {
  try {
    requireRole(request.headers, ['admin']);
    const rows = await readSheet('students');

    const VALID = new Set(['learning', 'applying', 'interviewing', 'offer_pending', 'placed', 'hired']);
    const MAP: Record<string, string> = {
      beginner: 'learning', intermediate: 'applying', advanced: 'interviewing',
      bogliner: 'learning', boginner: 'learning',
    };

    const summary = rows.map((row, i) => {
      const raw = row[4] || '';
      const s = raw.toLowerCase().trim();
      const normalized = VALID.has(s) ? s : (MAP[s] ?? 'learning');
      return { row: i + 2, name: row[1], raw_stage: raw, normalized };
    });

    const counts: Record<string, number> = {};
    summary.forEach(r => { counts[r.normalized] = (counts[r.normalized] || 0) + 1; });

    return NextResponse.json({ counts, rows: summary });
  } catch (e) {
    const status = isApiError(e) ? e.status : 500;
    const message = isApiError(e) ? e.message : 'error';
    return NextResponse.json({ message }, { status });
  }
}
