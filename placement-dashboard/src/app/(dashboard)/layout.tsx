'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Kanban, ClipboardList, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/placement', label: 'Placement', icon: Kanban },
  { href: '/updates', label: 'Daily Updates', icon: ClipboardList },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'placement': return 'secondary';
      case 'mentor': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-muted-foreground font-medium">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-muted/40 selection:bg-primary/20">
      <aside className="w-64 bg-card border-r flex flex-col relative z-20">
        <div className="p-6 h-16 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
              <Image src="/assets/icon.webp" alt="Placement" width={32} height={32} className="object-cover w-full h-full" />
            </div>
            <h1 className="text-xl font-heading font-bold text-card-foreground">
              Placement
            </h1>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Menu
          </div>
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="p-4 m-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-10 h-10 border shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <Badge variant={getRoleBadgeVariant(user.role)} className="mt-1 text-[10px] uppercase tracking-wider py-0 px-1.5 shadow-none">
                  {user.role}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-heading font-semibold text-foreground">
            {navItems.find(item => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)))?.label || 'Overview'}
          </h2>
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}