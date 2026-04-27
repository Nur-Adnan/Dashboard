'use client';

import { useQuery } from '@tanstack/react-query';
import { KanbanBoard } from '@/components/dashboard/KanbanBoard';
import { useAuth } from '@/lib/hooks/useAuth';

export default function PlacementPage() {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'mentor';

  const { data: stats } = useQuery({
    queryKey: ['placement-stats'],
    queryFn: async () => {
      const res = await fetch('/api/placement');
      if (!res.ok) return null;
      return res.json();
    },
  });

  const stageLabels = [
    { key: 'learning', label: 'Learning', color: 'bg-slate-500' },
    { key: 'applying', label: 'Applying', color: 'bg-blue-500' },
    { key: 'interviewing', label: 'Interviewing', color: 'bg-amber-500' },
    { key: 'offer_pending', label: 'Offer Pending', color: 'bg-orange-500' },
    { key: 'placed', label: 'Placed', color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Placement Pipeline</h1>
          <p className="text-muted-foreground">Drag students between stages to update their status</p>
        </div>
        {isReadOnly && (
          <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded">
            View Only (Mentor)
          </span>
        )}
      </div>

      {stats && (
        <div className="flex flex-wrap gap-2">
          {stageLabels.map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-2 bg-white border rounded-full px-4 py-2">
              <span className={`w-3 h-3 rounded-full ${color}`} />
              <span className="text-sm font-medium">{label}</span>
              <span className="text-sm text-muted-foreground">({(stats as any)[key] || 0})</span>
            </div>
          ))}
        </div>
      )}

      <KanbanBoard readOnly={isReadOnly} />
    </div>
  );
}