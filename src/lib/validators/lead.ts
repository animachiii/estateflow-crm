import { z } from 'zod';

export const leadSchema = z.object({
  full_name: z.string().min(1, 'Name is required').max(200),
  phone: z.string().min(10, 'Valid phone required').max(20),
  email: z.string().email().optional().or(z.literal('')).transform(v => v || null),
  source: z.enum(['36_acre', 'magicbricks', 'housing', 'facebook', 'instagram', 'website', 'referral', 'manual', 'other']).default('manual'),
  property_type: z.enum(['apartment', 'villa', 'plot', 'commercial', 'rental']).optional().nullable(),
  budget_min: z.coerce.number().min(0).optional().nullable(),
  budget_max: z.coerce.number().min(0).optional().nullable(),
  preferred_location: z.string().max(500).optional().nullable(),
  status: z.enum(['new', 'contacted', 'interested', 'site_visit_scheduled', 'negotiation', 'won', 'lost', 'not_responding']).default('new'),
  temperature: z.enum(['cold', 'warm', 'hot']).default('warm'),
  assigned_agent_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  next_follow_up: z.string().optional().nullable(),
});

export const webhookLeadSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  source: z.string().optional().default('other'),
  propertyType: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  preferredLocation: z.string().optional(),
  notes: z.string().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type WebhookLeadInput = z.infer<typeof webhookLeadSchema>;
