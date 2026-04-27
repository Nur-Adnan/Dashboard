'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { PlacementStats } from '@/types';

interface PlacementFunnelProps {
  stats: PlacementStats;
}

const chartConfig = {
  learning: { label: 'Learning', color: 'hsl(var(--muted-foreground) / 0.4)' },
  applying: { label: 'Applying', color: 'hsl(var(--primary) / 0.6)' },
  interviewing: { label: 'Interviewing', color: 'hsl(var(--primary) / 0.8)' },
  offer_pending: { label: 'Offer Pending', color: 'hsl(var(--primary))' },
  placed: { label: 'Placed', color: 'hsl(142.1 76.2% 36.3%)' },
};

export function PlacementFunnel({ stats }: PlacementFunnelProps) {
  const data = [
    { stage: chartConfig.learning.label, count: stats.learning, fill: chartConfig.learning.color },
    { stage: chartConfig.applying.label, count: stats.applying, fill: chartConfig.applying.color },
    { stage: chartConfig.interviewing.label, count: stats.interviewing, fill: chartConfig.interviewing.color },
    { stage: chartConfig.offer_pending.label, count: stats.offer_pending, fill: chartConfig.offer_pending.color },
    { stage: chartConfig.placed.label, count: stats.placed, fill: chartConfig.placed.color },
  ];

  return (
    <div className="h-[300px] w-full mt-2">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} width={100} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}