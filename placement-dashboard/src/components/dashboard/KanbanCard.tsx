'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

type KanbanStudent = {
  id: string;
  name: string;
  batch: string;
  days_in_stage: number;
};

interface KanbanCardProps {
  student: KanbanStudent;
  isOverlay?: boolean;
}

export function KanbanCard({ student, isOverlay = false }: KanbanCardProps) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: student.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const initials = student.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const days = Number.isFinite(student.days_in_stage) ? student.days_in_stage : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group flex items-start gap-2.5 rounded-lg border border-border/60 bg-background p-3',
        'shadow-sm hover:shadow-md transition-all duration-150 select-none',
        isDragging && !isOverlay && 'opacity-40 shadow-none',
        isOverlay && 'shadow-xl rotate-1 scale-105 cursor-grabbing',
        !isOverlay && 'cursor-grab active:cursor-grabbing',
      )}
    >
      {/* Drag handle */}
      <div
        className="mt-0.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Avatar */}
      <Avatar className="w-7 h-7 shrink-0 border shadow-sm">
        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate leading-tight">
          {student.name}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{student.batch}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {days === 0 ? 'Today' : `${days}d in stage`}
        </p>
      </div>
    </div>
  );
}
