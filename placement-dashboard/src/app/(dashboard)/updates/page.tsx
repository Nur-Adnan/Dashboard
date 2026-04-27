'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { UpdateSubmitForm } from '@/components/dashboard/UpdateSubmitForm';
import { TeamUpdatesFeed } from '@/components/dashboard/TeamUpdatesFeed';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/hooks/useAuth';

export default function UpdatesPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [refetchKey, setRefetchKey] = useState(0);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['updates', selectedDate, refetchKey],
    queryFn: async () => {
      const res = await fetch(`/api/updates?date=${selectedDate}`);
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 60000,
  });

  const handleSubmitted = () => {
    setRefetchKey(k => k + 1);
    refetch();
  };

  const teamSize = 5;
  const submittedCount = data?.submitted_count || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Updates</h1>
          <p className="text-muted-foreground">
            {submittedCount} of {teamSize} team members submitted today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[160px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <UpdateSubmitForm onSubmitted={handleSubmitted} />
        </div>
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-48 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          ) : (
            <TeamUpdatesFeed
              updates={data?.data || []}
              blockers={data?.blockers || []}
            />
          )}
        </div>
      </div>
    </div>
  );
}