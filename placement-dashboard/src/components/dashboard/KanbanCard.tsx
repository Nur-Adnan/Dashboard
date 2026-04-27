'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Student } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

interface KanbanCardProps {
  student: Student;
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
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
      <Card className="cursor-grab hover:shadow-md transition-shadow mb-2">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(student.name)}`}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{student.name}</p>
              <p className="text-xs text-muted-foreground">{student.batch}</p>
              <span className="inline-block mt-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {daysInStage} days in stage
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}