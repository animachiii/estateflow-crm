import { isDryRun } from '@/lib/utils';

interface BridgeCallParams {
  agentPhone: string;
  leadPhone: string;
  leadName: string;
  source: string;
  callbackUrl: string;
  organizationId: string;
}

interface CallResult {
  success: boolean;
  callSid: string | null;
  conferenceSid: string | null;
  dryRun: boolean;
  error?: string;
}

export const callService = {
  async bridgeCall(params: BridgeCallParams): Promise<CallResult> {
    if (isDryRun()) {
      console.log('[DRY RUN] Bridge call:', params);
      return {
        success: true,
        callSid: `dry_call_${Date.now()}`,
        conferenceSid: `dry_conf_${Date.now()}`,
        dryRun: true,
      };
    }

    try {
      const twilio = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const conferenceName = `lead_${Date.now()}`;

      // Step 1: Call the agent first
      const agentCall = await twilio.calls.create({
        to: params.agentPhone,
        from: process.env.TWILIO_PHONE_NUMBER,
        twiml: `<Response>
          <Gather numDigits="1" action="${params.callbackUrl}/api/calls/bridge?lead_phone=${encodeURIComponent(params.leadPhone)}&conference=${conferenceName}">
            <Say>New real estate lead from ${params.source}. Press any key to connect with ${params.leadName}.</Say>
          </Gather>
          <Say>No input received. Goodbye.</Say>
        </Response>`,
      });

      return {
        success: true,
        callSid: agentCall.sid,
        conferenceSid: conferenceName,
        dryRun: false,
      };
    } catch (error) {
      console.error('Bridge call error:', error);
      return {
        success: false,
        callSid: null,
        conferenceSid: null,
        dryRun: false,
        error: String(error),
      };
    }
  },

  async getCallStatus(callSid: string) {
    if (isDryRun()) {
      return { status: 'completed', duration: 120, dryRun: true };
    }
    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    const call = await twilio.calls(callSid).fetch();
    return { status: call.status, duration: call.duration, dryRun: false };
  },
};
