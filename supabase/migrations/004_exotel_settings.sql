-- Add Exotel configuration columns to integration_settings table
alter table integration_settings
  add column if not exists exotel_api_key text,
  add column if not exists exotel_api_token text,
  add column if not exists exotel_account_sid text,
  add column if not exists exotel_caller_id text,
  add column if not exists exotel_subdomain text default 'api.in.exotel.com',
  add column if not exists exotel_dlt_entity_id text,
  add column if not exists exotel_dlt_template_id text;
