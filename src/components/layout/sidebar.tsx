'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Building2, Clock, CalendarCheck,
  UsersRound, Settings, BarChart3, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/properties', icon: Building2, label: 'Properties' },
  { href: '/followups', icon: Clock, label: 'Follow-ups' },
  { href: '/attendance', icon: CalendarCheck, label: 'Attendance' },
  { href: '/team', icon: UsersRound, label: 'Team' },
  { href: '/reports', icon: BarChart3, label: 'Reports' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 h-screen sticky top-0 glass border-r border-slate-900/[0.06]">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-900/[0.06]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),_0_4px_12px_-4px_rgba(79,70,229,0.45)]">
          <Building2 className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-slate-900">EstateFlow</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'press relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-medium tracking-tight',
                'transition-colors duration-150',
                isActive
                  ? 'bg-white text-slate-900 ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_4px_12px_-6px_rgba(15,23,42,0.10)]'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900',
              )}
            >
              {isActive && (
                <span className="absolute -left-1 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-gradient-to-b from-indigo-500 to-violet-600" />
              )}
              <link.icon
                className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-indigo-600' : 'text-slate-500')}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-[11px] text-slate-400 border-t border-slate-900/[0.06]">
        EstateFlow · v1.0
      </div>
    </aside>
  );
}
