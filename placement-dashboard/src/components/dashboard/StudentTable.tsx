'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Student } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StudentDetailDialog } from './StudentDetailDialog';

const stageColors: Record<string, string> = {
  learning: 'bg-slate-100 text-slate-700',
  applying: 'bg-blue-100 text-blue-700',
  interviewing: 'bg-amber-100 text-amber-700',
  offer_pending: 'bg-orange-100 text-orange-700',
  placed: 'bg-emerald-100 text-emerald-700',
};

interface StudentTableProps {
  filters: Record<string, string>;
}

export function StudentTable({ filters }: StudentTableProps) {
  const [page, setPage] = useState(1);
  const limit = 20;
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters,
  });

  const { data, isLoading, error } = useQuery({
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

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Mentor</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-red-500">
                  Error loading students
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              students.map((student: Student) => (
                <TableRow
                  key={student.id}
                  className={student.risk_status === 'at_risk' ? 'bg-red-50' : ''}
                >
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.batch}</TableCell>
                  <TableCell className="text-muted-foreground">{student.mentor_email}</TableCell>
                  <TableCell>
                    <Badge className={stageColors[student.stage]} variant="secondary">
                      {student.stage.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.risk_status === 'at_risk' ? 'destructive' : 'default'} className={student.risk_status === 'safe' ? 'bg-emerald-100 text-emerald-700' : ''}>
                      {student.risk_status === 'at_risk' ? 'At Risk' : 'Safe'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.last_activity_date
                      ? formatDistanceToNow(new Date(student.last_activity_date), { addSuffix: true })
                      : 'No activity'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(student)}>
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

      <StudentDetailDialog student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </>
  );
}