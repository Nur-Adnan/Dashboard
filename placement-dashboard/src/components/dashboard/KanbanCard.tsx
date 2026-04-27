'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Student } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface KanbanCardProps {
  student: Student;
}

export function KanbanCard({ student }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: student.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const daysInStage = Math.floor((Date.now() - new Date(student.updated_at).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-grab hover:shadow-md transition-all duration-200 mb-2 border-border/50">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-8 h-8 shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{student.name}</p>
              <p className="text-xs text-muted-foreground">{student.batch}</p>
              <Badge variant="secondary" className="mt-1.5 text-[10px] font-normal shadow-none">
                {daysInStage} days in stage
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}