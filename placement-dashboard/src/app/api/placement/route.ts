import { NextResponse } from 'next/server';
import { getAllStudents } from '@/lib/sheets/students';
import type { PlacementStats, StudentStage } from '@/types';
import { differenceInDays } from 'date-fns';

export async function GET() {
  try {
    const students = await getAllStudents();
    const now = new Date();

    const stats: PlacementStats = {
      learning: 0,
      applying: 0,
      interviewing: 0,
      offer_pending: 0,
      placed: 0,
    };

    const studentsByStage: Record<StudentStage, { id: string; name: string; batch: string; days_in_stage: number }[]> = {
      learning: [],
      applying: [],
      interviewing: [],
      offer_pending: [],
      placed: [],
    };

    for (const student of students) {
      const daysInStage = differenceInDays(now, new Date(student.updated_at));
      stats[student.stage]++;
      studentsByStage[student.stage].push({
        id: student.id,
        name: student.name,
        batch: student.batch,
        days_in_stage: daysInStage,
      });
    }

    return NextResponse.json({ ...stats, students_by_stage: studentsByStage });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}