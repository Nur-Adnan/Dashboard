import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  color: 'indigo' | 'red' | 'emerald' | 'amber' | 'blue';
}

const colorMap: Record<StatsCardProps['color'], {
  border: string;
  iconBg: string;
  iconText: string;
  valuText: string;
  subtitleDot: string;
}> = {
  indigo: {
    border:      'border-t-primary',
    iconBg:      'bg-primary/10',
    iconText:    'text-primary',
    valuText:    'text-primary',
    subtitleDot: 'bg-primary/40',
  },
  red: {
    border:      'border-t-red-500',
    iconBg:      'bg-red-50',
    iconText:    'text-red-500',
    valuText:    'text-red-600',
    subtitleDot: 'bg-red-300',
  },
  emerald: {
    border:      'border-t-emerald-500',
    iconBg:      'bg-emerald-50',
    iconText:    'text-emerald-600',
    valuText:    'text-emerald-700',
    subtitleDot: 'bg-emerald-300',
  },
  amber: {
    border:      'border-t-amber-500',
    iconBg:      'bg-amber-50',
    iconText:    'text-amber-600',
    valuText:    'text-amber-700',
    subtitleDot: 'bg-amber-300',
  },
  blue: {
    border:      'border-t-blue-500',
    iconBg:      'bg-blue-50',
    iconText:    'text-blue-600',
    valuText:    'text-blue-700',
    subtitleDot: 'bg-blue-300',
  },
};

export function StatsCard({ title, value, subtitle, icon: Icon, color }: StatsCardProps) {
  const c = colorMap[color];

  return (
    <div className={cn(
      'relative flex flex-col gap-4 rounded-xl border border-border/60 bg-card px-5 py-5',
      'border-t-4 shadow-sm hover:shadow-md transition-all duration-200 group overflow-hidden',
      c.border,
    )}>
      {/* Faint background icon watermark */}
      <div className={cn(
        'absolute -right-3 -bottom-3 opacity-[0.06] transition-opacity duration-200 group-hover:opacity-[0.10]',
      )}>
        <Icon className="w-24 h-24" />
      </div>

      {/* Top row: title + icon */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
          {title}
        </p>
        <div className={cn('p-2.5 rounded-xl', c.iconBg)}>
          <Icon className={cn('w-5 h-5', c.iconText)} />
        </div>
      </div>

      {/* Value */}
      <div>
        <p className={cn('text-4xl font-bold leading-none tracking-tight', c.valuText)}>
          {value}
        </p>
        {subtitle && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', c.subtitleDot)} />
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        )}
      </div>
    </div>
  );
}
