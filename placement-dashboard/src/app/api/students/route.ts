import { NextResponse } from 'next/server';
import { filterStudents, createStudent } from '@/lib/sheets/students';
import { CreateStudentSchema } from '@/lib/validators/student.schema';
import { requireRole } from '@/lib/auth/helpers';
import type { ApiError } from '@/lib/auth/helpers';
import type { StudentStage, RiskStatus } from '@/types';

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage') as StudentStage | null;
    const risk_status = searchParams.get('risk_status') as RiskStatus | null;
    const batch = searchParams.get('batch');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const user = requireRole(request.headers, ['admin', 'mentor', 'placement']);

    const filters: { stage?: StudentStage; risk_status?: RiskStatus; batch?: string; mentor_email?: string } = {};
    if (stage) filters.stage = stage;
    if (risk_status) filters.risk_status = risk_status;
    if (batch) filters.batch = batch;

    if (user.role === 'mentor') {
      filters.mentor_email = user.email;
    }

    const students = await filterStudents(filters);

    const total = students.length;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = students.slice(start, start + limit);

    return NextResponse.json({ data, total, page, limit, pages });
  } catch (error: unknown) {
    const status = isApiError(error) ? error.status : 500;
    const message = isApiError(error) ? error.message : 'Internal server error';
    return NextResponse.json(
      { message },
      { status }
    );
  }
}

export async function POST(request: Request) {
  try {
    requireRole(request.headers, ['admin']);

    const body = await request.json();
    const result = CreateStudentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const student = await createStudent(result.data);
    return NextResponse.json({ data: student }, { status: 201 });
  } catch (error: unknown) {
    const status = isApiError(error) ? error.status : 500;
    const message = isApiError(error) ? error.message : 'Internal server error';
    return NextResponse.json(
      { message },
      { status }
    );
  }
}