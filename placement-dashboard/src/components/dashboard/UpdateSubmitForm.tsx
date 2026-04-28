'use client';

import { useState, useEffect } from 'react';
import { useForm, useController } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle, Pencil, Trash2, X } from 'lucide-react';
import { TeamUpdateFormSchema } from '@/lib/validators/update.schema';
import type { TeamUpdateFormInput } from '@/lib/validators/update.schema';
import type { TeamUpdate } from '@/types';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UpdateSubmitFormProps {
  onSubmitted: () => void;
}

export function UpdateSubmitForm({ onSubmitted }: UpdateSubmitFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<TeamUpdate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { handleSubmit, formState: { errors }, control, reset } = useForm<TeamUpdateFormInput>({
    resolver: zodResolver(TeamUpdateFormSchema),
    defaultValues: { goals: '', achievements: '', blockers: '' },
  });

  const { field: goalsField } = useController({ name: 'goals', control });
  const { field: achievementsField } = useController({ name: 'achievements', control });
  const { field: blockersField } = useController({ name: 'blockers', control });

  const goalsValue = goalsField.value || '';
  const achievementsValue = achievementsField.value || '';
  const blockersValue = blockersField.value || '';

  useEffect(() => {
    const checkSubmission = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const res = await fetch(`/api/updates?date=${today}`);
      if (res.ok) {
        const data = await res.json();
        const myUpdate = data.data?.find((u: TeamUpdate) => u.submitted_by === user?.email);
        if (myUpdate) {
          setHasSubmitted(true);
          setSubmittedData(myUpdate);
        }
      }
    };
    if (user?.email) checkSubmission();
  }, [user]);

  const onSubmit = async (data: TeamUpdateFormInput) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) { toast.error(result.message || 'Failed to submit'); return; }
      toast.success('Update submitted!');
      setHasSubmitted(true);
      setSubmittedData(result.data);
      onSubmitted();
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const onEdit = async (data: TeamUpdateFormInput) => {
    if (!submittedData) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/updates/${submittedData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) { toast.error(result.message || 'Failed to update'); return; }
      toast.success('Update edited!');
      setSubmittedData(result.data);
      setIsEditing(false);
      onSubmitted();
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    if (!submittedData) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/updates/${submittedData.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) { toast.error(result.message || 'Failed to delete'); return; }
      toast.success('Update deleted');
      setHasSubmitted(false);
      setSubmittedData(null);
      setIsEditing(false);
      reset();
      onSubmitted();
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  const startEditing = () => {
    if (!submittedData) return;
    reset({
      goals: submittedData.goals,
      achievements: submittedData.achievements,
      blockers: submittedData.blockers || '',
    });
    setIsEditing(true);
  };

  // ── Submitted view ──────────────────────────────────────────────────────────
  if (hasSubmitted && submittedData && !isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <CardTitle>Submitted Today</CardTitle>
              {submittedData.edited_at && (
                <Badge variant="secondary" className="text-xs">edited</Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={startEditing} title="Edit update">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                disabled={isDeleting}
                className="text-red-500 hover:text-red-600"
                title="Delete update"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(submittedData.submitted_at), 'h:mm a')}
            {submittedData.edited_at && (
              <span className="ml-2 text-xs text-muted-foreground">
                · edited {format(new Date(submittedData.edited_at), 'h:mm a')}
              </span>
            )}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-1">Goals</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{submittedData.goals}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">Achievements</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{submittedData.achievements}</p>
          </div>
          {submittedData.blockers && (
            <div>
              <h4 className="font-medium text-sm mb-1">Blockers</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{submittedData.blockers}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Submit / Edit form ──────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{isEditing ? 'Edit Update' : 'Daily Update'}</CardTitle>
          {isEditing && (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} title="Cancel edit">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(isEditing ? onEdit : onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Goals</label>
              <span className="text-xs text-muted-foreground">{goalsValue.length}/500</span>
            </div>
            <Textarea {...goalsField} placeholder="What do you plan to accomplish today?" rows={3} />
            {errors.goals && <p className="text-xs text-red-500">{errors.goals.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Achievements</label>
              <span className="text-xs text-muted-foreground">{achievementsValue.length}/500</span>
            </div>
            <Textarea {...achievementsField} placeholder="What did you accomplish yesterday?" rows={3} />
            {errors.achievements && <p className="text-xs text-red-500">{errors.achievements.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Blockers (optional)</label>
              <span className="text-xs text-muted-foreground">{blockersValue.length}/500</span>
            </div>
            <Textarea {...blockersField} placeholder="Any blockers or challenges?" rows={2} />
            {errors.blockers && <p className="text-xs text-red-500">{errors.blockers.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Submit Update'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
