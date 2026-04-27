import { NextResponse } from 'next/server';
import { updateStudent } from '@/lib/sheets/students';
import { requireRole } from '@/lib/auth/helpers';
import { z } from 'zod';

const StageSchema = z.object({
  stage: z.enum(['learning', 'applying', 'interviewing', 'offer_pending', 'placed']),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    requireRole(request.headers, ['admin', 'placement']);

    const { studentId } = await params;
    const body = await request.json();
    const result = StageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const student = await updateStudent(studentId, {
      stage: result.data.stage,
    });

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ data: student });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}