'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Clock, Check, AlarmClockOff, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatPhone, timeAgo } from '@/lib/utils';
import { completeFollowUp, snoozeFollowUp } from '@/app/actions/followups';

const typeIcons: Record<string, any> = {
  whatsapp: MessageSquare,
  sms: MessageSquare,
  email: MessageSquare,
  call: Phone,
};

export function FollowUpsList({ followups }: { followups: any[] }) {
  const now = new Date();
  const overdue = followups.filter(f => new Date(f.scheduled_at) < now);
  const upcoming = followups.filter(f => new Date(f.scheduled_at) >= now);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Follow-ups</h1>

      {followups.length === 0 ? (
        <EmptyState icon={Clock} title="No follow-ups" description="All caught up!" />
      ) : (
        <>
          {overdue.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-red-600 mb-3">Overdue ({overdue.length})</h2>
              <div className="space-y-3">
                {overdue.map(f => <FollowUpCard key={f.id} followup={f} isOverdue />)}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-3">Upcoming ({upcoming.length})</h2>
              <div className="space-y-3">
                {upcoming.map(f => <FollowUpCard key={f.id} followup={f} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FollowUpCard({ followup: f, isOverdue = false }: { followup: any; isOverdue?: boolean }) {
  const Icon = typeIcons[f.type] || Clock;
  const [busy, setBusy] = useState<'complete' | 'snooze' | null>(null);
  const [, startTransition] = useTransition();

  function handleComplete() {
    setBusy('complete');
    startTransition(async () => {
      try { await completeFollowUp(f.id); } finally { setBusy(null); }
    });
  }

  function handleSnooze() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setBusy('snooze');
    startTransition(async () => {
      try { await snoozeFollowUp(f.id, tomorrow.toISOString()); } finally { setBusy(null); }
    });
  }

  return (
    <Card className={isOverdue ? 'border-red-200' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Link href={`/leads/${f.lead_id}`} className="text-sm font-semibold text-gray-900 hover:underline">
              {f.lead?.full_name}
            </Link>
            <p className="text-xs text-gray-500">{formatPhone(f.lead?.phone || '')}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                <Icon className="h-3 w-3" /> {f.type}
              </Badge>
              <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {timeAgo(f.scheduled_at)}
              </span>
            </div>
            {f.message && <p className="text-xs text-gray-500 mt-1 truncate">{f.message}</p>}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button size="icon-sm" variant="ghost" onClick={handleComplete} loading={busy === 'complete'} title="Complete">
              {busy === 'complete' ? null : <Check className="h-4 w-4 text-green-600" />}
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={handleSnooze} loading={busy === 'snooze'} title="Snooze to tomorrow">
              {busy === 'snooze' ? null : <AlarmClockOff className="h-4 w-4 text-orange-500" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
