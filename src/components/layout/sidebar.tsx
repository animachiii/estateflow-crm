'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Building2, Clock, CalendarCheck, Share2,
  UsersRound, Settings, BarChart3, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/properties', icon: Building2, label: 'Properties' },
  { href: '/followups', icon: Clock, label: 'Follow-ups' },
  { href: '/attendance', icon: CalendarCheck, label: 'Attendance' },
  { href: '/social', icon: Share2, label: 'Social Media' },
  { href: '/team', icon: UsersRound, label: 'Team' },
  { href: '/reports', icon: BarChart3, label: 'Reports' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 border-r border-gray-200 bg-white h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-gray-200">
        <Building2 className="h-7 w-7 text-blue-600" />
        <span className="text-lg font-bold text-gray-900">EstateFlow</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
