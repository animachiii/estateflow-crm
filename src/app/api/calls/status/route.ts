import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const callSid = formData.get('CallSid') as string;
  const callStatus = formData.get('CallStatus') as string;
  const callDuration = formData.get('CallDuration') as string;
  const recordingUrl = formData.get('RecordingUrl') as string;

  if (!callSid) {
    return NextResponse.json({ error: 'Missing CallSid' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  await supabase.from('calls').update({
    status: callStatus,
    duration: callDuration ? parseInt(callDuration) : null,
    recording_url: recordingUrl || null,
    ended_at: callStatus === 'completed' ? new Date().toISOString() : null,
  }).eq('call_sid', callSid);

  return NextResponse.json({ success: true });
}
