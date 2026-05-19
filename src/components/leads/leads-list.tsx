'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Phone, MessageSquare, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Users } from 'lucide-react';
import { cn, LEAD_STATUS_COLORS, TEMP_COLORS, STATUS_LABELS, SOURCE_LABELS, formatPhone, timeAgo } from '@/lib/utils';
import { useState } from 'react';

interface LeadsListProps {
  leads: any[];
  agents: { id: string; full_name: string }[];
  filters: { status: string; source: string; temperature: string; agent: string; q: string };
}

export function LeadsList({ leads, agents, filters }: LeadsListProps) {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(filters.q);

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/leads?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilter('q', search);
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Leads</h1>
        <Link href="/leads/new">
          <Button size="sm"><Plus className="h-4 w-4" /> Add</Button>
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search leads..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="button" variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4" />
        </Button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Select value={filters.status} onChange={(e) => applyFilter('status', e.target.value)}>
            <option value="">All Status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select value={filters.source} onChange={(e) => applyFilter('source', e.target.value)}>
            <option value="">All Sources</option>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Select value={filters.temperature} onChange={(e) => applyFilter('temperature', e.target.value)}>
            <option value="">All Temp</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </Select>
          <Select value={filters.agent} onChange={(e) => applyFilter('agent', e.target.value)}>
            <option value="">All Agents</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
          </Select>
        </div>
      )}

      {/* Lead Cards */}
      {leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No leads found"
          description="Add your first lead or adjust filters"
          action={<Link href="/leads/new"><Button size="sm">Add Lead</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Link key={lead.id} href={`/leads/${lead.id}`}>
              <Card className="hover:shadow-md transition-shadow mb-3">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{lead.full_name}</h3>
                        <Badge className={cn('text-[10px]', TEMP_COLORS[lead.temperature])}>{lead.temperature}</Badge>
                      </div>
                      <p className="text-xs text-gray-500">{formatPhone(lead.phone)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={cn('text-[10px]', LEAD_STATUS_COLORS[lead.status])}>
                          {STATUS_LABELS[lead.status] || lead.status}
                        </Badge>
                        <span className="text-[10px] text-gray-400">{SOURCE_LABELS[lead.source] || lead.source}</span>
                        {lead.preferred_location && (
                          <span className="text-[10px] text-gray-400">· {lead.preferred_location}</span>
                        )}
                      </div>
                      {lead.assigned_agent && (
                        <p className="text-[10px] text-gray-400 mt-1">Agent: {lead.assigned_agent.full_name}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-gray-400">{timeAgo(lead.created_at)}</span>
                      <div className="flex gap-1">
                        <button
                          className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                          onClick={(e) => { e.preventDefault(); window.open(`tel:${lead.phone}`); }}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          onClick={(e) => { e.preventDefault(); window.open(`https://wa.me/${lead.phone.replace('+', '')}`); }}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
