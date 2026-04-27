import { Suspense } from 'react';
import Link from 'next/link';
import { Users, AlertTriangle, UsersRound, Clock, CheckCircle, FileText } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RiskTable } from '@/components/dashboard/RiskTable';
import { PlacementFunnel } from '@/components/dashboard/PlacementFunnel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

async function getStudentsData() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/students?limit=1`, { 
      cache: 'no-store' 
    });
    if (!res.ok) return { total: 0 };
    const data = await res.json();
    return { total: data.total || 0 };
  } catch {
    return { total: 0 };
  }
}

async function getRiskData() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/risk`, { 
      cache: 'no-store' 
    });
    if (!res.ok) return { total: 0 };
    const data = await res.json();
    return { total: data.total || 0, students: data.data || [] };
  } catch {
    return { total: 0, students: [] };
  }
}

async function getPlacementData() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/placement`, { 
      cache: 'no-store' 
    });
    if (!res.ok) return { interviewing: 0, offer_pending: 0, placed: 0 };
    return await res.json();
  } catch {
    return { interviewing: 0, offer_pending: 0, placed: 0 };
  }
}

async function getUpdatesData() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/updates?date=${today}`, { 
      cache: 'no-store' 
    });
    if (!res.ok) return { submitted_count: 0 };
    const data = await res.json();
    return { submitted_count: data.submitted_count || 0 };
  } catch {
    return { submitted_count: 0 };
  }
}

async function DashboardContent() {
  const [studentsData, riskData, placementData, updatesData] = await Promise.all([
    getStudentsData(),
    getRiskData(),
    getPlacementData(),
    getUpdatesData(),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Total Students"
          value={studentsData.total}
          icon={Users}
          color="indigo"
        />
        <StatsCard
          title="At Risk"
          value={riskData.total}
          icon={AlertTriangle}
          color="red"
        />
        <StatsCard
          title="Interviewing"
          value={placementData.interviewing}
          icon={UsersRound}
          color="blue"
        />
        <StatsCard
          title="Offer Pending"
          value={placementData.offer_pending}
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title="Placed"
          value={placementData.placed}
          icon={CheckCircle}
          color="emerald"
        />
        <StatsCard
          title="Updates Today"
          value={updatesData.submitted_count}
          icon={FileText}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>At-Risk Students</CardTitle>
            <Link href="/students?risk_status=at_risk" className="text-sm text-indigo-600 hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <RiskTable students={riskData.students} maxRows={5} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Placement Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <PlacementFunnel stats={placementData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}