import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { webhookLeadSchema } from '@/lib/validators/lead';
import { leadAssignmentService } from '@/lib/services/lead-assignment-service';
import { callService } from '@/lib/services/call-service';
import crypto from 'crypto';

function verifyWebhookSecret(request: Request, body: string): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || secret === 'dev-secret') return true;

  const signature = request.headers.get('x-webhook-signature');
  if (!signature) return false;

  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

const sourceMap: Record<string, string> = {
  '36 Acre': '36_acre',
  '36_acre': '36_acre',
  '36acre': '36_acre',
  magicbricks: 'magicbricks',
  'housing.com': 'housing',
  housing: 'housing',
  facebook: 'facebook',
  instagram: 'instagram',
  website: 'website',
  referral: 'referral',
};

export async function POST(request: Request) {
  const bodyText = await request.text();

  if (!verifyWebhookSecret(request, bodyText)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = webhookLeadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Get the first organization (multi-tenant: use API key to determine org)
  const { data: org } = await supabase.from('organizations').select('id').limit(1).single();
  if (!org) {
    return NextResponse.json({ error: 'No organization found' }, { status: 500 });
  }

  // Get assignment mode
  const { data: settings } = await supabase
    .from('integration_settings')
    .select('lead_assignment_mode')
    .eq('organization_id', org.id)
    .single();

  const mode = settings?.lead_assignment_mode || 'round_robin';
  const agentId = await leadAssignmentService.assignAgent(org.id, mode);

  const normalizedSource = sourceMap[parsed.data.source.toLowerCase()] || 'other';

  const { data: lead, error } = await supabase.from('leads').insert({
    organization_id: org.id,
    full_name: parsed.data.fullName,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    source: normalizedSource,
    property_type: parsed.data.propertyType?.toLowerCase() || null,
    budget_min: parsed.data.budgetMin || null,
    budget_max: parsed.data.budgetMax || null,
    preferred_location: parsed.data.preferredLocation || null,
    notes: parsed.data.notes || null,
    status: 'new',
    temperature: 'warm',
    assigned_agent_id: agentId,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  if (agentId) {
    await supabase.from('activities').insert({
      organization_id: org.id,
      lead_id: lead.id,
      user_id: agentId,
      type: 'assignment',
      title: `New lead from ${normalizedSource} — auto-assigned`,
    });

    // Notify agent
    await supabase.from('notifications').insert({
      organization_id: org.id,
      user_id: agentId,
      title: 'New Lead Assigned',
      message: `${lead.full_name} from ${normalizedSource}`,
      type: 'lead_assigned',
      metadata: { lead_id: lead.id },
    });

    // Trigger bridge call
    const { data: agent } = await supabase.from('profiles').select('phone').eq('id', agentId).single();
    if (agent?.phone) {
      const callResult = await callService.bridgeCall({
        agentPhone: agent.phone,
        leadPhone: lead.phone,
        leadName: lead.full_name,
        source: normalizedSource,
        callbackUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        organizationId: org.id,
      });

      await supabase.from('calls').insert({
        organization_id: org.id,
        lead_id: lead.id,
        agent_id: agentId,
        call_sid: callResult.callSid,
        conference_sid: callResult.conferenceSid,
        status: callResult.success ? 'initiated' : 'failed',
      });

      await supabase.from('activities').insert({
        organization_id: org.id,
        lead_id: lead.id,
        user_id: agentId,
        type: 'call',
        title: callResult.dryRun ? 'Bridge call simulated (dry-run)' : 'Bridge call initiated',
      });
    }
  }

  return NextResponse.json({
    success: true,
    leadId: lead.id,
    assignedAgent: agentId,
  }, { status: 201 });
}
