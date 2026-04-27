import { Suspense } from 'react';
import Link from 'next/link';
import { Users, AlertTriangle, UsersRound, Clock, CheckCircle, FileText } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RiskTable } from '@/components/dashboard/RiskTable';
import { PlacementFunnel } from '@/components/dashboard/PlacementFunnel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllStudents, filterStudents } from '@/lib/sheets/students';
import { getUpdatesByDate } from '@/lib/sheets/updates';

async function getDashboardData() {
  const [allStudents, atRiskStudents, updatesToday] = await Promise.all([
    getAllStudents(),
    filterStudents({ risk_status: 'at_risk' }),
    getUpdatesByDate(new Date().toISOString().split('T')[0])
  ]);

  const placementStats = allStudents.reduce((acc, student) => {
    if (student.stage === 'interviewing') acc.interviewing++;
    if (student.stage === 'offer_pending') acc.offer_pending++;
    if (student.stage === 'placed') acc.placed++;
    return acc;
  }, { interviewing: 0, offer_pending: 0, placed: 0 });

  return {
    studentsCount: allStudents.length,
    riskCount: atRiskStudents.length,
    riskStudents: atRiskStudents.slice(0, 5),
    placementStats,
    updatesCount: updatesToday.length
  };
}

async function DashboardContent() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Total Students"
          value={data.studentsCount}
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
          title="Placed"
          value={data.placementStats.placed}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>At-Risk Students</CardTitle>
            <Link href="/students?risk_status=at_risk" className="text-sm text-indigo-600 hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <RiskTable students={data.riskStudents} maxRows={5} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Placement Funnel</CardTitle>
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
    <div className="space-y-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}