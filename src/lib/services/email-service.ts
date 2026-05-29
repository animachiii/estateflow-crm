import { isDryRun } from '@/lib/utils';
import { createServiceRoleClient } from '@/lib/supabase/server';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  organizationId?: string;
  from?: string;
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
      let apiKey = process.env.RESEND_API_KEY || null;
      let fromEmail = params.from || process.env.RESEND_FROM_EMAIL || null;

      if (params.organizationId && (!apiKey || !fromEmail)) {
        const service = createServiceRoleClient();
        const { data: settings } = await service
          .from('integration_settings')
          .select('resend_api_key, resend_from_email')
          .eq('organization_id', params.organizationId)
          .single();

        apiKey = apiKey || settings?.resend_api_key || null;
        fromEmail = fromEmail || settings?.resend_from_email || null;
      }

      if (!apiKey) {
        return { success: false, messageId: null, dryRun: false, error: 'No email provider configured' };
      }

      if (!fromEmail) {
        return {
          success: false,
          messageId: null,
          dryRun: false,
          error: 'No sender address configured. Add Reminder From Email in Settings or RESEND_FROM_EMAIL in Vercel.',
        };
      }

      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      const formattedFrom = fromEmail.includes('<') ? fromEmail : `EstateFlow CRM <${fromEmail}>`;
      const { data, error } = await resend.emails.send({
        from: formattedFrom,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });

      if (error) {
        return { success: false, messageId: null, dryRun: false, error: error.message || 'Unknown email provider error' };
      }

      return { success: true, messageId: data?.id || null, dryRun: false };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, messageId: null, dryRun: false, error: String(error) };
    }
  },
};
