import { NextResponse } from 'next/server';
import { getUpdatesByDate, hasSubmittedToday, submitUpdate } from '@/lib/sheets/updates';
import { TeamUpdateSchema, TeamUpdateBodySchema } from '@/lib/validators/update.schema';
import { requireRole } from '@/lib/auth/helpers';
import type { ApiError } from '@/lib/auth/helpers';

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

export async function GET(request: Request) {
  try {
    requireRole(request.headers, ['admin', 'placement']);

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const updates = await getUpdatesByDate(date);
    const blockers = updates
      .map(u => u.blockers)
      .filter(b => b && b.trim() !== '');

    return NextResponse.json({
      data: updates,
      submitted_count: updates.length,
      blockers,
    });
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
    const user = requireRole(request.headers, ['admin', 'mentor', 'placement']);

    const hasSubmitted = await hasSubmittedToday(user.email);
    if (hasSubmitted) {
      return NextResponse.json(
        { message: 'You have already submitted an update today' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const result = TeamUpdateBodySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.error.issues },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const update = await submitUpdate({
      ...result.data,
      submitted_by: user.email,
      role: user.role,
      date: today,
    });

    return NextResponse.json({ data: update }, { status: 201 });
  } catch (error: unknown) {
    const status = isApiError(error) ? error.status : 500;
    const message = isApiError(error) ? error.message : 'Internal server error';
    return NextResponse.json(
      { message },
      { status }
    );
  }
}