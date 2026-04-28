'use client';

import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { Student } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StudentDetailDialog } from './StudentDetailDialog';
import { useState } from 'react';

interface RiskTableProps {
  students: Student[];
  maxRows?: number;
}

const RISK_REASON_LABELS: Record<string, { label: string; color: string }> = {
  no_recent_activity:          { label: 'No recent activity',    color: 'bg-orange-50 text-orange-700 border-orange-200' },
  inactive_login_pattern:      { label: 'Inactive login pattern', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  slow_progress:               { label: 'Slow progress',          color: 'bg-red-50 text-red-600 border-red-200' },
  absent_2_consecutive_days:   { label: '2 consecutive absences', color: 'bg-red-50 text-red-600 border-red-200' },
  no_progress_update_7_days:   { label: 'No update in 7 days',    color: 'bg-orange-50 text-orange-700 border-orange-200' },
  no_interview_or_task_7_days: { label: 'No interview/task 7d',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

function getRiskReasonBadge(reason: string) {
  const normalized = reason.trim().toLowerCase().replace(/\s+/g, '_');
  const config = RISK_REASON_LABELS[normalized];
  return config ?? { label: reason.trim(), color: 'bg-slate-50 text-slate-600 border-slate-200' };
}

export function RiskTable({ students, maxRows = 5 }: RiskTableProps) {
  const [selected, setSelected] = useState<Student | null>(null);
  const display = students.slice(0, maxRows);

  if (display.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <span className="text-2xl">🎉</span>
        </div>
        <p className="text-sm font-medium text-foreground">All clear!</p>
        <p className="text-xs text-muted-foreground">No at-risk students right now.</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-border/60">
        {display.map((student) => {
          const reasons = student.risk_reasons
            ? student.risk_reasons.split(',').filter(Boolean)
            : [];

          const lastActivity = student.last_activity_date
            ? formatDistanceToNow(new Date(student.last_activity_date), { addSuffix: true })
            : null;

          return (
            <div
              key={student.id}
              className="flex items-start justify-between gap-4 py-3.5 px-1 group hover:bg-muted/30 rounded-lg transition-colors"
            >
              {/* Left — name + batch */}
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight truncate">
                    {student.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{student.batch}</p>

                  {/* Risk reason badges */}
                  {reasons.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {reasons.map((r, i) => {
                        const { label, color } = getRiskReasonBadge(r);
                        return (
                          <span
                            key={i}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${color}`}
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 mt-1.5 rounded-full text-[10px] font-medium border bg-slate-50 text-slate-500 border-slate-200">
                      No specific reason
                    </span>
                  )}
                </div>
              </div>

              {/* Right — last activity + action */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                {lastActivity && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    {lastActivity}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1"
                  onClick={() => setSelected(student)}
                >
                  View
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <StudentDetailDialog
        student={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
