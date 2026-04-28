'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function StudentFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const param = (key: string): string => searchParams.get(key) ?? '';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/students?${params.toString()}`);
  };

  const clearFilters = () => {
    if (searchRef.current) searchRef.current.value = '';
    router.push('/students');
  };

  const hasFilters = Array.from(searchParams.entries()).some(([k]) => k !== 'page');

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Name search */}
      <div className="flex-1 min-w-[180px]">
        <Input
          ref={searchRef}
          placeholder="Search by name..."
          defaultValue={param('search')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateFilter('search', (e.target as HTMLInputElement).value.trim());
            }
          }}
        />
      </div>

      {/* Stage */}
      <Select value={param('stage') || undefined} onValueChange={(v) => updateFilter('stage', v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="learning">Learning</SelectItem>
          <SelectItem value="applying">Applying</SelectItem>
          <SelectItem value="interviewing">Interviewing</SelectItem>
          <SelectItem value="offer_pending">Offer Pending</SelectItem>
          <SelectItem value="placed">Placed</SelectItem>
        </SelectContent>
      </Select>

      {/* Risk */}
      <Select value={param('risk_status') || undefined} onValueChange={(v) => updateFilter('risk_status', v)}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Risk" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="safe">Safe</SelectItem>
          <SelectItem value="at_risk">At Risk</SelectItem>
        </SelectContent>
      </Select>

      {/* Job Focus */}
      <Select value={param('job_focus') || undefined} onValueChange={(v) => updateFilter('job_focus', v)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Job Focus" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="remote">Remote</SelectItem>
          <SelectItem value="onsite">Onsite</SelectItem>
          <SelectItem value="hybrid">Hybrid</SelectItem>
        </SelectContent>
      </Select>

      {/* Terminated */}
      <Select value={param('terminated') || undefined} onValueChange={(v) => updateFilter('terminated', v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Terminated" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="false">Active Only</SelectItem>
          <SelectItem value="true">Terminated</SelectItem>
        </SelectContent>
      </Select>

      {/* Hired */}
      <Select value={param('hired') || undefined} onValueChange={(v) => updateFilter('hired', v)}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Hired" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Hired</SelectItem>
          <SelectItem value="false">Not Hired</SelectItem>
        </SelectContent>
      </Select>

      {/* Batch */}
      <Input
        placeholder="Batch"
        className="w-[110px]"
        defaultValue={param('batch')}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            updateFilter('batch', (e.target as HTMLInputElement).value.trim());
          }
        }}
      />

      {hasFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Clear
        </Button>
      )}
    </div>
  );
}
