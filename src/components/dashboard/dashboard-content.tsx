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
  { key: 'newLeadsToday', label: 'New Leads', icon: Users, color: 'text-blue-600 bg-blue-50', href: '/leads' },
  { key: 'callsToday', label: 'Calls Today', icon: Phone, color: 'text-green-600 bg-green-50', href: '/leads' },
  { key: 'dueFollowUps', label: 'Due Follow-ups', icon: Clock, color: 'text-orange-600 bg-orange-50', href: '/followups' },
  { key: 'hotLeads', label: 'Hot Leads', icon: Flame, color: 'text-red-600 bg-red-50', href: '/leads?temperature=hot' },
  { key: 'availableProperties', label: 'Inventory', icon: Building2, color: 'text-purple-600 bg-purple-50', href: '/properties' },
  { key: 'checkedIn', label: 'Checked In', icon: UserCheck, color: 'text-teal-600 bg-teal-50', href: '/attendance' },
] as const;

export function DashboardContent({ stats, dueFollowUps, hotLeads, recentActivities, profile }: DashboardProps) {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Hi, {profile.full_name.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500">Here&apos;s your CRM overview</p>
        </div>
        <Link href="/leads/new">
          <Button size="sm"><Plus className="h-4 w-4" /> Add Lead</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {statCards.map(({ key, label, icon: Icon, color, href }) => (
          <Link key={key} href={href}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats[key]}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
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
              <div className="space-y-3">
                {dueFollowUps.map((f: any) => (
                  <Link key={f.id} href={`/leads/${f.lead_id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{f.lead?.full_name}</p>
                      <p className="text-xs text-gray-500">{f.type} · {timeAgo(f.scheduled_at)}</p>
                    </div>
                    <PhoneCall className="h-4 w-4 text-gray-400" />
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
              <div className="space-y-3">
                {hotLeads.map((lead: any) => (
                  <Link key={lead.id} href={`/leads/${lead.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lead.full_name}</p>
                      <p className="text-xs text-gray-500">{formatPhone(lead.phone)}</p>
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
            <div className="space-y-3">
              {recentActivities.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900">{a.title}</p>
                    {a.description && <p className="text-gray-500 text-xs truncate">{a.description}</p>}
                    <p className="text-gray-400 text-xs">{a.user?.full_name} · {timeAgo(a.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
