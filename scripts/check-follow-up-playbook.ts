import assert from 'node:assert/strict';
import {
  getLeadFollowUpPlaybook,
  type PlaybookLead,
  type PlaybookShare,
} from '../src/lib/services/follow-up-playbook';

const now = new Date('2026-05-29T05:30:00.000Z');

const baseLead: PlaybookLead = {
  id: 'lead-1',
  full_name: 'Rahul Sharma',
  phone: '+919876543210',
  status: 'contacted',
  preferred_location: 'Whitefield',
  property_type: 'apartment',
};

const baseShare: PlaybookShare = {
  id: 'share-1',
  property_id: 'property-1',
  channel: 'whatsapp',
  created_at: '2026-05-29T04:00:00.000Z',
  property: {
    title: 'Tower 8 3BHK resale unit',
    location: 'Whitefield',
    price: 18800000,
  },
};

const cases = [
  {
    name: 'call-first connected',
    input: {
      lead: baseLead,
      activities: [
        {
          type: 'call' as const,
          title: 'Call completed',
          description: 'Connected with lead',
          created_at: '2026-05-29T05:00:00.000Z',
        },
      ],
      now,
    },
    expected: 'connected_call_whatsapp',
  },
  {
    name: 'call-first no-answer',
    input: {
      lead: baseLead,
      activities: [
        {
          type: 'call' as const,
          title: 'Call not completed',
          description: 'No answer',
          created_at: '2026-05-29T05:00:00.000Z',
        },
      ],
      now,
    },
    expected: 'missed_call_recover',
  },
  {
    name: 'whatsapp-first reply',
    input: {
      lead: baseLead,
      activities: [
        {
          type: 'message' as const,
          title: 'WhatsApp reply logged',
          description: 'Asked for options',
          created_at: '2026-05-29T05:00:00.000Z',
        },
      ],
      now,
    },
    expected: 'whatsapp_reply_qualify',
  },
  {
    name: 'property-share follow-up',
    input: {
      lead: { ...baseLead, status: 'interested' as const },
      shares: [baseShare],
      followups: [],
      now,
    },
    expected: 'property_check_in',
  },
  {
    name: 'site-visit follow-up',
    input: {
      lead: { ...baseLead, status: 'site_visit_scheduled' as const },
      now,
    },
    expected: 'site_visit_confirmation',
  },
  {
    name: 'no-response reactivation',
    input: {
      lead: baseLead,
      activities: [0, 1, 2].map((index) => ({
        type: 'call' as const,
        title: 'Call not completed',
        description: `No answer attempt ${index + 1}`,
        created_at: `2026-05-29T0${index + 1}:00:00.000Z`,
      })),
      now,
    },
    expected: 'mark_not_responding',
  },
];

for (const scenario of cases) {
  const recommendation = getLeadFollowUpPlaybook(scenario.input);
  assert.equal(recommendation.id, scenario.expected, scenario.name);
  assert.ok(recommendation.title.length > 0, `${scenario.name}: title`);
  assert.ok(recommendation.description.length > 0, `${scenario.name}: description`);
}

console.log(`Follow-up playbook scenarios passed: ${cases.length}`);
