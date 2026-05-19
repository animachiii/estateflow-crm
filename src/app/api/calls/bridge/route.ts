import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const leadPhone = url.searchParams.get('lead_phone');
  const conferenceName = url.searchParams.get('conference');

  if (!leadPhone || !conferenceName) {
    return new Response('<Response><Say>Error: missing parameters.</Say></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Agent pressed a key — connect them to conference, then dial the lead
  const twiml = `<Response>
    <Say>Connecting you now.</Say>
    <Dial>
      <Conference startConferenceOnEnter="true" endConferenceOnExit="true">
        ${conferenceName}
      </Conference>
    </Dial>
  </Response>`;

  // Also need to call the lead and add them to the same conference
  // In production, this would be done via Twilio REST API
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      await twilio.calls.create({
        to: leadPhone,
        from: process.env.TWILIO_PHONE_NUMBER,
        twiml: `<Response>
          <Say>Hello, you are being connected with a real estate consultant.</Say>
          <Dial>
            <Conference>${conferenceName}</Conference>
          </Dial>
        </Response>`,
      });
    } catch (error) {
      console.error('Failed to call lead:', error);
    }
  }

  return new Response(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
