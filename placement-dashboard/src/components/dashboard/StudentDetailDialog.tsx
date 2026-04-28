'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Student, StudentStage, JobFocus, ExperienceLevel } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
            {student.hired && (
              <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">
                Hired
              </Badge>
            )}
            {student.terminated && (
              <Badge variant="destructive" className="text-xs opacity-80">
                Terminated
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Core info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Batch</p>
              <p>{student.batch}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Mentor</p>
              <p className="text-sm">{student.mentor_email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Stage</p>
              <Badge className="mt-1" {...getStageBadgeProps(student.stage)}>
                {student.stage.replace('_', ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Risk Status</p>
              <Badge variant={student.risk_status === 'at_risk' ? 'destructive' : 'outline'} className="mt-1">
                {student.risk_status === 'at_risk' ? 'At Risk' : 'Safe'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Job Focus</p>
              {student.job_focus ? (
                <Badge variant="outline" className="mt-1 capitalize">
                  {student.job_focus}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Not set</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Experience</p>
              {student.experience === 'fresher' && (
                <Badge variant="outline" className="mt-1 text-sky-600 border-sky-300 bg-sky-50">Fresher</Badge>
              )}
              {student.experience === 'experienced' && (
                <Badge variant="outline" className="mt-1 text-violet-600 border-violet-300 bg-violet-50">Experienced</Badge>
              )}
              {!student.experience && (
                <p className="text-sm text-muted-foreground mt-1">Not set</p>
              )}
            </div>
          </div>

          {/* Risk reasons */}
          {student.risk_reasons && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Risk Reasons</p>
              <div className="flex flex-wrap gap-1">
                {student.risk_reasons.split(',').map((reason, i) => (
                  <Badge key={i} variant="destructive" className="text-xs">
                    {reason.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">{format(new Date(student.created_at), 'PPpp')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm">{format(new Date(student.updated_at), 'PPpp')}</p>
            </div>
          </div>

          {/* Actions — hidden for terminated students */}
          {!student.terminated && (
            <div className="space-y-3 pt-4 border-t border-border/50">
              {/* Stage update */}
              <div className="flex items-center gap-2">
                <Select value={newStage} onValueChange={(v) => setNewStage(v as StudentStage)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Change Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="learning">Learning</SelectItem>
                    <SelectItem value="applying">Applying</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="offer_pending">Offer Pending</SelectItem>
                    <SelectItem value="placed">Placed</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleUpdateStage}
                  disabled={isUpdatingStage || newStage === student.stage}
                  size="sm"
                >
                  {isUpdatingStage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Stage
                </Button>
              </div>

              {/* Job focus update */}
              <div className="flex items-center gap-2">
                <Select value={newJobFocus || 'none'} onValueChange={(v) => setNewJobFocus(v === 'none' ? '' : v as JobFocus)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Set Job Focus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Preference</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleUpdateJobFocus}
                  disabled={isUpdatingJobFocus || newJobFocus === student.job_focus}
                  size="sm"
                  variant="outline"
                >
                  {isUpdatingJobFocus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Focus
                </Button>
              </div>

              {/* Experience update */}
              <div className="flex items-center gap-2">
                <Select value={newExperience || undefined} onValueChange={(v) => setNewExperience(v as ExperienceLevel)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Set Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fresher">Fresher</SelectItem>
                    <SelectItem value="experienced">Experienced</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleUpdateExperience}
                  disabled={isUpdatingExperience || newExperience === student.experience}
                  size="sm"
                  variant="outline"
                >
                  {isUpdatingExperience && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </div>

              {/* Mark as hired */}
              {!student.hired && (
                <div className="pt-1">
                  <Button
                    onClick={handleMarkHired}
                    disabled={isMarkingHired}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isMarkingHired && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Mark as Hired
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
