'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Kanban, ClipboardList,
  LogOut, ChevronDown, ClipboardCheck, BarChart2,
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const studentsSubItems = [
  { href: '/students/progress-logs', label: 'Progress Logs',  icon: BarChart2 },
  { href: '/students/attendance',    label: 'Attendance',     icon: ClipboardCheck },
];

function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' {
  if (role === 'admin') return 'default';
  if (role === 'placement') return 'secondary';
  return 'outline';
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  // Students section is active if on /students or any sub-route
  const studentsActive = pathname === '/students' || pathname.startsWith('/students/');
  // Sub-menu open state — defaults open when already on a students route
  const [studentsOpen, setStudentsOpen] = useState(studentsActive);

  const pageLabel = (() => {
    if (pathname === '/') return 'Overview';
    if (pathname === '/students') return 'Students';
    if (pathname === '/students/progress-logs') return 'Progress Logs';
    if (pathname === '/students/attendance') return 'Attendance';
    if (pathname.startsWith('/placement')) return 'Placement';
    if (pathname.startsWith('/updates')) return 'Daily Updates';
    return 'Overview';
  })();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 bg-card border-r border-border flex flex-col h-screen sticky top-0 z-20">

        {/* Brand */}
        <div className="h-20 px-6 flex items-center gap-4 border-b border-border shrink-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0">
            <Image src="/assets/icon.webp" alt="Placement" width={40} height={40} className="object-cover w-full h-full" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">Placement</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          <p className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Menu</p>

          {/* Overview */}
          <Link
            href="/"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-all duration-150',
              pathname === '/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            Overview
          </Link>

          {/* Students — collapsible with sub-items */}
          <Collapsible open={studentsOpen} onOpenChange={setStudentsOpen}>
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-all duration-150 group',
                  studentsActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Users className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left">Students</span>
                <ChevronDown className={cn(
                  'w-4 h-4 shrink-0 text-muted-foreground/60 transition-transform duration-200',
                  studentsOpen ? 'rotate-180' : '',
                )} />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
              {/* Left accent line + sub-items */}
              <div className="ml-5 mt-0.5 mb-0.5 pl-3 border-l-2 border-border/60 space-y-0.5">

                <Link
                  href="/students"
                  className={cn(
                    'flex items-center gap-3 px-3 py-1.5 rounded-md text-base font-medium transition-all duration-150',
                    pathname === '/students'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  All Students
                </Link>

                {studentsSubItems.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-1.5 rounded-md text-base font-medium transition-all duration-150',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Placement */}
          <Link
            href="/placement"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-all duration-150',
              pathname.startsWith('/placement') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Kanban className="w-5 h-5 shrink-0" />
            Placement
          </Link>

          {/* Daily Updates */}
          <Link
            href="/updates"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-all duration-150',
              pathname.startsWith('/updates') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <ClipboardList className="w-5 h-5 shrink-0" />
            Daily Updates
          </Link>
        </nav>

        {/* User footer */}
        {user && (
          <div className="shrink-0 p-4 border-t border-border space-y-3">
            <div className="flex items-center gap-3 px-1">
              <Avatar className="w-10 h-10 shrink-0 border shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate leading-tight">{user.name}</p>
                <Badge variant={getRoleBadgeVariant(user.role)} className="mt-1 text-xs uppercase tracking-wider py-0 px-2 shadow-none h-5">
                  {user.role}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost" size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground h-10 px-3 text-sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 shrink-0 bg-background/95 backdrop-blur border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-foreground">{pageLabel}</h2>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
