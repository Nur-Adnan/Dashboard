import { NextResponse } from 'next/server';
import { getAllProgressLogs, getProgressLogsByStudent, createProgressLog } from '@/lib/sheets/progress-logs';
import { getStudentById } from '@/lib/sheets/students';
import { requireRole } from '@/lib/auth/helpers';
import type { ApiError } from '@/lib/auth/helpers';
import { z } from 'zod';

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

const CreateProgressLogSchema = z.object({
  student_id: z.string().min(1),
  log_type: z.enum(['Interview Call', 'Job Task', 'Offer', 'Other']),
  company_name: z.string().min(1).max(200),
  scheduled_date: z.string().min(1),
  scheduled_time: z.string().default(''),
  note: z.string().max(1000).default(''),
});

export async function GET(request: Request) {
  try {
    const user = requireRole(request.headers, ['admin', 'mentor', 'placement']);
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    const logs = studentId
      ? await getProgressLogsByStudent(studentId)
      : await getAllProgressLogs();

    return NextResponse.json({ data: logs, total: logs.length });
  } catch (error: unknown) {
    const status = isApiError(error) ? error.status : 500;
    const message = isApiError(error) ? error.message : 'Internal server error';
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = requireRole(request.headers, ['admin', 'placement', 'mentor']);
    const body = await request.json();
    const result = CreateProgressLogSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const student = await getStudentById(result.data.student_id);
    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    const log = await createProgressLog({
      student_id: result.data.student_id,
      student_name: student.name,
      student_email: student.mentor_email,
      log_type: result.data.log_type,
      company_name: result.data.company_name,
      scheduled_date: result.data.scheduled_date,
      scheduled_time: result.data.scheduled_time,
      note: result.data.note,
      logged_by: user.email,
    });

    return NextResponse.json({ data: log }, { status: 201 });
  } catch (error: unknown) {
    const status = isApiError(error) ? error.status : 500;
    const message = isApiError(error) ? error.message : 'Internal server error';
    return NextResponse.json({ message }, { status });
  }
}
