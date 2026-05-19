import { createServiceRoleClient } from '@/lib/supabase/server';

export const leadAssignmentService = {
  async assignAgent(organizationId: string, mode: string = 'round_robin'): Promise<string | null> {
    const supabase = createServiceRoleClient();

    const { data: agents } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('role', 'sales_agent')
      .eq('is_active', true)
      .order('created_at');

    if (!agents?.length) return null;

    if (mode === 'round_robin') {
      const { data: lastLead } = await supabase
        .from('leads')
        .select('assigned_agent_id')
        .eq('organization_id', organizationId)
        .not('assigned_agent_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastLead?.assigned_agent_id) return agents[0].id;

      const lastIdx = agents.findIndex((a: { id: string }) => a.id === lastLead.assigned_agent_id);
      const nextIdx = (lastIdx + 1) % agents.length;
      return agents[nextIdx].id;
    }

    if (mode === 'least_busy') {
      const agentIds = agents.map((a: { id: string }) => a.id);
      const { data: counts } = await supabase
        .from('leads')
        .select('assigned_agent_id')
        .in('assigned_agent_id', agentIds)
        .in('status', ['new', 'contacted', 'interested', 'site_visit_scheduled', 'negotiation']);

      const countMap: Record<string, number> = {};
      agentIds.forEach((id: string) => { countMap[id] = 0; });
      counts?.forEach((l: { assigned_agent_id: string }) => {
        if (l.assigned_agent_id) countMap[l.assigned_agent_id]++;
      });

      const sorted = Object.entries(countMap).sort((a, b) => a[1] - b[1]);
      return sorted[0][0];
    }

    return null; // manual mode
  },
};
