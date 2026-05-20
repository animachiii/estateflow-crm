import { isDryRun } from '@/lib/utils';

interface BridgeCallParams {
  agentPhone: string;
  leadPhone: string;
  leadName: string;
  source: string;
  callbackUrl: string;
  organizationId: string;
  // Exotel credentials — read from org's integration_settings, fall back to env vars
  exotelApiKey?: string;
  exotelApiToken?: string;
  exotelAccountSid?: string;
  exotelCallerId?: string;
  exotelSubdomain?: string;
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
      console.log('[DRY RUN] Bridge call (Exotel):', params);
      return {
        success: true,
        callSid: `dry_call_${Date.now()}`,
        conferenceSid: null,
        dryRun: true,
      };
    }

    try {
      // Prefer DB-stored credentials (per-org), fall back to env vars
      const apiKey = params.exotelApiKey || process.env.EXOTEL_API_KEY;
      const apiToken = params.exotelApiToken || process.env.EXOTEL_API_TOKEN;
      const accountSid = params.exotelAccountSid || process.env.EXOTEL_ACCOUNT_SID;
      const callerId = params.exotelCallerId || process.env.EXOTEL_CALLER_ID;
      const subdomain = params.exotelSubdomain || process.env.EXOTEL_SUBDOMAIN || 'api.in.exotel.com';

      if (!apiKey || !apiToken || !accountSid || !callerId) {
        console.error('Exotel credentials missing — set them in Settings');
        return { success: false, callSid: null, conferenceSid: null, dryRun: false, error: 'Exotel credentials not configured. Go to Settings → Integrations.' };
      }

      const url = `https://${subdomain}/v1/Accounts/${accountSid}/Calls/connect.json`;
      const auth = Buffer.from(`${apiKey}:${apiToken}`).toString('base64');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: params.agentPhone,
          To: params.leadPhone,
          CallerId: callerId,
          StatusCallback: `${params.callbackUrl}/api/calls/status`,
          Record: 'true',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Exotel bridge call failed:', errorText);
        return {
          success: false,
          callSid: null,
          conferenceSid: null,
          dryRun: false,
          error: `Exotel error (${response.status}): ${errorText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        callSid: data.Call?.Sid || null,
        conferenceSid: null,
        dryRun: false,
      };
    } catch (error: unknown) {
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
    const apiKey = process.env.EXOTEL_API_KEY;
    const apiToken = process.env.EXOTEL_API_TOKEN;
    const accountSid = process.env.EXOTEL_ACCOUNT_SID;
    const subdomain = process.env.EXOTEL_SUBDOMAIN || 'api.in.exotel.com';

    if (!apiKey || !apiToken || !accountSid) {
      return { status: 'failed', duration: 0, dryRun: false, error: 'Exotel credentials missing' };
    }

    const url = `https://${subdomain}/v1/Accounts/${accountSid}/Calls/${callSid}.json`;
    const auth = Buffer.from(`${apiKey}:${apiToken}`).toString('base64');
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      return { status: 'failed', duration: 0, dryRun: false };
    }

    const data = await response.json();
    return {
      status: data.Call?.Status || 'unknown',
      duration: data.Call?.Duration ? parseInt(data.Call.Duration) : null,
      dryRun: false,
    };
  },
};
