'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Student, StudentStage } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const stageColors: Record<string, string> = {
  learning: 'bg-slate-100 text-slate-700',
  applying: 'bg-blue-100 text-blue-700',
  interviewing: 'bg-amber-100 text-amber-700',
  offer_pending: 'bg-orange-100 text-orange-700',
  placed: 'bg-emerald-100 text-emerald-700',
};

interface StudentDetailDialogProps {
  student: Student | null;
  onClose: () => void;
}

export function StudentDetailDialog({ student, onClose }: StudentDetailDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStage, setNewStage] = useState<StudentStage>(student?.stage || 'learning');

  if (!student) return null;

  const handleUpdateStage = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || 'Failed to update');
        return;
      }

      toast.success('Stage updated');
      onClose();
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={!!student} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{student.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
              <Badge className={`mt-1 ${stageColors[student.stage]}`} variant="secondary">
                {student.stage.replace('_', ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Risk Status</p>
              <Badge variant={student.risk_status === 'at_risk' ? 'destructive' : 'default'} className="mt-1">
                {student.risk_status === 'at_risk' ? 'At Risk' : 'Safe'}
              </Badge>
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">{format(new Date(student.created_at), 'PPpp')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm">{format(new Date(student.updated_at), 'PPpp')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t">
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
            <Button onClick={handleUpdateStage} disabled={isUpdating || newStage === student.stage}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}