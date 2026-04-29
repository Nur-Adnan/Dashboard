'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Student } from '@/types';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StudentDetailDialog } from './StudentDetailDialog';
import { cn } from '@/lib/utils';

// ── Stage ──────────────────────────────────────────────────────────────────
const STAGE_STYLES: Record<string, string> = {
  learning:      'bg-slate-100 text-slate-600 border-slate-200',
  applying:      'bg-blue-50 text-blue-700 border-blue-200',
  interviewing:  'bg-violet-50 text-violet-700 border-violet-200',
  offer_pending: 'bg-amber-50 text-amber-700 border-amber-200',
  placed:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  hired:         'bg-green-50 text-green-700 border-green-200',
};

const STAGE_LABELS: Record<string, string> = {
  learning: 'Learning', applying: 'Applying', interviewing: 'Interviewing',
  offer_pending: 'Offer Pending', placed: 'Placed', hired: 'Hired',
};

// ── Job Focus ──────────────────────────────────────────────────────────────
const JOB_FOCUS_STYLES: Record<string, string> = {
  remote: 'bg-sky-50 text-sky-700 border-sky-200',
  onsite: 'bg-orange-50 text-orange-700 border-orange-200',
  hybrid: 'bg-purple-50 text-purple-700 border-purple-200',
};

interface StudentTableProps {
  filters: Record<string, string>;
}

export function StudentTable({ filters }: StudentTableProps) {
  const [page, setPage] = useState(1);
  const limit = 20;
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => { setPage(1); }, [filters]);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['students', filters, page],
    queryFn: async () => {
      const res = await fetch(`/api/students?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const students: Student[] = data?.data || [];
  const total: number = data?.total || 0;
  const totalPages: number = data?.pages || 1;

  return (
    <>
      <div className="rounded-xl border border-border/50 bg-background overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3 pl-4">Name</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Batch</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Mentor</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Stage</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Risk</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Focus</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Experience</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Status</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Last Active</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3 pr-4 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="py-16 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={10} className="py-12 text-center text-sm text-destructive">
                  Failed to load students
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-12 text-center text-sm text-muted-foreground">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow
                  key={student.id}
                  className={cn(
                    'border-b border-border/40 transition-colors',
                    student.terminated
                      ? 'bg-red-100 hover:bg-red-200 border-l-4 border-l-red-500'
                      : student.hired
                        ? 'bg-green-100 hover:bg-green-200 border-l-4 border-l-green-600'
                        : 'hover:bg-muted/30',
                  )}
                >
                  {/* Name */}
                  <TableCell className="py-3 pl-4">
                    <div className="flex items-center gap-2">
                      {student.terminated && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      )}
                      {student.hired && !student.terminated && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                      )}
                      <span className={cn(
                        'text-sm font-medium',
                        student.terminated ? 'line-through text-muted-foreground' : 'text-foreground',
                      )}>
                        {student.name}
                      </span>
                    </div>
                  </TableCell>

                  {/* Batch */}
                  <TableCell className="py-3">
                    <span className="text-xs text-muted-foreground font-medium">{student.batch}</span>
                  </TableCell>

                  {/* Mentor */}
                  <TableCell className="py-3 max-w-[160px]">
                    <span className="text-xs text-muted-foreground truncate block">{student.mentor_email}</span>
                  </TableCell>

                  {/* Stage */}
                  <TableCell className="py-3">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
                      STAGE_STYLES[student.stage] ?? 'bg-slate-100 text-slate-600 border-slate-200',
                    )}>
                      {STAGE_LABELS[student.stage] ?? student.stage}
                    </span>
                  </TableCell>

                  {/* Risk */}
                  <TableCell className="py-3">
                    {student.risk_status === 'at_risk' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-red-50 text-red-600 border-red-200">
                        At Risk
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-emerald-50 text-emerald-600 border-emerald-200">
                        Safe
                      </span>
                    )}
                  </TableCell>

                  {/* Job Focus */}
                  <TableCell className="py-3">
                    {student.job_focus ? (
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize',
                        JOB_FOCUS_STYLES[student.job_focus] ?? '',
                      )}>
                        {student.job_focus}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Experience */}
                  <TableCell className="py-3">
                    {student.experience === 'fresher' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-sky-50 text-sky-700 border-sky-200">
                        Fresher
                      </span>
                    )}
                    {student.experience === 'experienced' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-violet-50 text-violet-700 border-violet-200">
                        Experienced
                      </span>
                    )}
                    {!student.experience && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3">
                    {student.hired && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-600 text-white border border-green-700">
                        ✓ Hired
                      </span>
                    )}
                    {student.terminated && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-600 text-white border border-red-700">
                        ✕ Terminated
                      </span>
                    )}
                    {!student.hired && !student.terminated && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Last Active */}
                  <TableCell className="py-3">
                    <span className="text-xs text-muted-foreground">
                      {student.last_activity_date
                        ? formatDistanceToNow(new Date(student.last_activity_date), { addSuffix: true })
                        : 'No activity'}
                    </span>
                  </TableCell>

                  {/* Action */}
                  <TableCell className="py-3 pr-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-3 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => setSelectedStudent(student)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-xs text-muted-foreground">
            Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <StudentDetailDialog
        student={selectedStudent}
        onClose={() => {
          setSelectedStudent(null);
          refetch();
        }}
      />
    </>
  );
}
