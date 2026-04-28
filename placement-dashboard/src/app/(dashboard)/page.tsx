import { Suspense } from 'react';
import Link from 'next/link';
import { Users, AlertTriangle, UsersRound, Clock, CheckCircle, FileText } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RiskTable } from '@/components/dashboard/RiskTable';
import { PlacementFunnel } from '@/components/dashboard/PlacementFunnel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllStudents } from '@/lib/sheets/students';
import { getUpdatesByDate } from '@/lib/sheets/updates';
import { getUserFromHeaders } from '@/lib/auth/helpers';
import { headers } from 'next/headers';
import { differenceInDays } from 'date-fns';

// Always fetch fresh data — never serve a cached/stale page
export const revalidate = 0;

/** Lightweight inline risk check — no cron dependency.
 *  A student is considered at-risk if:
 *  - risk_status column is already 'at_risk', OR
 *  - last_activity_date is more than 7 days ago (and not terminated/hired)
 */
function isAtRisk(student: { risk_status: string; last_activity_date: string; terminated: boolean; hired: boolean }): boolean {
  if (student.terminated || student.hired) return false;
  if (student.risk_status === 'at_risk') return true;
  if (!student.last_activity_date) return false;
  try {
    return differenceInDays(new Date(), new Date(student.last_activity_date)) >= 7;
  } catch {
    return false;
  }
}

async function getDashboardData() {
  const today = new Date().toISOString().split('T')[0];

  const [allStudents, updatesToday] = await Promise.all([
    getAllStudents(),
    getUpdatesByDate(today),
  ]);

  // Active = not terminated
  const active = allStudents.filter(s => !s.terminated);

  // At-risk: computed inline — no cron dependency
  const atRiskStudents = active.filter(isAtRisk);

  // Stage breakdown — always use the actual stage value from the sheet.
  // The `hired` boolean flag is a separate status, not a stage override.
  // Count ALL students (including terminated) for accurate pipeline numbers.
  const placementStats = allStudents.reduce(
    (acc, student) => {
      if (student.stage in acc) acc[student.stage as keyof typeof acc]++;
      return acc;
    },
    { learning: 0, applying: 0, interviewing: 0, offer_pending: 0, placed: 0, hired: 0 }
  );

  // hired count = students with hired:true flag (source of truth for "confirmed hired")
  const confirmedHired = allStudents.filter(s => s.hired).length;

  return {
    totalStudents: allStudents.length,
    activeStudents: active.length,
    riskCount: atRiskStudents.length,
    riskStudents: atRiskStudents.slice(0, 5),
    placementStats,
    confirmedHired,
    updatesCount: updatesToday.length,
  };
}

async function DashboardContent() {
  const data = await getDashboardData();
  const headersList = await headers();
  const user = getUserFromHeaders(headersList);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your students today.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Total Students"
          value={data.totalStudents}
          subtitle={`${data.activeStudents} active`}
          icon={Users}
          color="indigo"
        />
        <StatsCard
          title="At Risk"
          value={data.riskCount}
          icon={AlertTriangle}
          color="red"
        />
        <StatsCard
          title="Interviewing"
          value={data.placementStats.interviewing}
          icon={UsersRound}
          color="blue"
        />
        <StatsCard
          title="Offer Pending"
          value={data.placementStats.offer_pending}
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title="Placed / Hired"
          value={data.placementStats.placed + data.confirmedHired}
          subtitle={`${data.confirmedHired} confirmed hired`}
          icon={CheckCircle}
          color="emerald"
        />
        <StatsCard
          title="Updates Today"
          value={data.updatesCount}
          icon={FileText}
          color="indigo"
        />
      </div>

      {/* At-risk table + funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-heading">At-Risk Students</CardTitle>
            <Link
              href="/students?risk_status=at_risk"
              className="text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <RiskTable students={data.riskStudents} maxRows={5} />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading">Placement Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <PlacementFunnel stats={data.placementStats} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="shadow-sm border-border/50">
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border/50">
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
        </Card>
        <Card className="shadow-sm border-border/50">
          <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-full">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
