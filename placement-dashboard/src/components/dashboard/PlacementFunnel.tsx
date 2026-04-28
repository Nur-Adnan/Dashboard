'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { PlacementStats } from '@/types';

interface PlacementFunnelProps {
  stats: PlacementStats;
}

const chartConfig = {
  learning:      { label: 'Learning',      color: 'hsl(220 14% 70%)' },
  applying:      { label: 'Applying',      color: 'hsl(217 91% 65%)' },
  interviewing:  { label: 'Interviewing',  color: 'hsl(38 92% 55%)' },
  offer_pending: { label: 'Offer Pending', color: 'hsl(25 95% 55%)' },
  placed:        { label: 'Placed',        color: 'hsl(142 71% 45%)' },
  hired:         { label: 'Hired',         color: 'hsl(142 76% 32%)' },
};

export function PlacementFunnel({ stats }: PlacementFunnelProps) {
  const data = [
    { stage: chartConfig.learning.label,      count: stats.learning,      fill: chartConfig.learning.color },
    { stage: chartConfig.applying.label,      count: stats.applying,      fill: chartConfig.applying.color },
    { stage: chartConfig.interviewing.label,  count: stats.interviewing,  fill: chartConfig.interviewing.color },
    { stage: chartConfig.offer_pending.label, count: stats.offer_pending, fill: chartConfig.offer_pending.color },
    { stage: chartConfig.placed.label,        count: stats.placed,        fill: chartConfig.placed.color },
    { stage: chartConfig.hired.label,         count: stats.hired,         fill: chartConfig.hired.color },
  ];

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="h-[300px] w-full mt-2">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
        >
          <XAxis type="number" domain={[0, maxCount]} hide />
          <YAxis
            dataKey="stage"
            type="category"
            tickLine={false}
            axisLine={false}
            width={96}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <ChartTooltip
            cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24} minPointSize={2}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              style={{ fontSize: 12, fontWeight: 600, fill: 'hsl(var(--foreground))' }}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
