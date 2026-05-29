import { formatCurrency } from '../utils';
import type { Activity, FollowUpType, LeadStatus } from '../../types';

export type FollowUpTemplateKey =
  | 'intro_after_missed_call'
  | 'intro_after_connected_call'
  | 'property_share'
  | 'property_check_in'
  | 'site_visit_confirmation'
  | 'site_visit_reminder'
  | 'post_visit_feedback'
  | 'negotiation_recap'
  | 'dormant_reactivation';

export type PlaybookChannel = 'call' | 'whatsapp' | 'share_property' | 'status' | 'none';

export interface FollowUpPlaybookTemplate {
  key: FollowUpTemplateKey;
  group: string;
  name: string;
  type: FollowUpType;
  message: string;
}

export interface PlaybookLead {
  id: string;
  full_name: string;
  phone: string;
  status: LeadStatus;
  temperature?: string | null;
  preferred_location?: string | null;
  property_type?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  last_contacted_at?: string | null;
  next_follow_up?: string | null;
}

export interface PlaybookFollowUp {
  id: string;
  type: FollowUpType;
  status: string;
  scheduled_at: string;
  message?: string | null;
}

export interface PlaybookShare {
  id: string;
  property_id: string;
  channel: string;
  created_at: string;
  property?: {
    title?: string | null;
    location?: string | null;
    price?: number | null;
  } | null;
}

export interface FollowUpRecommendation {
  id:
    | 'closed'
    | 'due_follow_up'
    | 'new_lead_call'
    | 'missed_call_recover'
    | 'connected_call_whatsapp'
    | 'whatsapp_reply_qualify'
    | 'share_matching_properties'
    | 'property_check_in'
    | 'site_visit_confirmation'
    | 'site_visit_reminder'
    | 'post_visit_feedback'
    | 'negotiation_recap'
    | 'mark_not_responding'
    | 'dormant_reactivation'
    | 'general_check_in';
  title: string;
  description: string;
  primaryChannel: PlaybookChannel;
  primaryLabel: string;
  templateKey?: FollowUpTemplateKey;
  nextStatus?: LeadStatus;
  suggestedFollowUp?: {
    type: FollowUpType;
    scheduledAt: string;
    message: string;
    label: string;
  };
  reasons: string[];
}

interface RecommendationInput {
  lead: PlaybookLead;
  activities?: Pick<Activity, 'type' | 'title' | 'description' | 'created_at'>[];
  followups?: PlaybookFollowUp[];
  shares?: PlaybookShare[];
  now?: Date;
}

const FOUR_HOURS = 4 * 60 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;
const SEVEN_DAYS = 7 * ONE_DAY;

export const BENGALURU_FOLLOW_UP_TEMPLATES: FollowUpPlaybookTemplate[] = [
  {
    key: 'intro_after_missed_call',
    group: 'Call Recovery',
    name: 'Intro after missed call',
    type: 'whatsapp',
    message: 'Hi {{leadName}}, I tried calling you about options in {{preferredLocation}}. Let me know a good time to speak, or I can share a few matching properties here.',
  },
  {
    key: 'intro_after_connected_call',
    group: 'Call Follow-up',
    name: 'Greeting after connected call',
    type: 'whatsapp',
    message: 'Hi {{leadName}}, good speaking with you. I will share options matching {{preferredLocation}} and your requirement here on WhatsApp.',
  },
  {
    key: 'property_share',
    group: 'Property Share',
    name: 'Share property details',
    type: 'whatsapp',
    message: 'Hi {{leadName}}, sharing {{propertyTitle}} in {{location}}. Price: {{price}}. Photos and details: {{shareLink}}',
  },
  {
    key: 'property_check_in',
    group: 'Property Share',
    name: 'Check after property share',
    type: 'whatsapp',
    message: 'Hi {{leadName}}, did you get a chance to review {{propertyTitle}}? If it works for you, I can arrange the next step or share similar options.',
  },
  {
    key: 'site_visit_confirmation',
    group: 'Site Visit',
    name: 'Site visit confirmation',
    type: 'whatsapp',
    message: 'Hi {{leadName}}, confirming your site visit for {{propertyTitle}}. I will keep the details ready and coordinate the visit as discussed.',
  },
  {
    key: 'site_visit_reminder',
    group: 'Site Visit',
    name: 'Site visit reminder',
    type: 'whatsapp',
    message: 'Hi {{leadName}}, quick reminder for your site visit. Please message me if you need the location or want to adjust the timing.',
  },
  {
    key: 'post_visit_feedback',
    group: 'Site Visit',
    name: 'Post-visit feedback',
    type: 'whatsapp',
    message: 'Hi {{leadName}}, hope the visit was useful. What did you think about the property? I can help with pricing, availability, or similar options.',
  },
  {
    key: 'negotiation_recap',
    group: 'Negotiation',
    name: 'Negotiation recap',
    type: 'whatsapp',
    message: 'Hi {{leadName}}, summarising our discussion: I will check the best possible terms and update you. Please share any final questions here.',
  },
  {
    key: 'dormant_reactivation',
    group: 'Reactivation',
    name: 'Dormant lead reactivation',
    type: 'whatsapp',
    message: 'Hi {{leadName}}, checking in once more. Are you still exploring properties around {{preferredLocation}}, or should I pause updates for now?',
  },
];

export function getDefaultFollowUpTemplateRows(organizationId: string) {
  return BENGALURU_FOLLOW_UP_TEMPLATES.map((template) => ({
    organization_id: organizationId,
    name: `${template.group}: ${template.name}`,
    type: template.type,
    message: template.message,
    is_default: true,
  }));
}

export function getTemplateByKey(key: FollowUpTemplateKey) {
  return BENGALURU_FOLLOW_UP_TEMPLATES.find((template) => template.key === key);
}

export function getLeadTemplateVars(lead: PlaybookLead, property?: PlaybookShare['property'] & { id?: string }, shareLink?: string) {
  const firstName = lead.full_name.trim().split(/\s+/)[0] || 'there';
  const preferredLocation = lead.preferred_location?.trim() || 'your preferred area';
  const propertyTitle = property?.title?.trim() || 'the property';
  const location = property?.location?.trim() || preferredLocation;
  const price = typeof property?.price === 'number' ? formatCurrency(property.price) : 'as discussed';

  return {
    leadName: firstName,
    preferredLocation,
    propertyTitle,
    location,
    price,
    shareLink: shareLink || 'the property link',
  };
}

export function fillFollowUpTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key]?.trim() || '');
}

export function buildPropertyShareMessage(lead: PlaybookLead, property: { id: string; title?: string | null; location?: string | null; price?: number | null }, shareLink: string) {
  const template = getTemplateByKey('property_share')!;
  return fillFollowUpTemplate(template.message, getLeadTemplateVars(lead, property, shareLink));
}

export function buildPropertyCheckInMessage(lead: PlaybookLead, property?: PlaybookShare['property']) {
  const template = getTemplateByKey('property_check_in')!;
  return fillFollowUpTemplate(template.message, getLeadTemplateVars(lead, property || undefined));
}

function addMs(now: Date, ms: number) {
  return new Date(now.getTime() + ms).toISOString();
}

function sortByDateDesc<T extends { created_at?: string; scheduled_at?: string }>(items: T[], key: 'created_at' | 'scheduled_at') {
  return [...items].sort((left, right) => new Date(right[key] || 0).getTime() - new Date(left[key] || 0).getTime());
}

function getOpenFollowUps(followups: PlaybookFollowUp[] = []) {
  return followups
    .filter((followup) => followup.status === 'pending' || followup.status === 'snoozed')
    .sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime());
}

function hasFollowUpAfter(followups: PlaybookFollowUp[] = [], date: string) {
  const timestamp = new Date(date).getTime();
  return getOpenFollowUps(followups).some((followup) => new Date(followup.scheduled_at).getTime() > timestamp);
}

function isNoResponseActivity(activity: Pick<Activity, 'type' | 'title' | 'description'>) {
  const text = `${activity.title} ${activity.description || ''}`.toLowerCase();
  return activity.type === 'call' && /(no answer|not completed|missed|tried calling|busy|failed)/.test(text);
}

function isConnectedCall(activity: Pick<Activity, 'type' | 'title' | 'description'>) {
  const text = `${activity.title} ${activity.description || ''}`.toLowerCase();
  return activity.type === 'call' && /(connected|completed|spoke|call done)/.test(text);
}

function isPostVisitActivity(activity: Pick<Activity, 'type' | 'title' | 'description'>) {
  const text = `${activity.title} ${activity.description || ''}`.toLowerCase();
  return activity.type === 'site_visit' && /(done|completed|visited|feedback)/.test(text);
}

export function getLeadFollowUpPlaybook(input: RecommendationInput): FollowUpRecommendation {
  const now = input.now || new Date();
  const activities = sortByDateDesc(input.activities || [], 'created_at');
  const shares = sortByDateDesc(input.shares || [], 'created_at');
  const openFollowups = getOpenFollowUps(input.followups);
  const dueFollowUp = openFollowups.find((followup) => new Date(followup.scheduled_at).getTime() <= now.getTime());
  const latestActivity = activities[0];
  const latestShare = shares[0];
  const noResponseCount = activities.filter(isNoResponseActivity).length;
  const leadVars = getLeadTemplateVars(input.lead);

  if (input.lead.status === 'won' || input.lead.status === 'lost') {
    return {
      id: 'closed',
      title: input.lead.status === 'won' ? 'Lead is won' : 'Lead is closed',
      description: 'No active follow-up is needed unless the agent reopens the conversation.',
      primaryChannel: 'none',
      primaryLabel: 'No action',
      reasons: ['Closed lead status'],
    };
  }

  if (dueFollowUp) {
    return {
      id: 'due_follow_up',
      title: `Complete the due ${dueFollowUp.type} follow-up`,
      description: dueFollowUp.message || 'This follow-up is due now. Complete it, snooze it, or cancel it before moving on.',
      primaryChannel: dueFollowUp.type === 'call' ? 'call' : 'whatsapp',
      primaryLabel: dueFollowUp.type === 'call' ? 'Call now' : 'Use message',
      reasons: ['There is an open follow-up due now'],
    };
  }

  if (noResponseCount >= 3 && input.lead.status !== 'not_responding') {
    const template = getTemplateByKey('dormant_reactivation')!;
    return {
      id: 'mark_not_responding',
      title: 'Move to no-response reactivation',
      description: 'There are repeated no-response call attempts. Mark this lead no-response and schedule a low-priority WhatsApp check-in.',
      primaryChannel: 'status',
      primaryLabel: 'Mark no response',
      templateKey: 'dormant_reactivation',
      nextStatus: 'not_responding',
      suggestedFollowUp: {
        type: 'whatsapp',
        scheduledAt: addMs(now, SEVEN_DAYS),
        message: fillFollowUpTemplate(template.message, leadVars),
        label: 'Reactivate in 7 days',
      },
      reasons: ['Three or more no-response call attempts'],
    };
  }

  if (input.lead.status === 'new') {
    const template = getTemplateByKey('intro_after_missed_call')!;
    return {
      id: 'new_lead_call',
      title: 'Call first, keep WhatsApp ready',
      description: 'Fresh BLR leads should get a fast call. If they miss it, send the intro WhatsApp and schedule another call.',
      primaryChannel: 'call',
      primaryLabel: 'Call now',
      templateKey: 'intro_after_missed_call',
      nextStatus: 'contacted',
      suggestedFollowUp: {
        type: 'whatsapp',
        scheduledAt: addMs(now, FOUR_HOURS),
        message: fillFollowUpTemplate(template.message, leadVars),
        label: 'WhatsApp recovery',
      },
      reasons: ['New lead with no completed follow-up yet'],
    };
  }

  if (input.lead.status === 'not_responding') {
    const template = getTemplateByKey('dormant_reactivation')!;
    return {
      id: 'dormant_reactivation',
      title: 'Low-priority WhatsApp reactivation',
      description: 'Keep this light. Ask if they are still exploring or if updates should be paused.',
      primaryChannel: 'whatsapp',
      primaryLabel: 'Use reactivation message',
      templateKey: 'dormant_reactivation',
      suggestedFollowUp: {
        type: 'whatsapp',
        scheduledAt: addMs(now, SEVEN_DAYS),
        message: fillFollowUpTemplate(template.message, leadVars),
        label: 'Follow up next week',
      },
      reasons: ['Lead is marked no-response'],
    };
  }

  if (input.lead.status === 'site_visit_scheduled') {
    const visited = activities.some(isPostVisitActivity);
    const templateKey: FollowUpTemplateKey = visited ? 'post_visit_feedback' : 'site_visit_confirmation';
    const template = getTemplateByKey(templateKey)!;
    return {
      id: visited ? 'post_visit_feedback' : 'site_visit_confirmation',
      title: visited ? 'Ask for post-visit feedback' : 'Confirm the site visit on WhatsApp',
      description: visited
        ? 'The next step is feedback and a clear status move: interested, negotiation, won, or lost.'
        : 'Send a short confirmation and keep the visit details in WhatsApp.',
      primaryChannel: 'whatsapp',
      primaryLabel: visited ? 'Use feedback message' : 'Use confirmation',
      templateKey,
      suggestedFollowUp: {
        type: 'whatsapp',
        scheduledAt: addMs(now, ONE_DAY),
        message: fillFollowUpTemplate(template.message, leadVars),
        label: visited ? 'Feedback follow-up' : 'Visit reminder',
      },
      reasons: ['Lead is in site-visit stage'],
    };
  }

  if (input.lead.status === 'negotiation') {
    return {
      id: 'negotiation_recap',
      title: 'Send negotiation recap',
      description: 'Keep the next commitment explicit and captured in WhatsApp.',
      primaryChannel: 'whatsapp',
      primaryLabel: 'Use recap message',
      templateKey: 'negotiation_recap',
      suggestedFollowUp: {
        type: 'call',
        scheduledAt: addMs(now, ONE_DAY),
        message: 'Call to discuss final terms and next commitment.',
        label: 'Call tomorrow',
      },
      reasons: ['Lead is in negotiation'],
    };
  }

  if (latestShare && !hasFollowUpAfter(input.followups, latestShare.created_at)) {
    return {
      id: 'property_check_in',
      title: 'Check after shared property',
      description: 'A property has been shared but there is no later open follow-up. Check interest before the lead cools.',
      primaryChannel: 'whatsapp',
      primaryLabel: 'Use check-in',
      templateKey: 'property_check_in',
      suggestedFollowUp: {
        type: 'call',
        scheduledAt: addMs(now, ONE_DAY),
        message: 'Call to discuss property feedback and schedule the next step.',
        label: 'Call tomorrow',
      },
      reasons: ['Property shared without a later open follow-up'],
    };
  }

  if (input.lead.status === 'interested' && shares.length === 0) {
    return {
      id: 'share_matching_properties',
      title: 'Share matching properties',
      description: 'The lead is interested but no property has been shared yet. Share 1-3 strong matches, then schedule a check-in.',
      primaryChannel: 'share_property',
      primaryLabel: 'Share property',
      templateKey: 'property_share',
      reasons: ['Interested lead with no property share history'],
    };
  }

  if (latestActivity?.type === 'message' && shares.length === 0) {
    return {
      id: 'whatsapp_reply_qualify',
      title: 'Call to qualify the WhatsApp reply',
      description: 'The conversation is warm. Call to confirm budget, location, timeline, and then share inventory.',
      primaryChannel: 'call',
      primaryLabel: 'Call now',
      templateKey: 'intro_after_connected_call',
      suggestedFollowUp: {
        type: 'whatsapp',
        scheduledAt: addMs(now, FOUR_HOURS),
        message: fillFollowUpTemplate(getTemplateByKey('intro_after_connected_call')!.message, leadVars),
        label: 'Recap after call',
      },
      reasons: ['Recent WhatsApp/message activity without property sharing'],
    };
  }

  if (latestActivity && isNoResponseActivity(latestActivity)) {
    return {
      id: 'missed_call_recover',
      title: 'Recover missed call on WhatsApp',
      description: 'Send a light WhatsApp note and schedule the next call attempt.',
      primaryChannel: 'whatsapp',
      primaryLabel: 'Use missed-call message',
      templateKey: 'intro_after_missed_call',
      suggestedFollowUp: {
        type: 'call',
        scheduledAt: addMs(now, FOUR_HOURS),
        message: 'Try calling again after the WhatsApp recovery message.',
        label: 'Retry call later',
      },
      reasons: ['Latest activity is a missed or incomplete call'],
    };
  }

  if (latestActivity && isConnectedCall(latestActivity)) {
    const template = getTemplateByKey('intro_after_connected_call')!;
    return {
      id: 'connected_call_whatsapp',
      title: 'Send WhatsApp recap after call',
      description: 'Move the call summary into WhatsApp so property sharing and next steps are easy to continue.',
      primaryChannel: 'whatsapp',
      primaryLabel: 'Use call recap',
      templateKey: 'intro_after_connected_call',
      suggestedFollowUp: {
        type: 'whatsapp',
        scheduledAt: addMs(now, FOUR_HOURS),
        message: fillFollowUpTemplate(template.message, leadVars),
        label: 'Follow up today',
      },
      reasons: ['Latest activity is a connected call'],
    };
  }

  return {
    id: 'general_check_in',
    title: 'Do a call-led check-in',
    description: 'Use a quick call to move the lead to property share, site visit, negotiation, or no-response.',
    primaryChannel: 'call',
    primaryLabel: 'Call now',
    templateKey: 'intro_after_connected_call',
    suggestedFollowUp: {
      type: 'whatsapp',
      scheduledAt: addMs(now, ONE_DAY),
      message: fillFollowUpTemplate(getTemplateByKey('intro_after_connected_call')!.message, leadVars),
      label: 'Follow up tomorrow',
    },
    reasons: ['No more specific playbook rule matched'],
  };
}
