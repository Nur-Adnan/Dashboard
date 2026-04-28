'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Student } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StudentDetailDialog } from './StudentDetailDialog';

const getStageBadgeProps = (stage: string): { variant: "default" | "secondary" | "destructive" | "outline", className?: string } => {
  switch (stage) {
    case 'learning': return { variant: 'outline' };
    case 'applying': return { variant: 'secondary' };
    case 'interviewing': return { variant: 'default' };
    case 'offer_pending': return { variant: 'default' };
    case 'placed': return { variant: 'outline', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20' };
    case 'hired': return { variant: 'outline', className: 'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20' };
    default: return { variant: 'outline' };
  }
};

const getJobFocusBadgeProps = (focus: string): { variant: "default" | "secondary" | "destructive" | "outline", className?: string } => {
  switch (focus) {
    case 'remote': return { variant: 'outline', className: 'text-blue-600 border-blue-300' };
    case 'onsite': return { variant: 'outline', className: 'text-orange-600 border-orange-300' };
    case 'hybrid': return { variant: 'outline', className: 'text-purple-600 border-purple-300' };
    default: return { variant: 'outline' };
  }
};

interface StudentTableProps {
  filters: Record<string, string>;
}

export function StudentTable({ filters }: StudentTableProps) {
  const [page, setPage] = useState(1);
  const limit = 20;
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

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

  const students = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.pages || 1;

  const getRowClassName = (student: Student) => {
    if (student.terminated) return 'bg-zinc-100 opacity-60 hover:opacity-80';
    if (student.hired) return 'bg-green-50 hover:bg-green-100/70';
    if (student.risk_status === 'at_risk') return 'bg-destructive/5 hover:bg-destructive/10';
    return 'hover:bg-muted/50';
  };

  return (
    <>
      <div className="rounded-xl border border-border/50 bg-background overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-slate-600">Name</TableHead>
              <TableHead className="font-semibold text-slate-600">Batch</TableHead>
              <TableHead className="font-semibold text-slate-600">Mentor</TableHead>
              <TableHead className="font-semibold text-slate-600">Stage</TableHead>
              <TableHead className="font-semibold text-slate-600">Risk</TableHead>
              <TableHead className="font-semibold text-slate-600">Job Focus</TableHead>
              <TableHead className="font-semibold text-slate-600">Status</TableHead>
              <TableHead className="font-semibold text-slate-600">Last Activity</TableHead>
              <TableHead className="font-semibold text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-destructive">
                  Error loading students
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              students.map((student: Student) => (
                <TableRow key={student.id} className={getRowClassName(student)}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{student.batch}</TableCell>
                  <TableCell className="text-muted-foreground">{student.mentor_email}</TableCell>
                  <TableCell>
                    <Badge {...getStageBadgeProps(student.stage)}>
                      {student.stage.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={student.risk_status === 'at_risk' ? 'destructive' : 'outline'}
                      className={student.risk_status === 'safe' ? 'text-muted-foreground' : ''}
                    >
                      {student.risk_status === 'at_risk' ? 'At Risk' : 'Safe'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {student.job_focus ? (
                      <Badge {...getJobFocusBadgeProps(student.job_focus)}>
                        {student.job_focus.charAt(0).toUpperCase() + student.job_focus.slice(1)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {student.hired && (
                        <Badge className="bg-green-500/10 text-green-700 border-green-500/20 w-fit">
                          Hired
                        </Badge>
                      )}
                      {student.terminated && (
                        <Badge variant="destructive" className="opacity-80 w-fit">
                          Terminated
                        </Badge>
                      )}
                      {!student.hired && !student.terminated && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {student.last_activity_date
                      ? formatDistanceToNow(new Date(student.last_activity_date), { addSuffix: true })
                      : 'No activity'}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setSelectedStudent(student)}>
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
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
