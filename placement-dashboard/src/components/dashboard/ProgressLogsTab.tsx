'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Loader2, Plus, Trash2, CalendarDays, Clock, Building2 } from 'lucide-react';
import { Student, ProgressLog, ProgressLogType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LOG_TYPE_STYLES: Record<ProgressLogType, string> = {
  'Interview Call': 'bg-blue-100 text-blue-700 border-blue-300',
  'Job Task': 'bg-amber-100 text-amber-700 border-amber-300',
  'Offer': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'Other': 'bg-slate-100 text-slate-600 border-slate-300',
};

interface ProgressLogsTabProps {
  student: Student;
}

export function ProgressLogsTab({ student }: ProgressLogsTabProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['progress-logs', student.id],
    queryFn: async () => {
      const res = await fetch(`/api/progress-logs?student_id=${student.id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<{ data: ProgressLog[]; total: number }>;
    },
  });

  const logs = data?.data ?? [];

  // Group logs by minute-level timestamp to highlight same-batch entries (like the image)
  const groupedTimestamps = logs.reduce<Record<string, number>>((acc, log, idx) => {
    const minute = log.logged_at.slice(0, 16); // "YYYY-MM-DDTHH:MM"
    if (!(minute in acc)) acc[minute] = idx;
    return acc;
  }, {});

  const isGroupStart = (log: ProgressLog, idx: number) => {
    const minute = log.logged_at.slice(0, 16);
    return groupedTimestamps[minute] === idx;
  };

  const isSameGroup = (log: ProgressLog, prevLog: ProgressLog | undefined) => {
    if (!prevLog) return false;
    return log.logged_at.slice(0, 16) === prevLog.logged_at.slice(0, 16);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/progress-logs/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to delete');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-logs', student.id] });
      toast.success('Log deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
        </p>
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs"
          onClick={() => setShowForm(v => !v)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Log
        </Button>
      </div>

      {showForm && (
        <AddLogForm
          student={student}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['progress-logs', student.id] });
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No progress logs yet
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden text-sm">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-0 bg-violet-700 text-white font-semibold text-xs">
            <div className="px-3 py-2">Timestamp</div>
            <div className="px-3 py-2">I have got</div>
            <div className="px-3 py-2">Company name</div>
            <div className="px-3 py-2">Date</div>
            <div className="px-3 py-2">Time</div>
            <div className="px-3 py-2 w-10" />
          </div>

          {/* Rows */}
          {logs.map((log, idx) => {
            const prev = logs[idx - 1];
            const inGroup = isSameGroup(log, prev);
            const groupStart = isGroupStart(log, idx);

            // Determine if this timestamp group has multiple entries → highlight green
            const minute = log.logged_at.slice(0, 16);
            const groupSize = logs.filter(l => l.logged_at.slice(0, 16) === minute).length;
            const highlight = groupSize > 1;

            return (
              <div
                key={log.id}
                className={cn(
                  'grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-0 border-t border-border/60 items-center group',
                  highlight
                    ? 'bg-green-100 hover:bg-green-200/80'
                    : 'bg-white hover:bg-slate-50',
                  groupStart && inGroup && 'border-t-2 border-t-green-400',
                )}
              >
                <div className="px-3 py-2 text-xs text-slate-600 font-mono whitespace-nowrap">
                  {format(parseISO(log.logged_at), 'M/d/yyyy HH:mm:ss')}
                </div>
                <div className="px-3 py-2">
                  <Badge
                    variant="outline"
                    className={cn('text-xs font-medium', LOG_TYPE_STYLES[log.log_type])}
                  >
                    {log.log_type}
                  </Badge>
                </div>
                <div className="px-3 py-2 font-medium text-slate-800 truncate">
                  {log.company_name}
                </div>
                <div className="px-3 py-2 text-slate-600 flex items-center gap-1">
                  <CalendarDays className="h-3 w-3 shrink-0 text-muted-foreground" />
                  {log.scheduled_date
                    ? (() => {
                        try { return format(parseISO(log.scheduled_date), 'M/d/yyyy'); }
                        catch { return log.scheduled_date; }
                      })()
                    : '—'}
                </div>
                <div className="px-3 py-2 text-slate-600 flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                  {log.scheduled_time || '—'}
                </div>
                <div className="px-2 py-2 w-10 flex justify-center">
                  <button
                    onClick={() => deleteMutation.mutate(log.id)}
                    disabled={deleteMutation.isPending}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    title="Delete log"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddLogForm({
  student,
  onSuccess,
  onCancel,
}: {
  student: Student;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [logType, setLogType] = useState<ProgressLogType>('Interview Call');
  const [company, setCompany] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !date) {
      toast.error('Company name and date are required');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/progress-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          log_type: logType,
          company_name: company.trim(),
          scheduled_date: date,
          scheduled_time: time,
          note: note.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Failed to add log');
        return;
      }
      toast.success('Progress log added');
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
      className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4 space-y-3"
    >
      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">New Log Entry</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Type</label>
          <Select value={logType} onValueChange={v => setLogType(v as ProgressLogType)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Interview Call">Interview Call</SelectItem>
              <SelectItem value="Job Task">Job Task</SelectItem>
              <SelectItem value="Offer">Offer</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Company</label>
          <div className="relative">
            <Building2 className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="h-8 text-xs pl-7"
              placeholder="Company name"
              value={company}
              onChange={e => setCompany(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Date</label>
          <Input
            type="date"
            className="h-8 text-xs"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Time <span className="text-muted-foreground font-normal">(optional)</span></label>
          <Input
            type="time"
            className="h-8 text-xs"
            value={time}
            onChange={e => setTime(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">Note <span className="text-muted-foreground font-normal">(optional)</span></label>
        <Input
          className="h-8 text-xs"
          placeholder="Any additional notes..."
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs" disabled={isLoading}>
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
