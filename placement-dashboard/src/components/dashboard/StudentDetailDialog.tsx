'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Student, StudentStage, JobFocus, ExperienceLevel } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const getStageBadgeProps = (stage: string): { variant: "default" | "secondary" | "destructive" | "outline", className?: string } => {
  switch (stage) {
    case 'learning': return { variant: 'outline' };
    case 'applying': return { variant: 'secondary' };
    case 'interviewing': return { variant: 'default' };
    case 'offer_pending': return { variant: 'default' };
    case 'placed': return { variant: 'outline', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    case 'hired': return { variant: 'outline', className: 'bg-green-500/10 text-green-700 border-green-500/20' };
    default: return { variant: 'outline' };
  }
};

interface StudentDetailDialogProps {
  student: Student | null;
  onClose: () => void;
}

export function StudentDetailDialog({ student, onClose }: StudentDetailDialogProps) {
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isUpdatingJobFocus, setIsUpdatingJobFocus] = useState(false);
  const [isUpdatingExperience, setIsUpdatingExperience] = useState(false);
  const [isMarkingHired, setIsMarkingHired] = useState(false);
  const [newStage, setNewStage] = useState<StudentStage>(student?.stage || 'learning');
  const [newJobFocus, setNewJobFocus] = useState<JobFocus | ''>(student?.job_focus || '');
  const [newExperience, setNewExperience] = useState<ExperienceLevel | ''>(student?.experience || '');

  if (!student) return null;

  const patch = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/students/${student.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to update');
    }
    return res.json();
  };

  const handleUpdateStage = async () => {
    setIsUpdatingStage(true);
    try {
      await patch({ stage: newStage });
      toast.success('Stage updated');
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleUpdateJobFocus = async () => {
    setIsUpdatingJobFocus(true);
    try {
      await patch({ job_focus: newJobFocus });
      toast.success('Job focus updated');
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUpdatingJobFocus(false);
    }
  };

  const handleUpdateExperience = async () => {
    setIsUpdatingExperience(true);
    try {
      await patch({ experience: newExperience });
      toast.success('Experience updated');
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUpdatingExperience(false);
    }
  };

  const handleMarkHired = async () => {
    setIsMarkingHired(true);
    try {
      await patch({ hired: true, stage: 'hired' });
      toast.success(`${student.name} marked as hired`);
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsMarkingHired(false);
    }
  };

  return (
    <Dialog open={!!student} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {student.name}
            {student.hired && <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">Hired</Badge>}
            {student.terminated && <Badge variant="destructive" className="text-xs opacity-80">Terminated</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-1">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Batch</p>
              <p className="text-sm font-medium">{student.batch}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Mentor</p>
              <p className="text-sm truncate">{student.mentor_email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Stage</p>
              <Badge {...getStageBadgeProps(student.stage)} className="capitalize">
                {student.stage.replace('_', ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Risk</p>
              <Badge variant={student.risk_status === 'at_risk' ? 'destructive' : 'outline'}>
                {student.risk_status === 'at_risk' ? 'At Risk' : 'Safe'}
              </Badge>
            </div>
            {student.job_focus && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Job Focus</p>
                <Badge variant="outline" className="capitalize">{student.job_focus}</Badge>
              </div>
            )}
            {student.experience && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Experience</p>
                <Badge variant="outline" className={student.experience === 'fresher' ? 'text-sky-600 border-sky-300 bg-sky-50' : 'text-violet-600 border-violet-300 bg-violet-50'}>
                  {student.experience === 'fresher' ? 'Fresher' : 'Experienced'}
                </Badge>
              </div>
            )}
          </div>

          {student.risk_reasons && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Risk Reasons</p>
              <div className="flex flex-wrap gap-1">
                {student.risk_reasons.split(',').map((r, i) => (
                  <Badge key={i} variant="destructive" className="text-xs">{r.trim()}</Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          {!student.terminated && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Select value={newStage} onValueChange={v => setNewStage(v as StudentStage)}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Change Stage" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="learning">Learning</SelectItem>
                    <SelectItem value="applying">Applying</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="offer_pending">Offer Pending</SelectItem>
                    <SelectItem value="placed">Placed</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleUpdateStage} disabled={isUpdatingStage || newStage === student.stage} size="sm" className="shrink-0">
                  {isUpdatingStage && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Save
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Select value={newJobFocus || 'none'} onValueChange={v => setNewJobFocus(v === 'none' ? '' : v as JobFocus)}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Set Job Focus" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Preference</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleUpdateJobFocus} disabled={isUpdatingJobFocus || newJobFocus === student.job_focus} size="sm" variant="outline" className="shrink-0">
                  {isUpdatingJobFocus && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Save
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Select value={newExperience || undefined} onValueChange={v => setNewExperience(v as ExperienceLevel)}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Set Experience" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fresher">Fresher</SelectItem>
                    <SelectItem value="experienced">Experienced</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleUpdateExperience} disabled={isUpdatingExperience || newExperience === student.experience} size="sm" variant="outline" className="shrink-0">
                  {isUpdatingExperience && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Save
                </Button>
              </div>

              {!student.hired && (
                <Button onClick={handleMarkHired} disabled={isMarkingHired} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  {isMarkingHired && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Mark as Hired
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
