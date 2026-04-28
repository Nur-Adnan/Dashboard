'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Upload, FileSpreadsheet, CheckCircle2, XCircle } from 'lucide-react';
import { StudentFilters } from '@/components/dashboard/StudentFilters';
import { StudentTable } from '@/components/dashboard/StudentTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function StudentsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    const newFilters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
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

  const handleBulkSuccess = () => {
    setIsBulkOpen(false);
    queryClient.invalidateQueries({ queryKey: ['students'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Students</h1>
          <p className="text-muted-foreground">{total} total students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Excel
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      <StudentFilters />
      <StudentTable filters={filters} />

      {/* Single add dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Student</DialogTitle>
          </DialogHeader>
          <AddStudentForm onSuccess={() => setIsAddOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Bulk upload dialog */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Students via Excel</DialogTitle>
          </DialogHeader>
          <BulkUploadForm onSuccess={handleBulkSuccess} />
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
  const [experience, setExperience] = useState('');

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
          ...(experience ? { experience } : {}),
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
        <Select value={jobFocus || undefined} onValueChange={(v) => setJobFocus(v ?? '')}>
          <SelectTrigger>
            <SelectValue placeholder="No Preference" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="onsite">Onsite</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Experience <span className="text-muted-foreground font-normal">(optional)</span></label>
        <Select value={experience || undefined} onValueChange={(v) => setExperience(v ?? '')}>
          <SelectTrigger>
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fresher">Fresher</SelectItem>
            <SelectItem value="experienced">Experienced</SelectItem>
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

interface RowResult {
  row: number;
  name: string;
  success: boolean;
  error?: string;
}

function BulkUploadForm({ onSuccess }: { onSuccess: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<{ created: number; failed: number; results: RowResult[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResults(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/students/bulk', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Upload failed');
        return;
      }

      setResults(data);
      if (data.created > 0) {
        toast.success(`${data.created} student${data.created > 1 ? 's' : ''} added successfully`);
      }
      if (data.failed > 0) {
        toast.warning(`${data.failed} row${data.failed > 1 ? 's' : ''} had errors`);
      }
    } catch {
      toast.error('An error occurred during upload');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDone = () => {
    if (results?.created && results.created > 0) {
      onSuccess();
    } else {
      setFile(null);
      setResults(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-sm space-y-1">
        <p className="font-medium">Expected columns:</p>
        <p className="text-muted-foreground font-mono text-xs">
          name · batch · mentor_email · job_focus (optional)
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          Supports <span className="font-medium">.xlsx</span>, <span className="font-medium">.xls</span>, <span className="font-medium">.csv</span> — max 200 rows
        </p>
      </div>

      {/* File picker */}
      {!results && (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/30',
          )}
          onClick={() => inputRef.current?.click()}
        >
          <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
          {file ? (
            <p className="text-sm font-medium">{file.name}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Click to select a file</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-3">
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              {results.created} created
            </span>
            {results.failed > 0 && (
              <span className="flex items-center gap-1 text-destructive font-medium">
                <XCircle className="h-4 w-4" />
                {results.failed} failed
              </span>
            )}
          </div>

          {results.failed > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border text-xs divide-y divide-border">
              {results.results
                .filter((r) => !r.success)
                .map((r) => (
                  <div key={r.row} className="flex items-start gap-2 px-3 py-2">
                    <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                    <span>
                      <span className="font-medium">Row {r.row} — {r.name}:</span>{' '}
                      <span className="text-muted-foreground">{r.error}</span>
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {!results ? (
          <Button
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            disabled={!file || isLoading}
            onClick={handleUpload}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload
          </Button>
        ) : (
          <Button className="flex-1" onClick={handleDone}>
            {results.created > 0 ? 'Done' : 'Try Again'}
          </Button>
        )}
      </div>
    </div>
  );
}
