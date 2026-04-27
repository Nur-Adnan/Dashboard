'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Student } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface RiskTableProps {
  students: Student[];
  maxRows?: number;
}

export function RiskTable({ students, maxRows = 5 }: RiskTableProps) {
  const displayStudents = students.slice(0, maxRows);

  return (
    <div className="rounded-xl border border-border/50 bg-background overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold text-slate-600">Name</TableHead>
            <TableHead className="font-semibold text-slate-600">Batch</TableHead>
            <TableHead className="font-semibold text-slate-600">Mentor</TableHead>
            <TableHead className="font-semibold text-slate-600">Risk Reasons</TableHead>
            <TableHead className="font-semibold text-slate-600">Last Activity</TableHead>
            <TableHead className="text-right font-semibold text-slate-600">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayStudents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-10 h-32">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600 text-xl">🎉</span>
                  </div>
                  <p>No at-risk students right now!</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            displayStudents.map((student) => (
              <TableRow key={student.id} className="group hover:bg-destructive/5 transition-colors">
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell><span className="text-sm text-muted-foreground">{student.batch}</span></TableCell>
                <TableCell className="text-muted-foreground">{student.mentor_email}</TableCell>
                <TableCell>
                  {student.risk_reasons ? (
                    <div className="flex flex-wrap gap-1.5">
                      {student.risk_reasons.split(',').map((reason, i) => (
                        <Badge key={i} variant="destructive" className="text-[10px] font-medium shadow-none bg-destructive/10 text-destructive hover:bg-destructive/20 border-0 rounded-md">
                          {reason.trim()}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-[10px] rounded-md shadow-none text-muted-foreground">No specific reason</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {student.last_activity_date
                    ? formatDistanceToNow(new Date(student.last_activity_date), { addSuffix: true })
                    : 'No activity'}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/students/${student.id}`} className="text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors">
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}