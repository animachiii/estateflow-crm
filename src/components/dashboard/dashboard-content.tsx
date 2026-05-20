'use client';

import Link from 'next/link';
import { Users, Phone, Clock, Flame, Building2, UserCheck, Plus, PhoneCall } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { timeAgo, TEMP_COLORS, formatPhone } from '@/lib/utils';
import type { Profile } from '@/types';

interface DashboardProps {
  stats: {
    newLeadsToday: number;
    callsToday: number;
    dueFollowUps: number;
    hotLeads: number;
    availableProperties: number;
    checkedIn: number;
  };
  dueFollowUps: any[];
  hotLeads: any[];
  recentActivities: any[];
  checkedInUsers: any[];
  profile: Profile;
}

const statCards = [
  { key: 'newLeadsToday', label: 'New Leads', icon: Users, tint: 'from-indigo-500/15 to-indigo-500/0', icon_bg: 'bg-indigo-50 text-indigo-600 ring-indigo-600/10', href: '/leads' },
  { key: 'callsToday', label: 'Calls Today', icon: Phone, tint: 'from-emerald-500/15 to-emerald-500/0', icon_bg: 'bg-emerald-50 text-emerald-600 ring-emerald-600/10', href: '/leads' },
  { key: 'dueFollowUps', label: 'Due Follow-ups', icon: Clock, tint: 'from-amber-500/15 to-amber-500/0', icon_bg: 'bg-amber-50 text-amber-600 ring-amber-600/10', href: '/followups' },
  { key: 'hotLeads', label: 'Hot Leads', icon: Flame, tint: 'from-rose-500/15 to-rose-500/0', icon_bg: 'bg-rose-50 text-rose-600 ring-rose-600/10', href: '/leads?temperature=hot' },
  { key: 'availableProperties', label: 'Inventory', icon: Building2, tint: 'from-violet-500/15 to-violet-500/0', icon_bg: 'bg-violet-50 text-violet-600 ring-violet-600/10', href: '/properties' },
  { key: 'checkedIn', label: 'Checked In', icon: UserCheck, tint: 'from-teal-500/15 to-teal-500/0', icon_bg: 'bg-teal-50 text-teal-600 ring-teal-600/10', href: '/attendance' },
] as const;

function todayLabel() {
  const d = new Date();
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function DashboardContent({ stats, dueFollowUps, hotLeads, recentActivities, profile }: DashboardProps) {
  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{todayLabel()}</p>
          <h1 className="text-[28px] lg:text-[34px] font-semibold tracking-tight text-slate-900 mt-1">
            Hi, {profile.full_name.split(' ')[0]}
            <span className="text-slate-400 font-normal"> 👋</span>
          </h1>
          <p className="text-[14px] text-slate-500 mt-0.5">Here&apos;s what&apos;s moving today.</p>
        </div>
        <Link href="/leads/new">
          <Button size="sm"><Plus className="h-4 w-4" /> Add Lead</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {statCards.map(({ key, label, icon: Icon, tint, icon_bg, href }) => (
          <Link key={key} href={href} className="press lift block">
            <Card className="relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${tint} pointer-events-none`} />
              <CardContent className="p-4 relative">
                <div className="flex items-start justify-between">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset ${icon_bg}`}>
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  </div>
                </div>
                <p className="mt-3 text-[28px] font-semibold tracking-tight text-slate-900 leading-none">{stats[key]}</p>
                <p className="text-[12px] text-slate-500 mt-1.5">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Due Follow-ups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" /> Due Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dueFollowUps.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No follow-ups due</p>
            ) : (
              <div className="space-y-1">
                {dueFollowUps.map((f: any) => (
                  <Link key={f.id} href={`/leads/${f.lead_id}`} className="press flex items-center justify-between p-2.5 -mx-2 rounded-xl hover:bg-slate-50">
                    <div>
                      <p className="text-[13.5px] font-medium text-slate-900">{f.lead?.full_name}</p>
                      <p className="text-[12px] text-slate-500 capitalize">{f.type} · {timeAgo(f.scheduled_at)}</p>
                    </div>
                    <PhoneCall className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hot Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" /> Hot Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hotLeads.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No hot leads</p>
            ) : (
              <div className="space-y-1">
                {hotLeads.map((lead: any) => (
                  <Link key={lead.id} href={`/leads/${lead.id}`} className="press flex items-center justify-between p-2.5 -mx-2 rounded-xl hover:bg-slate-50">
                    <div>
                      <p className="text-[13.5px] font-medium text-slate-900">{lead.full_name}</p>
                      <p className="text-[12px] text-slate-500">{formatPhone(lead.phone)}</p>
                    </div>
                    <Badge className={TEMP_COLORS.hot}>Hot</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
          ) : (
            <div className="relative">
              <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-gradient-to-b from-slate-200 via-slate-200/60 to-transparent" />
              <div className="space-y-4">
                {recentActivities.map((a: any) => (
                  <div key={a.id} className="relative flex items-start gap-3 text-[13.5px] pl-0">
                    <div className="relative z-10 flex h-3 w-3 items-center justify-center mt-1 shrink-0">
                      <span className="h-2.5 w-2.5 rounded-full bg-white ring-2 ring-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900">{a.title}</p>
                      {a.description && <p className="text-slate-500 text-[12px] truncate">{a.description}</p>}
                      <p className="text-slate-400 text-[11px] mt-0.5">{a.user?.full_name} · {timeAgo(a.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
