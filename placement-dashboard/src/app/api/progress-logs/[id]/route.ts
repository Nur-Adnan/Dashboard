import { NextResponse } from 'next/server';
import { deleteProgressLog } from '@/lib/sheets/progress-logs';
import { requireRole } from '@/lib/auth/helpers';
import type { ApiError } from '@/lib/auth/helpers';

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireRole(request.headers, ['admin', 'placement', 'mentor']);
    const { id } = await params;

    await deleteProgressLog(id, user.email, user.role === 'admin');

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error: unknown) {
    const status = isApiError(error) ? error.status : 500;
    const message = isApiError(error) ? error.message : 'Internal server error';
    return NextResponse.json({ message }, { status });
  }
}
