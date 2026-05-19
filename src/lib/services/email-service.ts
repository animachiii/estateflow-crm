import { isDryRun } from '@/lib/utils';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

interface EmailResult {
  success: boolean;
  messageId: string | null;
  dryRun: boolean;
  error?: string;
}

export const emailService = {
  async send(params: SendEmailParams): Promise<EmailResult> {
    if (isDryRun()) {
      console.log(`[DRY RUN] Email to ${params.to}: ${params.subject}`);
      return { success: true, messageId: `dry_email_${Date.now()}`, dryRun: true };
    }

    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data } = await resend.emails.send({
          from: 'EstateFlow CRM <noreply@estateflow.com>',
          to: params.to,
          subject: params.subject,
          html: params.html,
        });
        return { success: true, messageId: data?.id || null, dryRun: false };
      }
      return { success: false, messageId: null, dryRun: false, error: 'No email provider configured' };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, messageId: null, dryRun: false, error: String(error) };
    }
  },
};
