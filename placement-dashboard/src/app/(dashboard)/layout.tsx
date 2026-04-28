'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Kanban, ClipboardList, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/',          label: 'Overview',      icon: LayoutDashboard },
  { href: '/students',  label: 'Students',      icon: Users },
  { href: '/placement', label: 'Placement',     icon: Kanban },
  { href: '/updates',   label: 'Daily Updates', icon: ClipboardList },
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

  const currentPage =
    navItems.find(item =>
      pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
    )?.label ?? 'Overview';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium text-sm">Loading Dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/30">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 bg-card border-r border-border flex flex-col h-screen sticky top-0 z-20">

        {/* Brand */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm shrink-0">
            <Image
              src="/assets/icon.webp"
              alt="Placement"
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">
            Placement
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          <p className="px-3 mb-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Menu
          </p>
          {navItems.map(item => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        {user && (
          <div className="shrink-0 p-3 border-t border-border space-y-3">
            <div className="flex items-center gap-3 px-1">
              <Avatar className="w-8 h-8 shrink-0 border shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate leading-tight">
                  {user.name}
                </p>
                <Badge
                  variant={getRoleBadgeVariant(user.role)}
                  className="mt-0.5 text-[10px] uppercase tracking-wider py-0 px-1.5 shadow-none h-4"
                >
                  {user.role}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground h-8 px-3 text-xs"
              onClick={handleLogout}
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header */}
        <header className="h-16 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-base font-semibold text-foreground">{currentPage}</h2>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
