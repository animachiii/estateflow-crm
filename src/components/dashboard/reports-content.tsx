'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SOURCE_LABELS, STATUS_LABELS, LEAD_STATUS_COLORS } from '@/lib/utils';

interface Props {
  leads: any[];
  calls: any[];
  followups: any[];
  agents: { id: string; full_name: string }[];
}

export function ReportsContent({ leads, calls, followups, agents }: Props) {
  const sourceCount = leads.reduce((acc: Record<string, number>, l) => {
    acc[l.source] = (acc[l.source] || 0) + 1;
    return acc;
  }, {});

  const statusCount = leads.reduce((acc: Record<string, number>, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  const agentLeadCount = leads.reduce((acc: Record<string, number>, l) => {
    if (l.assigned_agent_id) acc[l.assigned_agent_id] = (acc[l.assigned_agent_id] || 0) + 1;
    return acc;
  }, {});

  const agentCallCount = calls.reduce((acc: Record<string, number>, c) => {
    acc[c.agent_id] = (acc[c.agent_id] || 0) + 1;
    return acc;
  }, {});

  const wonCount = leads.filter(l => l.status === 'won').length;
  const lostCount = leads.filter(l => l.status === 'lost').length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Reports</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leads by Source */}
        <Card>
          <CardHeader><CardTitle>Leads by Source</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(sourceCount).sort((a, b) => b[1] - a[1]).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{SOURCE_LABELS[source] || source}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / leads.length) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leads by Status */}
        <Card>
          <CardHeader><CardTitle>Leads by Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(statusCount).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge className={LEAD_STATUS_COLORS[status]}>{STATUS_LABELS[status] || status}</Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agent Performance */}
        <Card>
          <CardHeader><CardTitle>Agent Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents.map(agent => (
                <div key={agent.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">{agent.full_name}</span>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>{agentLeadCount[agent.id] || 0} leads</span>
                    <span>{agentCallCount[agent.id] || 0} calls</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Win/Loss */}
        <Card>
          <CardHeader><CardTitle>Conversion</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-bold text-green-700">{wonCount}</p>
                <p className="text-sm text-green-600">Won</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl">
                <p className="text-3xl font-bold text-red-700">{lostCount}</p>
                <p className="text-sm text-red-600">Lost</p>
              </div>
            </div>
            {leads.length > 0 && (
              <p className="text-center text-sm text-gray-500 mt-3">
                Win rate: {((wonCount / Math.max(wonCount + lostCount, 1)) * 100).toFixed(1)}%
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
