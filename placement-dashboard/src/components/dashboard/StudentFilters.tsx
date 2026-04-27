'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function StudentFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/students?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/students');
  };

  const hasFilters = Array.from(searchParams.entries()).length > 0;

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="Search by name..."
          defaultValue={searchParams.get('search') || ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateFilter('search', (e.target as HTMLInputElement).value);
            }
          }}
        />
      </div>
      <Select
        value={searchParams.get('stage') ?? 'all'}
        onValueChange={(value) => updateFilter('stage', value ?? 'all')}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stages</SelectItem>
          <SelectItem value="learning">Learning</SelectItem>
          <SelectItem value="applying">Applying</SelectItem>
          <SelectItem value="interviewing">Interviewing</SelectItem>
          <SelectItem value="offer_pending">Offer Pending</SelectItem>
          <SelectItem value="placed">Placed</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get('risk_status') ?? 'all'}
        onValueChange={(value) => updateFilter('risk_status', value ?? 'all')}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Risk Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="safe">Safe</SelectItem>
          <SelectItem value="at_risk">At Risk</SelectItem>
        </SelectContent>
      </Select>
      <Input
        placeholder="Batch"
        className="w-[120px]"
        defaultValue={searchParams.get('batch') || ''}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            updateFilter('batch', (e.target as HTMLInputElement).value);
          }
        }}
      />
      {hasFilters && (
        <Button variant="outline" onClick={clearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}