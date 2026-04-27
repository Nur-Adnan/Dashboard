'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle } from 'lucide-react';
import { TeamUpdateFormSchema } from '@/lib/validators/update.schema';
import type { TeamUpdateFormInput } from '@/lib/validators/update.schema';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UpdateSubmitFormProps {
  onSubmitted: () => void;
}

export function UpdateSubmitForm({ onSubmitted }: UpdateSubmitFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<TeamUpdateFormInput>({
    resolver: zodResolver(TeamUpdateFormSchema),
    defaultValues: {
      goals: '',
      achievements: '',
      blockers: '',
    },
  });

  const goalsValue = watch('goals', '') || '';
  const achievementsValue = watch('achievements', '') || '';
  const blockersValue = watch('blockers', '') || '';

  useEffect(() => {
    const checkSubmission = async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const res = await fetch(`/api/updates?date=${today}`);
      if (res.ok) {
        const data = await res.json();
        const myUpdate = data.data?.find((u: any) => u.submitted_by === user?.email);
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

      if (!res.ok) {
        toast.error(result.message || 'Failed to submit');
        return;
      }

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

  if (hasSubmitted && submittedData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <CardTitle>Submitted Today</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(submittedData.submitted_at), 'h:mm a')}
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Update</CardTitle>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Goals</label>
              <span className="text-xs text-muted-foreground">{goalsValue.length}/500</span>
            </div>
            <Textarea
              {...register('goals')}
              placeholder="What do you plan to accomplish today?"
              rows={3}
            />
            {errors.goals && <p className="text-xs text-red-500">{errors.goals.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Achievements</label>
              <span className="text-xs text-muted-foreground">{achievementsValue.length}/500</span>
            </div>
            <Textarea
              {...register('achievements')}
              placeholder="What did you accomplish yesterday?"
              rows={3}
            />
            {errors.achievements && <p className="text-xs text-red-500">{errors.achievements.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Blockers (optional)</label>
              <span className="text-xs text-muted-foreground">{blockersValue.length}/500</span>
            </div>
            <Textarea
              {...register('blockers')}
              placeholder="Any blockers or challenges?"
              rows={2}
            />
            {errors.blockers && <p className="text-xs text-red-500">{errors.blockers.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Update
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}