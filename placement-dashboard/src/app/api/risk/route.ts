import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/helpers';
import { getAllStudents } from '@/lib/sheets/students';
import { runRiskScan } from '@/lib/risk/engine';
import type { ApiError } from '@/lib/auth/helpers';

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

export async function GET(request: Request) {
  try {
    const user = requireRole(request.headers, ['admin', 'mentor', 'placement']);

    let students = await getAllStudents();
    
    if (user.role === 'mentor') {
      students = students.filter(s => s.mentor_email === user.email);
    }

    const atRiskStudents = students.filter(s => s.risk_status === 'at_risk');

    return NextResponse.json({ data: atRiskStudents, total: atRiskStudents.length });
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

    const result = await runRiskScan();
    return NextResponse.json(result);
  } catch (error: unknown) {
    const status = isApiError(error) ? error.status : 500;
    const message = isApiError(error) ? error.message : 'Internal server error';
    return NextResponse.json(
      { message },
      { status }
    );
  }
}