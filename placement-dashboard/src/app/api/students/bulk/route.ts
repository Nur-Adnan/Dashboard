import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createStudent } from '@/lib/sheets/students';
import { requireRole } from '@/lib/auth/helpers';
import type { ApiError } from '@/lib/auth/helpers';
import type { JobFocus } from '@/types';

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

const VALID_JOB_FOCUS: JobFocus[] = ['remote', 'onsite', 'hybrid'];

interface RowResult {
  row: number;
  name: string;
  success: boolean;
  error?: string;
}

export async function POST(request: Request) {
  try {
    // Mentors, admins, and placement staff can bulk upload
    const user = requireRole(request.headers, ['admin', 'mentor', 'placement']);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
      return NextResponse.json(
        { message: 'Invalid file type. Please upload .xlsx, .xls, or .csv' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    if (rows.length === 0) {
      return NextResponse.json({ message: 'File is empty or has no data rows' }, { status: 400 });
    }

    if (rows.length > 200) {
      return NextResponse.json(
        { message: 'Maximum 200 students per upload' },
        { status: 400 }
      );
    }

    const results: RowResult[] = [];
    let created = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is header

      // Normalize column names — support both snake_case and human-readable
      const name = String(row['name'] ?? row['Name'] ?? '').trim();
      const batch = String(row['batch'] ?? row['Batch'] ?? '').trim();
      const mentorEmail = String(
        row['mentor_email'] ?? row['Mentor Email'] ?? row['mentor email'] ?? ''
      ).trim();
      const jobFocusRaw = String(
        row['job_focus'] ?? row['Job Focus'] ?? row['job focus'] ?? ''
      ).trim().toLowerCase();
      const experienceRaw = String(
        row['experience'] ?? row['Experience'] ?? ''
      ).trim().toLowerCase();

      // Validate required fields
      if (!name) {
        results.push({ row: rowNum, name: name || '(empty)', success: false, error: 'Name is required' });
        failed++;
        continue;
      }
      if (!batch) {
        results.push({ row: rowNum, name, success: false, error: 'Batch is required' });
        failed++;
        continue;
      }
      if (!mentorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mentorEmail)) {
        results.push({ row: rowNum, name, success: false, error: 'Valid mentor email is required' });
        failed++;
        continue;
      }

      // For mentors: enforce their own email
      if (user.role === 'mentor' && mentorEmail !== user.email) {
        results.push({
          row: rowNum,
          name,
          success: false,
          error: `Mentor can only add students to their own email (${user.email})`,
        });
        failed++;
        continue;
      }

      const jobFocus = VALID_JOB_FOCUS.includes(jobFocusRaw as JobFocus)
        ? (jobFocusRaw as JobFocus)
        : undefined;

      const VALID_EXPERIENCE = ['fresher', 'experienced'];
      const experience = VALID_EXPERIENCE.includes(experienceRaw)
        ? (experienceRaw as 'fresher' | 'experienced')
        : undefined;

      try {
        await createStudent({ name, batch, mentor_email: mentorEmail, job_focus: jobFocus, experience });
        results.push({ row: rowNum, name, success: true });
        created++;
      } catch {
        results.push({ row: rowNum, name, success: false, error: 'Failed to save to sheet' });
        failed++;
      }
    }

    return NextResponse.json({
      created,
      failed,
      total: rows.length,
      results,
    });
  } catch (error: unknown) {
    const status = isApiError(error) ? error.status : 500;
    const message = isApiError(error) ? error.message : 'Internal server error';
    return NextResponse.json({ message }, { status });
  }
}
