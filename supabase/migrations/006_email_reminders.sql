-- Email reminder configuration and follow-up reminder tracking

alter table integration_settings
  add column if not exists resend_from_email text;
