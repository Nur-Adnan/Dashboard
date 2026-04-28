'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Loader2, Plus, Trash2, CalendarDays, Clock, Building2, Search } from 'lucide-react';
import { ProgressLog, ProgressLogType } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LOG_TYPE_STYLES: Record<ProgressLogType, string> = {
  'Interview Call': 'bg-blue-50 text-blue-700 border-blue-200',
  'Job Task':       'bg-amber-50 text-amber-700 border-amber-200',
  'Offer':          'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Other':          'bg-slate-50 text-slate-600 border-slate-200',
};

export default function ProgressLogsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['progress-logs-all'],
    queryFn: async () => {
      const res = await fetch('/api/progress-logs');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<{ data: ProgressLog[]; total: number }>;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/progress-logs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-logs-all'] });
      toast.success('Log deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const logs = (data?.data ?? []).filter(log => {
    const matchSearch = !search || log.student_name.toLowerCase().includes(search.toLowerCase()) || log.company_name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || log.log_type === typeFilter;
    return matchSearch && matchType;
  });

  // Group by same logged_at minute for green highlight
  const minuteCount: Record<string, number> = {};
  logs.forEach(l => {
    const m = l.logged_at.slice(0, 16);
    minuteCount[m] = (minuteCount[m] || 0) + 1;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Progress Logs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{data?.total ?? 0} total entries</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 h-9 text-sm gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" /> Add Log
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-9 text-sm" placeholder="Search by student or company…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="Interview Call">Interview Call</SelectItem>
            <SelectItem value="Job Task">Job Task</SelectItem>
            <SelectItem value="Offer">Offer</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-background overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3 pl-4">Timestamp</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Student</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Type</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Company</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Date</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-3">Time</TableHead>
              <TableHead className="py-3 pr-4 w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="py-16 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No logs found</TableCell></TableRow>
            ) : logs.map(log => {
              const isGrouped = minuteCount[log.logged_at.slice(0, 16)] > 1;
              return (
                <TableRow key={log.id} className={cn('border-b border-border/40 group transition-colors', isGrouped ? 'bg-green-50/60 hover:bg-green-50' : 'hover:bg-muted/30')}>
                  <TableCell className="py-3 pl-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {format(parseISO(log.logged_at), 'M/d/yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-sm font-medium text-foreground">{log.student_name}</p>
                    <p className="text-xs text-muted-foreground">{log.student_email}</p>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border', LOG_TYPE_STYLES[log.log_type])}>
                      {log.log_type}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-sm font-medium">{log.company_name}</TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {log.scheduled_date ? (() => { try { return format(parseISO(log.scheduled_date), 'M/d/yyyy'); } catch { return log.scheduled_date; } })() : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {log.scheduled_time || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 pr-4">
                    <button onClick={() => deleteMutation.mutate(log.id)} disabled={deleteMutation.isPending} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Add log dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Progress Log</DialogTitle></DialogHeader>
          <AddLogForm onSuccess={() => { setAddOpen(false); queryClient.invalidateQueries({ queryKey: ['progress-logs-all'] }); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddLogForm({ onSuccess }: { onSuccess: () => void }) {
  const [studentId, setStudentId] = useState('');
  const [logType, setLogType] = useState<ProgressLogType>('Interview Call');
  const [company, setCompany] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: studentsData } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      const res = await fetch('/api/students?limit=200');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !company || !date) { toast.error('Student, company and date are required'); return; }
    setIsLoading(true);
    try {
      const res = await fetch('/api/progress-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, log_type: logType, company_name: company, scheduled_date: date, scheduled_time: time, note }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.message || 'Failed'); return; }
      toast.success('Log added');
      onSuccess();
    } catch { toast.error('An error occurred'); }
    finally { setIsLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Student</label>
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
          <SelectContent>
            {(studentsData?.data ?? []).map((s: { id: string; name: string }) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Type</label>
          <Select value={logType} onValueChange={v => setLogType(v as ProgressLogType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Interview Call">Interview Call</SelectItem>
              <SelectItem value="Job Task">Job Task</SelectItem>
              <SelectItem value="Offer">Offer</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Company</label>
          <div className="relative">
            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Company name" value={company} onChange={e => setCompany(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Date</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Time <span className="text-muted-foreground font-normal text-xs">(optional)</span></label>
          <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Note <span className="text-muted-foreground font-normal text-xs">(optional)</span></label>
        <Input placeholder="Any notes…" value={note} onChange={e => setNote(e.target.value)} />
      </div>
      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
      </Button>
    </form>
  );
}
