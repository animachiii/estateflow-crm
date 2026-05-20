'use server';

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const LEAD_SOURCES = ['magicbricks', 'housing', '36_acre', 'facebook', 'instagram', 'website', 'referral'] as const;
const STATUSES = ['new', 'contacted', 'interested', 'site_visit_scheduled', 'negotiation', 'won', 'not_responding'] as const;
const TEMPS = ['cold', 'warm', 'hot'] as const;
const PROPERTY_TYPES = ['apartment', 'villa', 'plot', 'commercial', 'rental'] as const;

const FIRST_NAMES = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rajesh', 'Pooja', 'Karan', 'Neha', 'Sandeep', 'Divya', 'Ravi', 'Kavita', 'Manoj', 'Ritu', 'Ashok', 'Meera', 'Suresh', 'Geeta'];
const LAST_NAMES = ['Sharma', 'Patel', 'Kumar', 'Verma', 'Singh', 'Gupta', 'Mehta', 'Joshi', 'Reddy', 'Iyer', 'Nair', 'Khanna', 'Malhotra', 'Chopra', 'Bansal'];
const LOCATIONS = ['Bandra West', 'Andheri East', 'Powai', 'Juhu', 'Worli', 'Lower Parel', 'Goregaon', 'Borivali', 'Malad', 'Thane West', 'Navi Mumbai', 'Whitefield', 'Indiranagar', 'Koramangala', 'HSR Layout'];
const AMENITIES_POOL = ['Swimming Pool', 'Gym', 'Clubhouse', 'Garden', 'Kids Play Area', '24/7 Security', 'Power Backup', 'Covered Parking', 'Lift', 'CCTV', 'Jogging Track', 'Tennis Court'];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomPhone() {
  return '+91' + (9000000000 + Math.floor(Math.random() * 999999999));
}

export async function loadDemoData() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();
  if (!profile) return { error: 'Profile not found' };
  if (profile.role !== 'admin' && profile.role !== 'sales_manager') {
    return { error: 'Only admins or managers can load demo data' };
  }

  const orgId = profile.organization_id;
  const service = createServiceRoleClient();

  // ----- Properties -----
  const properties = Array.from({ length: 12 }).map(() => {
    const type = pick(PROPERTY_TYPES);
    const bedrooms = type === 'plot' || type === 'commercial' ? null : randInt(1, 4);
    const price =
      type === 'villa' ? randInt(15000000, 80000000) :
      type === 'commercial' ? randInt(20000000, 150000000) :
      type === 'plot' ? randInt(5000000, 40000000) :
      type === 'rental' ? randInt(20000, 150000) :
      randInt(5000000, 35000000);
    const location = pick(LOCATIONS);
    return {
      organization_id: orgId,
      title: `${bedrooms ? bedrooms + ' BHK ' : ''}${type.charAt(0).toUpperCase() + type.slice(1)} in ${location}`,
      location,
      address: `${randInt(1, 99)}, ${location} Main Road`,
      property_type: type,
      price,
      size_sqft: type === 'plot' ? randInt(1000, 5000) : randInt(450, 3500),
      bedrooms,
      bathrooms: bedrooms ? Math.max(1, bedrooms - 1) : null,
      floor: type === 'plot' || type === 'villa' ? null : randInt(1, 25),
      furnishing: type === 'rental' || Math.random() > 0.5 ? pick(['unfurnished', 'semi_furnished', 'fully_furnished']) : null,
      availability: Math.random() > 0.8 ? 'hold' : 'available',
      description: `Beautiful ${type} located in the heart of ${location}. Well-connected, spacious, and ready to move in.`,
      amenities: Array.from({ length: randInt(3, 6) }).map(() => pick(AMENITIES_POOL)).filter((v, i, a) => a.indexOf(v) === i),
      owner_name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      owner_phone: randomPhone(),
      tags: Math.random() > 0.5 ? ['premium'] : ['new-launch'],
    };
  });

  const { error: propErr } = await service.from('properties').insert(properties);
  if (propErr) return { error: `Properties: ${propErr.message}` };

  // ----- Leads -----
  const leads = Array.from({ length: 25 }).map(() => {
    const budgetMin = randInt(3000000, 15000000);
    return {
      organization_id: orgId,
      full_name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      phone: randomPhone(),
      email: Math.random() > 0.3 ? `lead${randInt(1000, 9999)}@example.com` : null,
      source: pick(LEAD_SOURCES),
      property_type: pick(PROPERTY_TYPES),
      budget_min: budgetMin,
      budget_max: budgetMin + randInt(2000000, 10000000),
      preferred_location: pick(LOCATIONS),
      status: pick(STATUSES),
      temperature: pick(TEMPS),
      assigned_agent_id: user.id,
      notes: Math.random() > 0.5 ? 'Looking to move within 3 months. Prefers higher floor.' : null,
      next_follow_up: Math.random() > 0.4
        ? new Date(Date.now() + randInt(-2, 7) * 86400000).toISOString()
        : null,
    };
  });

  const { data: insertedLeads, error: leadErr } = await service
    .from('leads')
    .insert(leads)
    .select('id, full_name, source');
  if (leadErr) return { error: `Leads: ${leadErr.message}` };

  // ----- Activities (timeline entries) -----
  const activities = (insertedLeads ?? []).flatMap((lead: { id: string; full_name: string; source: string }) => {
    const n = randInt(1, 3);
    return Array.from({ length: n }).map((_, i) => ({
      organization_id: orgId,
      lead_id: lead.id,
      user_id: user.id,
      type: pick(['call', 'message', 'note', 'status_change'] as const),
      title: pick([
        'Called lead',
        'Sent WhatsApp message',
        'Added note',
        'Updated status',
        'Shared property details',
      ]),
      description: i === 0 ? `Lead created from ${lead.source}` : null,
      created_at: new Date(Date.now() - randInt(0, 30) * 86400000).toISOString(),
    }));
  });
  await service.from('activities').insert(activities);

  // ----- Follow-ups -----
  const followups = (insertedLeads ?? []).slice(0, 12).map((lead: { id: string; full_name: string }) => ({
    organization_id: orgId,
    lead_id: lead.id,
    agent_id: user.id,
    type: pick(['whatsapp', 'sms', 'call', 'email'] as const),
    status: 'pending',
    scheduled_at: new Date(Date.now() + randInt(-1, 5) * 86400000).toISOString(),
    message: `Hi ${lead.full_name.split(' ')[0]}, just checking in.`,
  }));
  await service.from('followups').insert(followups);

  revalidatePath('/');
  revalidatePath('/leads');
  revalidatePath('/properties');
  revalidatePath('/followups');
  revalidatePath('/settings');

  return {
    success: true,
    counts: {
      properties: properties.length,
      leads: (insertedLeads ?? []).length,
      activities: activities.length,
      followups: followups.length,
    },
  };
}

export async function clearDemoData() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();
  if (!profile) return { error: 'Profile not found' };
  if (profile.role !== 'admin') return { error: 'Only admin can clear data' };

  const service = createServiceRoleClient();
  const orgId = profile.organization_id;

  // Order matters due to FKs. activities/followups/calls/shares cascade from leads,
  // but we delete explicitly to be safe.
  await service.from('activities').delete().eq('organization_id', orgId);
  await service.from('followups').delete().eq('organization_id', orgId);
  await service.from('calls').delete().eq('organization_id', orgId);
  await service.from('leads').delete().eq('organization_id', orgId);
  await service.from('properties').delete().eq('organization_id', orgId);

  revalidatePath('/');
  revalidatePath('/leads');
  revalidatePath('/properties');
  revalidatePath('/followups');
  revalidatePath('/settings');
  return { success: true };
}
