'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Loader2, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  present: boolean;
  logged_by: string;
  session_label: string;
}

interface StudentRow {
  id: string;
  name: string;
  batch: string;
}

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  // Fetch all attendance records
  const { data: attData, isLoading: attLoading } = useQuery({
    queryKey: ['attendance-all'],
    queryFn: async () => {
      const res = await fetch('/api/attendance');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ data: AttendanceRecord[] }>;
    },
  });

  // Fetch all students
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      const res = await fetch('/api/students?limit=200');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ student_id, date, present, session_label }: { student_id: string; date: string; present: boolean; session_label: string }) => {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id, date, present, session_label }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-all'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const records: AttendanceRecord[] = attData?.data ?? [];
  const allStudents: StudentRow[] = studentsData?.data ?? [];

  // Unique sorted dates
  const dates = Array.from(new Set(records.map(r => r.date))).sort();

  // Map: student_id → date → record
  const matrix: Record<string, Record<string, AttendanceRecord>> = {};
  records.forEach(r => {
    if (!matrix[r.student_id]) matrix[r.student_id] = {};
    matrix[r.student_id][r.date] = r;
  });

  // Session labels per date
  const sessionLabels: Record<string, string> = {};
  records.forEach(r => { if (r.session_label) sessionLabels[r.date] = r.session_label; });

  const filteredStudents = allStudents.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.batch.toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = attLoading || studentsLoading;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{dates.length} sessions · {allStudents.length} students</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 h-9 text-sm gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" /> Add Session
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9 h-9 text-sm" placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : dates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center border-2 border-dashed border-border/40 rounded-xl">
          <p className="text-sm font-medium text-foreground">No attendance sessions yet</p>
          <p className="text-xs text-muted-foreground">Click "Add Session" to record the first session</p>
        </div>
      ) : (
        <ScrollArea className="w-full rounded-xl border border-border/50 shadow-sm">
          <div className="min-w-max">
            {/* Header */}
            <div
              className="grid bg-violet-700 text-white text-xs font-semibold sticky top-0 z-10"
              style={{ gridTemplateColumns: `200px repeat(${dates.length}, 110px)` }}
            >
              <div className="px-4 py-3 border-r border-violet-600 flex items-center gap-2">
                <span>Student</span>
              </div>
              {dates.map(date => {
                const label = sessionLabels[date];
                let display = date;
                try { display = format(parseISO(date), 'd MMM'); } catch {}
                return (
                  <div key={date} className="px-2 py-2.5 text-center border-r border-violet-600 last:border-r-0">
                    <div className="font-semibold truncate">{label || display}</div>
                    {label && <div className="text-violet-200 text-[10px] font-normal mt-0.5">{display}</div>}
                  </div>
                );
              })}
            </div>

            {/* Rows */}
            {filteredStudents.map((student, rowIdx) => (
              <div
                key={student.id}
                className={cn(
                  'grid border-b border-border/40 last:border-b-0',
                  rowIdx % 2 === 0 ? 'bg-white' : 'bg-muted/20',
                )}
                style={{ gridTemplateColumns: `200px repeat(${dates.length}, 110px)` }}
              >
                {/* Student name cell */}
                <div className="px-4 py-2.5 border-r border-border/40 flex flex-col justify-center">
                  <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                  <p className="text-[11px] text-muted-foreground">{student.batch}</p>
                </div>

                {/* Attendance cells */}
                {dates.map(date => {
                  const rec = matrix[student.id]?.[date];
                  return (
                    <div key={date} className="px-1.5 py-2 border-r border-border/30 last:border-r-0 flex items-center justify-center">
                      {rec ? (
                        <button
                          onClick={() => toggleMutation.mutate({ student_id: student.id, date, present: !rec.present, session_label: rec.session_label })}
                          disabled={toggleMutation.isPending}
                          className={cn(
                            'w-full h-7 rounded-full text-[11px] font-semibold transition-all duration-150 truncate px-2',
                            rec.present
                              ? 'bg-green-200 text-green-800 hover:bg-green-300 border border-green-300'
                              : 'bg-red-200 text-red-800 hover:bg-red-300 border border-red-300',
                          )}
                        >
                          {rec.present ? 'Present' : 'Absent'}
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleMutation.mutate({ student_id: student.id, date, present: true, session_label: sessionLabels[date] || '' })}
                          disabled={toggleMutation.isPending}
                          className="w-full h-7 rounded-full text-[11px] border-2 border-dashed border-border/30 bg-muted/20 text-muted-foreground/40 hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-colors"
                        >
                          —
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Add session dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Attendance Session</DialogTitle></DialogHeader>
          <AddSessionForm
            onSuccess={() => {
              setAddOpen(false);
              queryClient.invalidateQueries({ queryKey: ['attendance-all'] });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddSessionForm({ onSuccess }: { onSuccess: () => void }) {
  const [date, setDate] = useState('');
  const [sessionLabel, setSessionLabel] = useState('');
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
    if (!date) { toast.error('Date is required'); return; }
    setIsLoading(true);
    try {
      const students: { id: string }[] = studentsData?.data ?? [];
      // Mark all students as Present by default for this session
      await Promise.all(students.map(s =>
        fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: s.id, date, present: true, session_label: sessionLabel.trim() }),
        })
      ));
      toast.success(`Session added for ${students.length} students`);
      onSuccess();
    } catch { toast.error('An error occurred'); }
    finally { setIsLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Date</label>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Session label <span className="text-muted-foreground font-normal text-xs">(optional)</span></label>
        <Input placeholder="e.g. Orientation, Javascript" value={sessionLabel} onChange={e => setSessionLabel(e.target.value)} />
      </div>
      <p className="text-xs text-muted-foreground">All students will be marked Present by default. You can toggle individual cells after.</p>
      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Session
      </Button>
    </form>
  );
}
