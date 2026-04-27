'use client';

import { format } from 'date-fns';
import { AlertTriangle, PartyPopper } from 'lucide-react';
import { TeamUpdate } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface TeamUpdatesFeedProps {
  updates: TeamUpdate[];
  blockers: string[];
  missingMembers?: string[];
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'admin': return 'default';
    case 'placement': return 'secondary';
    case 'mentor': return 'outline';
    default: return 'outline';
  }
}

export function TeamUpdatesFeed({ updates, blockers, missingMembers = [] }: TeamUpdatesFeedProps) {
  return (
    <div className="space-y-6">
      {blockers.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
              Blockers ({blockers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <ul className="space-y-1">
              {blockers.map((blocker, i) => (
                <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  {blocker}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {blockers.length === 0 && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="py-4 flex items-center gap-2 text-emerald-700">
            <PartyPopper className="w-5 h-5" />
            <span className="font-medium">No blockers today 🎉</span>
          </CardContent>
        </Card>
      )}

      {missingMembers.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2 text-muted-foreground">Not submitted yet:</p>
          <div className="flex flex-wrap gap-2">
            {missingMembers.map((member, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-slate-300">
                    {getInitials(member)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{member}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold">Team Updates ({updates.length})</h3>
        {updates.length === 0 ? (
          <p className="text-muted-foreground text-sm">No updates for this date</p>
        ) : (
          updates.map((update) => (
            <Card key={update.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-indigo-100 text-indigo-700">
                        {getInitials(update.submitted_by.split('@')[0])}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{update.submitted_by}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(update.submitted_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getRoleBadgeVariant(update.role)}>{update.role}</Badge>
                </div>
              </CardHeader>
              <CardContent className="py-3 space-y-3">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">Goals</h4>
                  <p className="text-sm whitespace-pre-wrap">{update.goals}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">Achievements</h4>
                  <p className="text-sm whitespace-pre-wrap">{update.achievements}</p>
                </div>
                {update.blockers && update.blockers.trim() && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase mb-1">Blockers</h4>
                      <p className="text-sm whitespace-pre-wrap">{update.blockers}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}