import { NextResponse, type NextRequest } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { emailService } from '@/lib/services/email-service';

export const dynamic = 'force-dynamic';

const IST_OFFSET_MINUTES = 330;

type DueFollowUpRow = {
  id: string;
  organization_id: string;
  agent_id: string;
  lead_id: string;
  type: string;
  message: string | null;
  scheduled_at: string;
  lead: {
    full_name: string;
    phone: string | null;
    preferred_location: string | null;
  } | null;
  agent: {
    full_name: string;
    email: string | null;
  } | null;
  organization: {
    name: string;
  } | null;
};

function ensureAuthorized(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET) {
    return { ok: false, response: NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 }) };
  }

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { ok: true as const };
}

function startOfIstDay(date: Date) {
  const shifted = new Date(date.getTime() + IST_OFFSET_MINUTES * 60_000);
  const startUtc = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate(), 0, 0, 0, 0);
  return new Date(startUtc - IST_OFFSET_MINUTES * 60_000);
}

function endOfIstDay(date: Date) {
  return new Date(startOfIstDay(date).getTime() + 24 * 60 * 60_000);
}

function formatIst(date: string) {
  return new Date(date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDigestHtml(params: {
  agentName: string;
  orgName: string;
  overdue: DueFollowUpRow[];
  dueToday: DueFollowUpRow[];
  appUrl: string | null;
}) {
  const renderRows = (rows: DueFollowUpRow[]) =>
    rows.map((followUp) => {
      const lead = followUp.lead;
      const detailUrl = params.appUrl ? `${params.appUrl}/leads/${followUp.lead_id}` : null;

      return `
        <tr>
          <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;">
            <div style="font-weight:600;color:#0f172a;">${escapeHtml(lead?.full_name || 'Lead')}</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">
              ${escapeHtml(followUp.type)} · ${escapeHtml(formatIst(followUp.scheduled_at))}
              ${lead?.preferred_location ? ` · ${escapeHtml(lead.preferred_location)}` : ''}
            </div>
            ${lead?.phone ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">${escapeHtml(lead.phone)}</div>` : ''}
            ${followUp.message ? `<div style="font-size:13px;color:#334155;margin-top:8px;">${escapeHtml(followUp.message)}</div>` : ''}
            ${detailUrl ? `<div style="margin-top:8px;"><a href="${detailUrl}" style="color:#4f46e5;text-decoration:none;font-size:12px;font-weight:600;">Open lead</a></div>` : ''}
          </td>
        </tr>
      `;
    }).join('');

  const greetingName = escapeHtml(params.agentName.split(' ')[0] || params.agentName);

  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="padding:24px 24px 18px;background:#eef2ff;border-bottom:1px solid #c7d2fe;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4f46e5;">EstateFlow Reminder</div>
          <h1 style="margin:8px 0 0;font-size:24px;line-height:1.2;">Good morning ${greetingName}</h1>
          <p style="margin:10px 0 0;font-size:14px;color:#475569;">Here is your follow-up queue for ${escapeHtml(params.orgName)}.</p>
        </div>
        <div style="padding:24px;">
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
            <div style="min-width:180px;background:#fff7ed;border:1px solid #fdba74;border-radius:12px;padding:14px 16px;">
              <div style="font-size:12px;color:#9a3412;text-transform:uppercase;font-weight:700;letter-spacing:0.04em;">Overdue</div>
              <div style="font-size:26px;font-weight:700;color:#7c2d12;margin-top:6px;">${params.overdue.length}</div>
            </div>
            <div style="min-width:180px;background:#eff6ff;border:1px solid #93c5fd;border-radius:12px;padding:14px 16px;">
              <div style="font-size:12px;color:#1d4ed8;text-transform:uppercase;font-weight:700;letter-spacing:0.04em;">Due Today</div>
              <div style="font-size:26px;font-weight:700;color:#1e3a8a;margin-top:6px;">${params.dueToday.length}</div>
            </div>
          </div>

          ${params.overdue.length > 0 ? `
            <h2 style="font-size:16px;margin:0 0 10px;">Overdue follow-ups</h2>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:22px;">
              <tbody>${renderRows(params.overdue)}</tbody>
            </table>
          ` : ''}

          ${params.dueToday.length > 0 ? `
            <h2 style="font-size:16px;margin:0 0 10px;">Due today</h2>
            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <tbody>${renderRows(params.dueToday)}</tbody>
            </table>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

export async function GET(request: NextRequest) {
  const auth = ensureAuthorized(request);
  if (!auth.ok) return auth.response;

  const supabase = createServiceRoleClient();
  const now = new Date();
  const start = startOfIstDay(now);
  const end = endOfIstDay(now);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || null;

  const { data: dueFollowUps, error } = await supabase
    .from('followups')
    .select('id, organization_id, agent_id, lead_id, type, message, scheduled_at, lead:leads(full_name, phone, preferred_location), agent:profiles(full_name, email), organization:organizations(name)')
    .eq('status', 'pending')
    .lt('scheduled_at', end.toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const grouped = new Map<string, DueFollowUpRow[]>();
  for (const followUp of (dueFollowUps || []) as DueFollowUpRow[]) {
    const key = `${followUp.organization_id}:${followUp.agent_id}`;
    const rows = grouped.get(key) || [];
    rows.push(followUp);
    grouped.set(key, rows);
  }

  const sent: Array<{ agent: string; email: string; count: number }> = [];
  const skipped: Array<{ agentId: string; reason: string; count: number }> = [];

  for (const [groupKey, rows] of grouped) {
    const [organizationId, agentId] = groupKey.split(':');
    const agent = rows[0]?.agent;
    const orgName = rows[0]?.organization?.name || 'EstateFlow CRM';

    const { count: existingDigestCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', agentId)
      .eq('type', 'email_followup_digest')
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());

    if ((existingDigestCount || 0) > 0) {
      skipped.push({ agentId, reason: 'already sent today', count: rows.length });
      continue;
    }

    if (!agent?.email) {
      skipped.push({ agentId, reason: 'agent has no email', count: rows.length });
      continue;
    }

    const overdue = rows.filter((row) => new Date(row.scheduled_at) < now);
    const dueToday = rows.filter((row) => new Date(row.scheduled_at) >= now);
    const subject = `Follow-up reminders for ${agent.full_name.split(' ')[0]} - ${rows.length} due item${rows.length === 1 ? '' : 's'}`;
    const html = buildDigestHtml({
      agentName: agent.full_name,
      orgName,
      overdue,
      dueToday,
      appUrl,
    });

    const emailResult = await emailService.send({
      to: agent.email,
      subject,
      html,
      organizationId,
    });

    if (!emailResult.success) {
      skipped.push({ agentId, reason: emailResult.error || 'email send failed', count: rows.length });
      continue;
    }

    const sentAt = new Date().toISOString();
    await supabase.from('notifications').insert({
      organization_id: organizationId,
      user_id: agentId,
      title: 'Daily follow-up reminder emailed',
      message: `${rows.length} follow-up reminder${rows.length === 1 ? '' : 's'} were emailed to you.`,
      type: 'email_followup_digest',
      read: true,
      metadata: {
        count: rows.length,
        delivery: emailResult.dryRun ? 'dry_run' : 'email',
        sent_at: sentAt,
      },
    });

    sent.push({ agent: agent.full_name, email: agent.email, count: rows.length });
  }

  return NextResponse.json({
    success: true,
    window: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    totalGroups: grouped.size,
    sent,
    skipped,
  });
}
