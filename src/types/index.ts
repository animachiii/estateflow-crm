export type UserRole = 'admin' | 'sales_manager' | 'sales_agent' | 'field_executive' | 'social_media_manager';

export type LeadSource = '36_acre' | 'magicbricks' | 'housing' | 'facebook' | 'instagram' | 'website' | 'referral' | 'manual' | 'other';

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'site_visit_scheduled' | 'negotiation' | 'won' | 'lost' | 'not_responding';

export type LeadTemperature = 'cold' | 'warm' | 'hot';

export type PropertyType = 'apartment' | 'villa' | 'plot' | 'commercial' | 'rental';

export type PropertyAvailability = 'available' | 'hold' | 'sold' | 'rented';

export type FurnishingStatus = 'unfurnished' | 'semi_furnished' | 'fully_furnished';

export type FollowUpType = 'whatsapp' | 'sms' | 'email' | 'call';

export type FollowUpStatus = 'pending' | 'completed' | 'snoozed' | 'cancelled';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day' | 'on_leave';

export type SocialPostType = 'instagram_reel' | 'instagram_post' | 'facebook_post' | 'linkedin_post' | 'story';

export type SocialPostStatus = 'idea' | 'draft' | 'scheduled' | 'published';

export type CallOutcome = 'connected' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number' | 'callback_requested' | 'not_interested';

export type ActivityType = 'call' | 'message' | 'note' | 'follow_up' | 'property_share' | 'status_change' | 'assignment' | 'site_visit';

export type AssignmentMode = 'round_robin' | 'manual' | 'least_busy';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  organization_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  organization_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  source: LeadSource;
  property_type: PropertyType | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  status: LeadStatus;
  temperature: LeadTemperature;
  assigned_agent_id: string | null;
  assigned_agent?: Profile;
  notes: string | null;
  next_follow_up: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  organization_id: string;
  project_id: string | null;
  title: string;
  location: string;
  address: string | null;
  property_type: PropertyType;
  price: number;
  size_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  furnishing: FurnishingStatus | null;
  availability: PropertyAvailability;
  description: string | null;
  amenities: string[];
  owner_name: string | null;
  owner_phone: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  images?: PropertyImage[];
  project?: Project | null;
}

export interface Project {
  id: string;
  organization_id: string | null;
  name: string;
  builder_name: string | null;
  city: string;
  locality: string;
  micro_market: string | null;
  indicative_price_min: number | null;
  indicative_price_max: number | null;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  caption: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface PropertyDocument {
  id: string;
  property_id: string;
  name: string;
  url: string;
  file_type: string;
  created_at: string;
}

export interface CallLog {
  id: string;
  organization_id: string;
  lead_id: string;
  agent_id: string;
  call_sid: string | null;
  conference_sid: string | null;
  status: string;
  duration: number | null;
  recording_url: string | null;
  outcome: CallOutcome | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  lead?: Lead;
  agent?: Profile;
}

export interface Activity {
  id: string;
  organization_id: string;
  lead_id: string | null;
  user_id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user?: Profile;
}

export interface FollowUp {
  id: string;
  organization_id: string;
  lead_id: string;
  agent_id: string;
  type: FollowUpType;
  status: FollowUpStatus;
  scheduled_at: string;
  completed_at: string | null;
  template_id: string | null;
  message: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lead?: Lead;
  agent?: Profile;
}

export interface Attendance {
  id: string;
  organization_id: string;
  user_id: string;
  check_in_time: string;
  check_out_time: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  status: AttendanceStatus;
  selfie_url: string | null;
  notes: string | null;
  created_at: string;
  user?: Profile;
}

export interface SocialPost {
  id: string;
  organization_id: string;
  post_type: SocialPostType;
  caption: string;
  media_urls: string[];
  status: SocialPostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assignee?: Profile;
}

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface IntegrationSettings {
  id: string;
  organization_id: string;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  twilio_phone_number: string | null;
  exotel_api_key: string | null;
  exotel_api_token: string | null;
  exotel_account_sid: string | null;
  exotel_caller_id: string | null;
  exotel_subdomain: string | null;
  exotel_dlt_entity_id: string | null;
  exotel_dlt_template_id: string | null;
  whatsapp_sender_number: string | null;
  resend_api_key: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_pass: string | null;
  openai_api_key: string | null;
  webhook_secret: string | null;
  lead_assignment_mode: AssignmentMode;
  created_at: string;
  updated_at: string;
}

export interface FollowUpTemplate {
  id: string;
  organization_id: string;
  name: string;
  type: FollowUpType;
  message: string;
  is_default: boolean;
  created_at: string;
}

export interface LeadPropertyShare {
  id: string;
  lead_id: string;
  property_id: string;
  shared_by: string;
  share_link: string | null;
  channel: 'whatsapp' | 'sms' | 'email' | 'link';
  created_at: string;
  property?: Property;
}
