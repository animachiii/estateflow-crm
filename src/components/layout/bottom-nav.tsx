'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Building2, Clock, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Home' },
  { href: '/leads', icon: Users, label: 'Leads' },
  { href: '/properties', icon: Building2, label: 'Properties' },
  { href: '/followups', icon: Clock, label: 'Follow-ups' },
  { href: '/more', icon: MoreHorizontal, label: 'More' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden safe-area-bottom border-t border-slate-900/[0.06] glass-strong">
      <div className="flex items-center justify-around h-[64px] px-1">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'press relative flex flex-col items-center justify-center gap-0.5 w-16 py-1.5',
                'transition-colors duration-150',
                isActive ? 'text-indigo-600' : 'text-slate-500',
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-indigo-50 px-3 py-1 ring-1 ring-inset ring-indigo-600/15'
                    : 'px-2 py-1',
                )}
              >
                <item.icon className="h-[20px] w-[20px]" strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span className={cn('text-[10px] tracking-tight', isActive ? 'font-semibold' : 'font-medium')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
