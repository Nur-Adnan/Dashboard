'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Loader2, Plus, CalendarDays, CheckCircle2, XCircle } from 'lucide-react';
import { Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────
interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  present: boolean;
  logged_by: string;
  session_label: string;
}

interface AttendanceTabProps {
  student: Student;
}

// ── Pill component ─────────────────────────────────────────────────────────
function AttendancePill({
  present,
  label,
  onClick,
  disabled,
}: {
  present: boolean | null;
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  if (present === null) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'w-full h-7 rounded-full text-[11px] font-medium border-2 border-dashed border-border/40',
          'bg-muted/30 text-muted-foreground/50 hover:border-primary/40 hover:bg-primary/5 transition-colors',
          disabled && 'cursor-default opacity-50',
        )}
      >
        —
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={`Click to mark ${present ? 'Absent' : 'Present'}`}
      className={cn(
        'w-full h-7 rounded-full text-[11px] font-semibold transition-all duration-150',
        'flex items-center justify-center gap-1 truncate px-2',
        present
          ? 'bg-green-200 text-green-800 hover:bg-green-300 border border-green-300'
          : 'bg-red-200 text-red-800 hover:bg-red-300 border border-red-300',
        disabled && 'cursor-default',
      )}
    >
      {present ? (label || 'Present') : (label || 'Absent')}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function AttendanceTab({ student }: AttendanceTabProps) {
  const queryClient = useQueryClient();
  const [showAddSession, setShowAddSession] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', student.id],
    queryFn: async () => {
      const res = await fetch(`/api/attendance?student_id=${student.id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<{ data: AttendanceRecord[]; total: number }>;
    },
  });

  const records = data?.data ?? [];

  // Build unique sorted date columns
  const dates = Array.from(new Set(records.map(r => r.date))).sort();

  // Build a map: date → record
  const byDate = records.reduce<Record<string, AttendanceRecord>>((acc, r) => {
    acc[r.date] = r;
    return acc;
  }, {});

  // Stats
  const presentCount = records.filter(r => r.present).length;
  const absentCount = records.filter(r => !r.present).length;
  const rate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : null;

  const toggleMutation = useMutation({
    mutationFn: async ({ date, present, session_label }: { date: string; present: boolean; session_label: string }) => {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id, date, present, session_label }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', student.id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleToggle = (date: string, currentPresent: boolean, session_label: string) => {
    toggleMutation.mutate({ date, present: !currentPresent, session_label });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Stats row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
          <span className="font-medium text-foreground">{presentCount}</span>
          <span className="text-muted-foreground">Present</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
          <span className="font-medium text-foreground">{absentCount}</span>
          <span className="text-muted-foreground">Absent</span>
        </div>
        {rate !== null && (
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-semibold',
              rate >= 80 ? 'text-green-700 border-green-300 bg-green-50'
                : rate >= 60 ? 'text-amber-700 border-amber-300 bg-amber-50'
                : 'text-red-700 border-red-300 bg-red-50',
            )}
          >
            {rate}% attendance
          </Badge>
        )}
        <div className="ml-auto">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5"
            onClick={() => setShowAddSession(v => !v)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Session
          </Button>
        </div>
      </div>

      {/* Add session form */}
      {showAddSession && (
        <AddSessionForm
          studentId={student.id}
          onSuccess={() => {
            setShowAddSession(false);
            queryClient.invalidateQueries({ queryKey: ['attendance', student.id] });
          }}
          onCancel={() => setShowAddSession(false)}
        />
      )}

      {/* Calendar grid */}
      {dates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No attendance records yet</p>
          <p className="text-xs text-muted-foreground/60">Add a session to start tracking</p>
        </div>
      ) : (
        <ScrollArea className="w-full rounded-lg border border-border/60">
          <div className="min-w-max">
            {/* Header row — date columns */}
            <div
              className="grid bg-violet-700 text-white text-xs font-semibold"
              style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(100px, 1fr))` }}
            >
              {dates.map(date => {
                const rec = byDate[date];
                const label = rec?.session_label || '';
                let display = '';
                try {
                  display = format(parseISO(date), 'd MMM');
                } catch {
                  display = date;
                }
                return (
                  <div key={date} className="px-3 py-2.5 text-center border-r border-violet-600 last:border-r-0">
                    <div className="font-semibold">{label || display}</div>
                    {label && (
                      <div className="text-violet-200 text-[10px] font-normal mt-0.5">{display}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Single student row */}
            <div
              className="grid bg-white"
              style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(100px, 1fr))` }}
            >
              {dates.map(date => {
                const rec = byDate[date];
                return (
                  <div
                    key={date}
                    className="px-2 py-2 border-r border-b border-border/40 last:border-r-0 flex items-center justify-center"
                  >
                    {rec ? (
                      <AttendancePill
                        present={rec.present}
                        label={rec.present ? 'Present' : 'Absent'}
                        onClick={() => handleToggle(date, rec.present, rec.session_label)}
                        disabled={toggleMutation.isPending}
                      />
                    ) : (
                      <AttendancePill present={null} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}

// ── Add session form ───────────────────────────────────────────────────────
function AddSessionForm({
  studentId,
  onSuccess,
  onCancel,
}: {
  studentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState('');
  const [sessionLabel, setSessionLabel] = useState('');
  const [present, setPresent] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) { toast.error('Date is required'); return; }
    setIsLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          date,
          present,
          session_label: sessionLabel.trim(),
        }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.message || 'Failed'); return; }
      toast.success('Attendance recorded');
      onSuccess();
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-violet-200 bg-violet-50/40 p-4 space-y-3"
    >
      <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">New Session</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Date</label>
          <Input type="date" className="h-8 text-xs" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Session label <span className="text-muted-foreground font-normal">(optional)</span></label>
          <Input className="h-8 text-xs" placeholder="e.g. Orientation, Javascript" value={sessionLabel} onChange={e => setSessionLabel(e.target.value)} />
        </div>
      </div>

      {/* Present / Absent toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPresent(true)}
          className={cn(
            'flex-1 h-8 rounded-full text-xs font-semibold border transition-all',
            present
              ? 'bg-green-200 text-green-800 border-green-300'
              : 'bg-muted text-muted-foreground border-border hover:bg-green-50',
          )}
        >
          <CheckCircle2 className="inline w-3.5 h-3.5 mr-1" />
          Present
        </button>
        <button
          type="button"
          onClick={() => setPresent(false)}
          className={cn(
            'flex-1 h-8 rounded-full text-xs font-semibold border transition-all',
            !present
              ? 'bg-red-200 text-red-800 border-red-300'
              : 'bg-muted text-muted-foreground border-border hover:bg-red-50',
          )}
        >
          <XCircle className="inline w-3.5 h-3.5 mr-1" />
          Absent
        </button>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="bg-violet-600 hover:bg-violet-700 h-8 text-xs" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
