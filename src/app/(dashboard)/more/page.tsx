'use client';

import Link from 'next/link';
import { CalendarCheck, UsersRound, Settings, BarChart3, Bell, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const items = [
  { href: '/attendance', icon: CalendarCheck, label: 'Attendance', color: 'text-teal-600 bg-teal-50' },
  { href: '/team', icon: UsersRound, label: 'Team', color: 'text-blue-600 bg-blue-50' },
  { href: '/reports', icon: BarChart3, label: 'Reports', color: 'text-purple-600 bg-purple-50' },
  { href: '/notifications', icon: Bell, label: 'Notifications', color: 'text-orange-600 bg-orange-50' },
  { href: '/settings', icon: Settings, label: 'Settings', color: 'text-gray-600 bg-gray-100' },
];

export default function MorePage() {
  return (
    <div className="p-4 lg:p-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">More</h1>
      <div className="space-y-2">
        {items.map(({ href, icon: Icon, label, color }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow mb-2">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-gray-900 flex-1">{label}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
