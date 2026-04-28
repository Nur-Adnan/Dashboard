import { NextResponse } from 'next/server';
import { editUpdate, deleteUpdate } from '@/lib/sheets/updates';
import { TeamUpdateBodySchema } from '@/lib/validators/update.schema';
import { requireRole } from '@/lib/auth/helpers';
import type { ApiError } from '@/lib/auth/helpers';

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireRole(request.headers, ['admin', 'mentor', 'placement']);
    const { id } = await params;

    const body = await request.json();
    const result = TeamUpdateBodySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.error.issues },
        { status: 400 }
      );
    }

    const updated = await editUpdate(id, user.email, {
      goals: result.data.goals,
      achievements: result.data.achievements,
      blockers: result.data.blockers ?? '',
    });

    return NextResponse.json({ data: updated });
  } catch (error: unknown) {
    const status = isApiError(error) ? error.status : 500;
    const message = isApiError(error) ? error.message : 'Internal server error';
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = requireRole(request.headers, ['admin', 'mentor', 'placement']);
    const { id } = await params;

    await deleteUpdate(id, user.email);

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: unknown) {
    const status = isApiError(error) ? error.status : 500;
    const message = isApiError(error) ? error.message : 'Internal server error';
    return NextResponse.json({ message }, { status });
  }
}
