'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { StudentFilters } from '@/components/dashboard/StudentFilters';
import { StudentTable } from '@/components/dashboard/StudentTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function StudentsPage() {
  const searchParams = useSearchParams();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    const newFilters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      // Skip pagination and any 'all' sentinel values — they mean "no filter"
      if (key === 'page') return;
      if (value === 'all' || value === '') return;
      newFilters[key] = value;
    });
    setFilters(newFilters);
  }, [searchParams]);

  const { data: countData } = useQuery({
    queryKey: ['students', 'count'],
    queryFn: async () => {
      const res = await fetch('/api/students?limit=1');
      if (!res.ok) return { total: 0 };
      return res.json();
    },
  });

  const total = countData?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground">{total} total students</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      <StudentFilters />

      <StudentTable filters={filters} />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
          </DialogHeader>
          <AddStudentForm onSuccess={() => setIsAddOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddStudentForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [batch, setBatch] = useState('');
  const [mentorEmail, setMentorEmail] = useState('');
  const [jobFocus, setJobFocus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !batch || !mentorEmail) {
      toast.error('Name, batch, and mentor email are required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          batch,
          mentor_email: mentorEmail,
          ...(jobFocus ? { job_focus: jobFocus } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Failed to create student');
        return;
      }

      toast.success('Student created');
      onSuccess();
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Batch</label>
        <Input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="Batch 2024" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Mentor Email</label>
        <Input
          type="email"
          value={mentorEmail}
          onChange={(e) => setMentorEmail(e.target.value)}
          placeholder="mentor@example.com"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Job Focus <span className="text-muted-foreground font-normal">(optional)</span></label>
        <Select value={jobFocus || 'none'} onValueChange={(v) => setJobFocus(v === 'none' ? '' : (v ?? ''))}>
          <SelectTrigger>
            <SelectValue placeholder="Select preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Preference</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="onsite">Onsite</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Student
      </Button>
    </form>
  );
}