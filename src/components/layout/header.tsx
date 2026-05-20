'use client';

import Link from 'next/link';
import { Building2, Bell } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/lib/hooks/use-auth';

export function Header() {
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 lg:hidden border-b border-slate-900/[0.06] glass-strong">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),_0_3px_10px_-4px_rgba(79,70,229,0.45)]">
            <Building2 className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">EstateFlow</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="press flex items-center justify-center h-9 w-9 rounded-full text-slate-600 hover:bg-slate-100"
          >
            <Bell className="h-[18px] w-[18px]" />
          </Link>
          {profile && (
            <Link href="/settings" className="press flex items-center">
              <span className="rounded-full ring-2 ring-white shadow-[0_1px_3px_rgba(15,23,42,0.10)]">
                <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
