import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

function normalizeOutcome(status: string) {
  switch (status) {
    case 'completed':
      return 'connected';
    case 'no-answer':
      return 'no_answer';
    case 'busy':
      return 'busy';
    default:
      return null;
  }
}

export async function POST(request: Request) {
  let callSid = '';
  let callStatus = '';
  let callDuration = '';
  let recordingUrl = '';

  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await request.json();
    callSid = json.CallSid || json.Sid || '';
    callStatus = json.Status || json.CallStatus || '';
    callDuration = json.ConversationDuration || json.Duration || json.CallDuration || '';
    recordingUrl = json.RecordingUrl || '';
  } else {
    try {
      const formData = await request.formData();
      callSid = (formData.get('CallSid') || formData.get('Sid') || '') as string;
      callStatus = (formData.get('Status') || formData.get('CallStatus') || '') as string;
      callDuration = (formData.get('ConversationDuration') || formData.get('Duration') || formData.get('CallDuration') || '') as string;
      recordingUrl = (formData.get('RecordingUrl') || '') as string;
    } catch {
      // Fallback to URL search parameters if parsing fails
      const url = new URL(request.url);
      callSid = url.searchParams.get('CallSid') || url.searchParams.get('Sid') || '';
      callStatus = url.searchParams.get('Status') || url.searchParams.get('CallStatus') || '';
      callDuration = url.searchParams.get('ConversationDuration') || url.searchParams.get('Duration') || url.searchParams.get('CallDuration') || '';
      recordingUrl = url.searchParams.get('RecordingUrl') || '';
    }
  }

  if (!callSid) {
    return NextResponse.json({ error: 'Missing CallSid' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const normalizedStatus = callStatus.trim().toLowerCase();
  const terminal = ['completed', 'failed', 'busy', 'no-answer', 'terminated'].includes(normalizedStatus);

  await supabase.from('calls').update({
    status: normalizedStatus || callStatus,
    duration: callDuration ? parseInt(callDuration) : null,
    recording_url: recordingUrl || null,
    outcome: normalizeOutcome(normalizedStatus),
    ended_at: terminal ? new Date().toISOString() : null,
  }).eq('call_sid', callSid);

  return NextResponse.json({ success: true });
}
