'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import { Student, StudentStage } from '@/types';
import { KanbanCard } from './KanbanCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const stageConfig: Record<StudentStage, { label: string; color: string }> = {
  learning: { label: 'Learning', color: 'bg-slate-500' },
  applying: { label: 'Applying', color: 'bg-blue-500' },
  interviewing: { label: 'Interviewing', color: 'bg-amber-500' },
  offer_pending: { label: 'Offer Pending', color: 'bg-orange-500' },
  placed: { label: 'Placed', color: 'bg-emerald-500' },
};

const stageOrder: StudentStage[] = ['learning', 'applying', 'interviewing', 'offer_pending', 'placed'];

interface StudentsByStage {
  learning: { id: string; name: string; batch: string; updated_at: string }[];
  applying: { id: string; name: string; batch: string; updated_at: string }[];
  interviewing: { id: string; name: string; batch: string; updated_at: string }[];
  offer_pending: { id: string; name: string; batch: string; updated_at: string }[];
  placed: { id: string; name: string; batch: string; updated_at: string }[];
}

interface KanbanBoardProps {
  readOnly?: boolean;
}

export function KanbanBoard({ readOnly = false }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [isRefetching, setIsRefetching] = useState(false);

  const { data, isLoading, isFetching } = useQuery<StudentsByStage>({
    queryKey: ['placement'],
    queryFn: async () => {
      const res = await fetch('/api/placement');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      return json.students_by_stage as StudentsByStage;
    },
    refetchInterval: 30000,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleRefetch = async () => {
    setIsRefetching(true);
    await queryClient.invalidateQueries({ queryKey: ['placement'] });
    setTimeout(() => setIsRefetching(false), 500);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || readOnly) return;

    const studentId = active.id as string;
    const newStage = over.id as StudentStage;

    const currentStage = stageOrder.find(stage => 
      data?.[stage]?.some(s => s.id === studentId)
    );

    if (!currentStage || currentStage === newStage) return;

    const previousData = JSON.parse(JSON.stringify(data));

    queryClient.setQueryData<StudentsByStage>(['placement'], (old) => {
      if (!old) return old;
      const studentIndex = old[currentStage].findIndex(s => s.id === studentId);
      if (studentIndex === -1) return old;
      const [student] = old[currentStage].splice(studentIndex, 1);
      old[newStage].push(student);
      return { ...old };
    });

    try {
      const res = await fetch(`/api/placement/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.message || 'Failed to update');
        queryClient.setQueryData(['placement'], previousData);
      } else {
        toast.success('Stage updated');
      }
    } catch {
      toast.error('Failed to update stage');
      queryClient.setQueryData(['placement'], previousData);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {stageOrder.map((stage) => (
          <div key={stage}>
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-24 w-full mb-2" />
            <Skeleton className="h-24 w-full mb-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={handleRefetch} disabled={isRefetching || isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-5 gap-4">
          {stageOrder.map((stage) => {
            const config = stageConfig[stage];
            const students = data?.[stage] || [];

            return (
              <Card key={stage} className="min-h-[500px]">
                <CardHeader className={`py-3 border-b-2 ${config.color.replace('bg-', 'border-')}`}>
                  <CardTitle className="text-sm flex items-center justify-between">
                    {config.label}
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                      {students.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 bg-slate-50/50">
                  <SortableContext items={students.map(s => s.id)} strategy={verticalListSortingStrategy} disabled={readOnly}>
                    {students.map((student) => (
                      <KanbanCard
                        key={student.id}
                        student={{
                          id: student.id,
                          name: student.name,
                          batch: student.batch,
                          mentor_email: '',
                          stage,
                          risk_status: 'safe',
                          risk_reasons: '',
                          last_activity_date: '',
                          created_at: '',
                          updated_at: student.updated_at,
                        }}
                      />
                    ))}
                  </SortableContext>
                  {students.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-8">No students</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}