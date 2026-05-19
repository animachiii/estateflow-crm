'use client';

import Link from 'next/link';
import { Building2, Bell } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/lib/hooks/use-auth';

export function Header() {
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 lg:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          <span className="text-base font-bold text-gray-900">EstateFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="relative p-2">
            <Bell className="h-5 w-5 text-gray-600" />
          </Link>
          {profile && (
            <Link href="/settings">
              <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
