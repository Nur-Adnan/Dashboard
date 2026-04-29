'use client';

import { useState, useCallback } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
  DragOverlay, closestCorners, PointerSensor, MouseSensor, TouchSensor,
  useSensor, useSensors, useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { StudentStage } from '@/types';
import { KanbanCard } from './KanbanCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────
type KanbanStudent = {
  id: string;
  name: string;
  batch: string;
  days_in_stage: number;
};

type StudentsByStage = Record<StudentStage, KanbanStudent[]>;

// ── Stage config ───────────────────────────────────────────────────────────
const STAGES: { key: StudentStage; label: string; accent: string; badge: string }[] = [
  { key: 'learning',      label: 'Learning',      accent: 'border-t-slate-400',   badge: 'bg-slate-100 text-slate-600' },
  { key: 'applying',      label: 'Applying',      accent: 'border-t-blue-500',    badge: 'bg-blue-50 text-blue-700' },
  { key: 'interviewing',  label: 'Interviewing',  accent: 'border-t-amber-500',   badge: 'bg-amber-50 text-amber-700' },
  { key: 'offer_pending', label: 'Offer Pending', accent: 'border-t-orange-500',  badge: 'bg-orange-50 text-orange-700' },
  { key: 'placed',        label: 'Placed',        accent: 'border-t-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
];

const STAGE_KEYS = STAGES.map(s => s.key);

// ── Droppable column ───────────────────────────────────────────────────────
function DroppableColumn({
  stage, label, accent, badge, students, readOnly, isOver,
}: {
  stage: StudentStage;
  label: string;
  accent: string;
  badge: string;
  students: KanbanStudent[];
  readOnly: boolean;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl border border-border/60 bg-card shadow-sm transition-colors min-h-[520px]',
        'border-t-4',
        accent,
        isOver && 'bg-primary/5 border-primary/30',
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', badge)}>
          {students.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2">
        <SortableContext
          items={students.map(s => s.id)}
          strategy={verticalListSortingStrategy}
          disabled={readOnly}
        >
          <div className="space-y-2 min-h-[400px]">
            {students.length === 0 ? (
              <div className={cn(
                'flex items-center justify-center h-24 rounded-lg border-2 border-dashed text-xs text-muted-foreground transition-colors',
                isOver ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border/40',
              )}>
                {isOver ? 'Drop here' : 'No students'}
              </div>
            ) : (
              students.map(student => (
                <KanbanCard key={student.id} student={student} />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// ── Main board ─────────────────────────────────────────────────────────────
interface KanbanBoardProps {
  readOnly?: boolean;
}

export function KanbanBoard({ readOnly = false }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<StudentStage | null>(null);

  const { data, isLoading, isFetching } = useQuery<StudentsByStage>({
    queryKey: ['placement'],
    queryFn: async () => {
      const res = await fetch('/api/placement');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      // Ensure all stage keys exist
      const base: StudentsByStage = {
        learning: [], applying: [], interviewing: [],
        offer_pending: [], placed: [], hired: [],
      };
      const raw = json.students_by_stage ?? {};
      STAGE_KEYS.forEach(k => { base[k] = raw[k] ?? []; });
      return base;
    },
    refetchInterval: 30000,
  });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Find which stage a student currently belongs to
  const findStage = useCallback((studentId: string): StudentStage | null => {
    if (!data) return null;
    for (const stage of STAGE_KEYS) {
      if (data[stage]?.some(s => s.id === studentId)) return stage;
    }
    return null;
  }, [data]);

  // Resolve the target stage from over.id (could be a stage key or a card id)
  const resolveTargetStage = useCallback((overId: string): StudentStage | null => {
    if (STAGE_KEYS.includes(overId as StudentStage)) return overId as StudentStage;
    return findStage(overId); // card id → find its column
  }, [findStage]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!event.over) { setOverId(null); return; }
    const target = resolveTargetStage(event.over.id as string);
    setOverId(target);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    setOverId(null);

    const { active, over } = event;
    if (!over || readOnly) return;

    const studentId = active.id as string;
    const newStage = resolveTargetStage(over.id as string);
    const currentStage = findStage(studentId);

    if (!newStage || !currentStage || currentStage === newStage) return;

    // Optimistic update — deep clone to avoid mutation
    const snapshot = JSON.parse(JSON.stringify(data)) as StudentsByStage;

    queryClient.setQueryData<StudentsByStage>(['placement'], (old) => {
      if (!old) return old;
      const next: StudentsByStage = { ...old };
      STAGE_KEYS.forEach(k => { next[k] = [...(old[k] ?? [])]; });

      const idx = next[currentStage].findIndex(s => s.id === studentId);
      if (idx === -1) return old;
      const [student] = next[currentStage].splice(idx, 1);
      next[newStage] = [...(next[newStage] ?? []), student];
      return next;
    });

    try {
      const res = await fetch(`/api/placement/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.message || 'Failed to update stage');
        queryClient.setQueryData(['placement'], snapshot);
      } else {
        toast.success(`Moved to ${STAGES.find(s => s.key === newStage)?.label}`);
        queryClient.invalidateQueries({ queryKey: ['students'] });
      }
    } catch {
      toast.error('Failed to update stage');
      queryClient.setQueryData(['placement'], snapshot);
    }
  };

  // Active card data for drag overlay
  const activeStudent = activeId
    ? STAGE_KEYS.flatMap(k => data?.[k] ?? []).find(s => s.id === activeId)
    : null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {STAGES.map(s => (
          <div key={s.key} className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['placement'] })}
          disabled={isFetching}
          className="h-8 text-xs gap-1.5"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-5 gap-4">
          {STAGES.map(({ key, label, accent, badge }) => (
            <DroppableColumn
              key={key}
              stage={key}
              label={label}
              accent={accent}
              badge={badge}
              students={data?.[key] ?? []}
              readOnly={readOnly}
              isOver={overId === key}
            />
          ))}
        </div>

        {/* Drag overlay — renders the card while dragging */}
        <DragOverlay>
          {activeStudent ? (
            <KanbanCard student={activeStudent} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
