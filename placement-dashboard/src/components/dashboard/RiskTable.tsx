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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Mentor</TableHead>
            <TableHead>Risk Reasons</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayStudents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No at-risk students
              </TableCell>
            </TableRow>
          ) : (
            displayStudents.map((student) => (
              <TableRow key={student.id} className="bg-red-50">
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.batch}</TableCell>
                <TableCell className="text-muted-foreground">{student.mentor_email}</TableCell>
                <TableCell>
                  {student.risk_reasons ? (
                    <div className="flex flex-wrap gap-1">
                      {student.risk_reasons.split(',').map((reason, i) => (
                        <Badge key={i} variant="destructive" className="text-xs">
                          {reason.trim()}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="outline">No specific reason</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {student.last_activity_date
                    ? formatDistanceToNow(new Date(student.last_activity_date), { addSuffix: true })
                    : 'No activity'}
                </TableCell>
                <TableCell>
                  <Link href={`/students/${student.id}`} className="text-sm text-indigo-600 hover:underline">
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