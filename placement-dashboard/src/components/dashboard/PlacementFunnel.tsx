'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PlacementStats } from '@/types';

interface PlacementFunnelProps {
  stats: PlacementStats;
}

const stageColors: Record<string, string> = {
  learning: '#64748b',
  applying: '#3b82f6',
  interviewing: '#f59e0b',
  offer_pending: '#f97316',
  placed: '#10b981',
};

const stageLabels: Record<string, string> = {
  learning: 'Learning',
  applying: 'Applying',
  interviewing: 'Interviewing',
  offer_pending: 'Offer Pending',
  placed: 'Placed',
};

export function PlacementFunnel({ stats }: PlacementFunnelProps) {
  const data = [
    { stage: stageLabels.learning, count: stats.learning, color: stageColors.learning },
    { stage: stageLabels.applying, count: stats.applying, color: stageColors.applying },
    { stage: stageLabels.interviewing, count: stats.interviewing, color: stageColors.interviewing },
    { stage: stageLabels.offer_pending, count: stats.offer_pending, color: stageColors.offer_pending },
    { stage: stageLabels.placed, count: stats.placed, color: stageColors.placed },
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <XAxis type="number" tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="stage" tickLine={false} axisLine={false} width={80} />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}