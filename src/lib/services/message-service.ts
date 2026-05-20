import { isDryRun } from '@/lib/utils';
import { createServiceRoleClient } from '@/lib/supabase/server';

interface SendMessageParams {
  to: string;
  body: string;
  channel: 'whatsapp' | 'sms';
  organizationId?: string;
}

interface MessageResult {
  success: boolean;
  messageSid: string | null;
  dryRun: boolean;
  error?: string;
}

export const messageService = {
  async send(params: SendMessageParams): Promise<MessageResult> {
    if (isDryRun()) {
      console.log(`[DRY RUN] ${params.channel} (Exotel) to ${params.to}: ${params.body}`);
      return { success: true, messageSid: `dry_msg_${Date.now()}`, dryRun: true };
    }

    try {
      // 1. Fetch credentials per-org or environment
      let apiKey = process.env.EXOTEL_API_KEY;
      let apiToken = process.env.EXOTEL_API_TOKEN;
      let accountSid = process.env.EXOTEL_ACCOUNT_SID;
      let callerId = process.env.EXOTEL_CALLER_ID;
      let subdomain = process.env.EXOTEL_SUBDOMAIN || 'api.in.exotel.com';
      let whatsappSender = process.env.WHATSAPP_SENDER_NUMBER;
      let dltEntityId = process.env.EXOTEL_DLT_ENTITY_ID;
      let dltTemplateId = process.env.EXOTEL_DLT_TEMPLATE_ID;

      if (params.organizationId) {
        try {
          const supabase = createServiceRoleClient();
          const { data: settings } = await supabase
            .from('integration_settings')
            .select('exotel_api_key, exotel_api_token, exotel_account_sid, exotel_caller_id, exotel_subdomain, exotel_dlt_entity_id, exotel_dlt_template_id, whatsapp_sender_number')
            .eq('organization_id', params.organizationId)
            .single();

          if (settings) {
            if (settings.exotel_api_key) apiKey = settings.exotel_api_key;
            if (settings.exotel_api_token) apiToken = settings.exotel_api_token;
            if (settings.exotel_account_sid) accountSid = settings.exotel_account_sid;
            if (settings.exotel_caller_id) callerId = settings.exotel_caller_id;
            if (settings.exotel_subdomain) subdomain = settings.exotel_subdomain;
            if (settings.whatsapp_sender_number) whatsappSender = settings.whatsapp_sender_number;
            if (settings.exotel_dlt_entity_id) dltEntityId = settings.exotel_dlt_entity_id;
            if (settings.exotel_dlt_template_id) dltTemplateId = settings.exotel_dlt_template_id;
          }
        } catch (dbErr) {
          console.error('Failed to load message integration settings from DB:', dbErr);
        }
      }

      if (!apiKey || !apiToken || !accountSid) {
        return { success: false, messageSid: null, dryRun: false, error: 'Exotel credentials not configured' };
      }

      const auth = Buffer.from(`${apiKey}:${apiToken}`).toString('base64');

      if (params.channel === 'sms') {
        if (!callerId) {
          return { success: false, messageSid: null, dryRun: false, error: 'Exotel Caller ID (ExoPhone) not configured' };
        }

        const url = `https://${subdomain}/v1/Accounts/${accountSid}/Sms/send.json`;
        const bodyParams: Record<string, string> = {
          From: callerId,
          To: params.to,
          Body: params.body,
        };

        if (dltEntityId) bodyParams.DltEntityId = dltEntityId;
        if (dltTemplateId) bodyParams.DltTemplateId = dltTemplateId;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(bodyParams),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Exotel SMS sending failed:', errorText);
          return { success: false, messageSid: null, dryRun: false, error: `Exotel SMS error (${response.status}): ${errorText}` };
        }

        const data = await response.json();
        const messageSid = data.TwilioResponse?.SMSMessage?.Sid || null;
        return { success: true, messageSid, dryRun: false };

      } else {
        // channel === 'whatsapp'
        if (!whatsappSender) {
          return { success: false, messageSid: null, dryRun: false, error: 'WhatsApp sender number not configured' };
        }

        const url = `https://${subdomain}/v2/accounts/${accountSid}/messages`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            whatsapp: {
              from: whatsappSender,
              to: params.to,
              message: {
                type: 'text',
                text: {
                  body: params.body,
                },
              },
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Exotel WhatsApp sending failed:', errorText);
          return { success: false, messageSid: null, dryRun: false, error: `Exotel WhatsApp error (${response.status}): ${errorText}` };
        }

        const data = await response.json();
        const messageSid = data.metadata?.message_id || data.request_id || null;
        return { success: true, messageSid, dryRun: false };
      }
    } catch (error) {
      console.error('Message send error:', error);
      return { success: false, messageSid: null, dryRun: false, error: String(error) };
    }
  },

  fillTemplate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
  },
};
