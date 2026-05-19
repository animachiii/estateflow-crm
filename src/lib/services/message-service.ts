import { isDryRun } from '@/lib/utils';

interface SendMessageParams {
  to: string;
  body: string;
  channel: 'whatsapp' | 'sms';
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
      console.log(`[DRY RUN] ${params.channel} to ${params.to}: ${params.body}`);
      return { success: true, messageSid: `dry_msg_${Date.now()}`, dryRun: true };
    }

    try {
      const twilio = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const from = params.channel === 'whatsapp'
        ? `whatsapp:${process.env.WHATSAPP_SENDER_NUMBER}`
        : process.env.TWILIO_PHONE_NUMBER;

      const to = params.channel === 'whatsapp'
        ? `whatsapp:${params.to}`
        : params.to;

      const message = await twilio.messages.create({
        body: params.body,
        from,
        to,
      });

      return { success: true, messageSid: message.sid, dryRun: false };
    } catch (error) {
      console.error('Message send error:', error);
      return { success: false, messageSid: null, dryRun: false, error: String(error) };
    }
  },

  fillTemplate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
  },
};
