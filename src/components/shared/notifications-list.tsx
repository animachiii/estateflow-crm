'use client';

import { Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { timeAgo, cn } from '@/lib/utils';

export function NotificationsList({ notifications }: { notifications: any[] }) {
  return (
    <div className="p-4 lg:p-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Notifications</h1>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up" />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card key={n.id} className={cn(!n.read && 'border-blue-200 bg-blue-50/30')}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', n.read ? 'bg-gray-300' : 'bg-blue-500')} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-500">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
