'use server';

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const LEAD_SOURCES = ['magicbricks', 'housing', '36_acre', 'facebook', 'instagram', 'website', 'referral'] as const;
const STATUSES = ['new', 'contacted', 'interested', 'site_visit_scheduled', 'negotiation', 'won', 'not_responding'] as const;
const TEMPS = ['cold', 'warm', 'hot'] as const;
const PROPERTY_TYPES = ['apartment', 'villa', 'plot', 'commercial', 'rental'] as const;

const FIRST_NAMES = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rajesh', 'Pooja', 'Karan', 'Neha', 'Sandeep', 'Divya', 'Ravi', 'Kavita', 'Manoj', 'Ritu', 'Ashok', 'Meera', 'Suresh', 'Geeta'];
const LAST_NAMES = ['Sharma', 'Patel', 'Kumar', 'Verma', 'Singh', 'Gupta', 'Mehta', 'Joshi', 'Reddy', 'Iyer', 'Nair', 'Khanna', 'Malhotra', 'Chopra', 'Bansal'];
const BENGALURU_LOCATIONS = ['Whitefield', 'Varthur', 'Sarjapur Road', 'Panathur', 'Mahadevapura', 'HSR Layout', 'Bellandur', 'Hoodi', 'Indiranagar', 'Hebbal'];

const BENGALURU_PROJECT_INVENTORY = [
  {
    slug: 'prestige-lakeside-habitat',
    units: [
      {
        title: 'Tower 8 3BHK resale unit',
        location: 'Whitefield',
        address: 'Prestige Lakeside Habitat, Varthur Main Road',
        property_type: 'apartment',
        price: 18800000,
        size_sqft: 1697,
        bedrooms: 3,
        bathrooms: 3,
        floor: 17,
        furnishing: 'semi_furnished',
        availability: 'available',
        description: 'Lake-facing 3BHK resale with open balcony and clubhouse access.',
        amenities: ['Clubhouse', 'Swimming Pool', 'Gym', 'Tennis Court', 'Power Backup'],
        tags: ['resale', 'lake-facing', 'whitefield'],
      },
      {
        title: 'Tower 21 4BHK premium unit',
        location: 'Whitefield',
        address: 'Prestige Lakeside Habitat, Varthur Main Road',
        property_type: 'apartment',
        price: 27800000,
        size_sqft: 2830,
        bedrooms: 4,
        bathrooms: 4,
        floor: 24,
        furnishing: 'fully_furnished',
        availability: 'hold',
        description: 'High-floor 4BHK with premium interiors and partial lake view.',
        amenities: ['Clubhouse', 'Jogging Track', 'Children Play Area', 'Security', 'Covered Parking'],
        tags: ['premium', 'high-floor', 'prestige'],
      },
    ],
  },
  {
    slug: 'brigade-cornerstone-utopia',
    units: [
      {
        title: 'Eden Tower 2BHK investor unit',
        location: 'Varthur',
        address: 'Brigade Cornerstone Utopia, Varthur Road',
        property_type: 'apartment',
        price: 11200000,
        size_sqft: 1248,
        bedrooms: 2,
        bathrooms: 2,
        floor: 15,
        furnishing: 'semi_furnished',
        availability: 'available',
        description: 'Well-kept 2BHK with strong rental demand near Whitefield offices.',
        amenities: ['Swimming Pool', 'Gym', 'Retail Plaza', 'Security', 'Power Backup'],
        tags: ['investor', 'rental-yield', 'varthur'],
      },
      {
        title: 'Halcyon block 3BHK family unit',
        location: 'Varthur',
        address: 'Brigade Cornerstone Utopia, Varthur Road',
        property_type: 'apartment',
        price: 15800000,
        size_sqft: 1656,
        bedrooms: 3,
        bathrooms: 3,
        floor: 9,
        furnishing: 'semi_furnished',
        availability: 'available',
        description: 'Family-size 3BHK close to the school and sports courts inside the township.',
        amenities: ['Clubhouse', 'Basketball Court', 'Jogging Track', 'Kids Play Area', 'Covered Parking'],
        tags: ['family', 'township', 'brigade'],
      },
    ],
  },
  {
    slug: 'sobha-dream-acres',
    units: [
      {
        title: 'Aster block 1BHK compact unit',
        location: 'Panathur',
        address: 'Sobha Dream Acres, Balagere Main Road',
        property_type: 'apartment',
        price: 7200000,
        size_sqft: 656,
        bedrooms: 1,
        bathrooms: 1,
        floor: 11,
        furnishing: 'unfurnished',
        availability: 'available',
        description: 'Compact entry-ticket 1BHK popular with first-time buyers and rental investors.',
        amenities: ['Gym', 'Swimming Pool', 'Security', 'Lift', 'Power Backup'],
        tags: ['entry-level', 'investor', 'panathur'],
      },
      {
        title: 'Maple block 2BHK park-facing',
        location: 'Panathur',
        address: 'Sobha Dream Acres, Balagere Main Road',
        property_type: 'apartment',
        price: 10800000,
        size_sqft: 1210,
        bedrooms: 2,
        bathrooms: 2,
        floor: 7,
        furnishing: 'semi_furnished',
        availability: 'available',
        description: 'Park-facing 2BHK with modular kitchen and good rental profile.',
        amenities: ['Clubhouse', 'Gym', 'Jogging Track', 'Security', 'Covered Parking'],
        tags: ['park-facing', 'sobha', '2bhk'],
      },
    ],
  },
  {
    slug: 'sobha-royal-pavilion',
    units: [
      {
        title: '3BHK courtyard-facing unit',
        location: 'Sarjapur Road',
        address: 'Sobha Royal Pavilion, Hadosiddapura',
        property_type: 'apartment',
        price: 18900000,
        size_sqft: 1570,
        bedrooms: 3,
        bathrooms: 3,
        floor: 12,
        furnishing: 'semi_furnished',
        availability: 'available',
        description: 'Well-finished 3BHK overlooking the central courtyard with strong family demand.',
        amenities: ['Clubhouse', 'Swimming Pool', 'Cricket Net', 'Security', 'Power Backup'],
        tags: ['sarjapur', 'family', 'sobha'],
      },
    ],
  },
  {
    slug: 'sattva-senorita',
    units: [
      {
        title: '2.5BHK with study near Wipro',
        location: 'Sarjapur Road',
        address: 'Sattva Senorita, Sarjapur Road',
        property_type: 'apartment',
        price: 17200000,
        size_sqft: 1420,
        bedrooms: 3,
        bathrooms: 2,
        floor: 10,
        furnishing: 'semi_furnished',
        availability: 'available',
        description: '2.5BHK layout with study room, popular among buyers working along Sarjapur and ORR.',
        amenities: ['Clubhouse', 'Gym', 'Indoor Games', 'Security', 'Covered Parking'],
        tags: ['study-room', 'wipro-corridor', 'sattva'],
      },
    ],
  },
  {
    slug: 'brigade-metropolis',
    units: [
      {
        title: '3BHK near Phoenix Marketcity',
        location: 'Mahadevapura',
        address: 'Brigade Metropolis, Garudacharpalya',
        property_type: 'apartment',
        price: 20500000,
        size_sqft: 1790,
        bedrooms: 3,
        bathrooms: 3,
        floor: 18,
        furnishing: 'fully_furnished',
        availability: 'available',
        description: 'Ready 3BHK with renovated interiors and quick access to ORR and Phoenix Marketcity.',
        amenities: ['Swimming Pool', 'Gym', 'Clubhouse', 'Security', 'Power Backup'],
        tags: ['orr', 'mahadevapura', 'ready-to-move'],
      },
    ],
  },
  {
    slug: 'godrej-air-hoodi',
    units: [
      {
        title: '2BHK east-facing unit',
        location: 'Hoodi',
        address: 'Godrej Air, Hoodi Circle',
        property_type: 'apartment',
        price: 13200000,
        size_sqft: 1117,
        bedrooms: 2,
        bathrooms: 2,
        floor: 13,
        furnishing: 'semi_furnished',
        availability: 'sold',
        description: 'Compact 2BHK close to Hoodi metro and ITPL corridor.',
        amenities: ['Gym', 'Clubhouse', 'Security', 'Power Backup', 'Covered Parking'],
        tags: ['hoodi', 'metro', 'godrej'],
      },
    ],
  },
  {
    slug: 'godrej-woodscapes',
    units: [
      {
        title: '3BHK pre-launch allocation',
        location: 'Budigere Cross',
        address: 'Godrej Woodscapes, Budigere Cross',
        property_type: 'apartment',
        price: 16200000,
        size_sqft: 1520,
        bedrooms: 3,
        bathrooms: 3,
        floor: 8,
        furnishing: 'unfurnished',
        availability: 'available',
        description: 'Pre-launch style allocation suitable for channel partner follow-up and builder inventory.',
        amenities: ['Clubhouse', 'Swimming Pool', 'Gym', 'Landscape Garden', 'Security'],
        tags: ['pre-launch', 'builder-stock', 'omr-corridor'],
      },
    ],
  },
] as const;

const BENGALURU_LEADS = [
  { full_name: 'Rahul Sharma', source: 'magicbricks', property_type: 'apartment', budget_min: 12000000, budget_max: 17000000, preferred_location: 'Whitefield', status: 'interested', temperature: 'hot', notes: 'Works at SAP. Wants 3BHK under 1.7cr with immediate possession.' },
  { full_name: 'Priya Patel', source: 'housing', property_type: 'apartment', budget_min: 9000000, budget_max: 12000000, preferred_location: 'Panathur', status: 'contacted', temperature: 'warm', notes: 'Investor looking for 2BHK with rental demand near ORR.' },
  { full_name: 'Amit Kumar', source: '36_acre', property_type: 'apartment', budget_min: 15000000, budget_max: 22000000, preferred_location: 'Sarjapur Road', status: 'site_visit_scheduled', temperature: 'hot', notes: 'Family buyer. Site visit for Sobha Royal Pavilion this Saturday.' },
  { full_name: 'Sneha Reddy', source: 'referral', property_type: 'apartment', budget_min: 17000000, budget_max: 24000000, preferred_location: 'Mahadevapura', status: 'negotiation', temperature: 'hot', notes: 'Comparing Brigade Metropolis with resale options in Phoenix zone.' },
  { full_name: 'Vikram Iyer', source: 'website', property_type: 'villa', budget_min: 25000000, budget_max: 42000000, preferred_location: 'Sarjapur Road', status: 'new', temperature: 'warm', notes: 'Open to villa communities within 45 min of Bellandur office.' },
  { full_name: 'Anjali Nair', source: 'facebook', property_type: 'apartment', budget_min: 7000000, budget_max: 9500000, preferred_location: 'Hoodi', status: 'new', temperature: 'cold', notes: 'First-time buyer interested in metro connectivity.' },
  { full_name: 'Rajesh Mehta', source: 'magicbricks', property_type: 'apartment', budget_min: 18000000, budget_max: 30000000, preferred_location: 'Whitefield', status: 'won', temperature: 'hot', notes: 'Booked a 4BHK in Prestige Lakeside Habitat.' },
  { full_name: 'Pooja Joshi', source: 'instagram', property_type: 'apartment', budget_min: 10500000, budget_max: 14500000, preferred_location: 'Varthur', status: 'contacted', temperature: 'warm', notes: 'Needs 2BHK close to kids school and clubhouse.' },
  { full_name: 'Karan Gupta', source: 'website', property_type: 'apartment', budget_min: 15000000, budget_max: 19000000, preferred_location: 'Sarjapur Road', status: 'interested', temperature: 'warm', notes: 'Asking specifically for 3BHK with study.' },
  { full_name: 'Neha Khanna', source: 'referral', property_type: 'rental', budget_min: 35000, budget_max: 60000, preferred_location: 'HSR Layout', status: 'new', temperature: 'cold', notes: 'Rental lead working in Koramangala startup cluster.' },
  { full_name: 'Sandeep Verma', source: 'housing', property_type: 'plot', budget_min: 8000000, budget_max: 15000000, preferred_location: 'Devanahalli', status: 'new', temperature: 'warm', notes: 'Exploring plotted development; keep in nurture bucket.' },
  { full_name: 'Divya Kapoor', source: '36_acre', property_type: 'apartment', budget_min: 11000000, budget_max: 14000000, preferred_location: 'Panathur', status: 'contacted', temperature: 'warm', notes: 'Wants move-in ready 2BHK before school term starts.' },
  { full_name: 'Ravi Bansal', source: 'magicbricks', property_type: 'commercial', budget_min: 18000000, budget_max: 35000000, preferred_location: 'Whitefield', status: 'new', temperature: 'warm', notes: 'Small office buyer looking near ITPL.' },
  { full_name: 'Kavita Malhotra', source: 'referral', property_type: 'apartment', budget_min: 15500000, budget_max: 23000000, preferred_location: 'Mahadevapura', status: 'site_visit_scheduled', temperature: 'hot', notes: 'Site visit lined up for Brigade Metropolis and a Phoenix-side resale.' },
  { full_name: 'Manoj Singh', source: 'website', property_type: 'apartment', budget_min: 6500000, budget_max: 8500000, preferred_location: 'Budigere Cross', status: 'new', temperature: 'warm', notes: 'Interested in builder inventory and staged payment plans.' },
  { full_name: 'Ritu Chopra', source: 'instagram', property_type: 'apartment', budget_min: 12500000, budget_max: 17500000, preferred_location: 'Whitefield', status: 'not_responding', temperature: 'cold', notes: 'Stopped responding after asking for school catchment options.' },
  { full_name: 'Ashok Reddy', source: 'facebook', property_type: 'villa', budget_min: 30000000, budget_max: 50000000, preferred_location: 'Varthur', status: 'contacted', temperature: 'warm', notes: 'Looking for villa or row-house with manageable commute to Marathahalli.' },
  { full_name: 'Meera Iyer', source: 'referral', property_type: 'apartment', budget_min: 9500000, budget_max: 13000000, preferred_location: 'Hoodi', status: 'contacted', temperature: 'warm', notes: '2BHK end-user. Hoodi metro and builder reputation matter.' },
] as const;

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

  const { data: catalogProjects } = await service
    .from('projects')
    .select('id, slug, name')
    .is('organization_id', null)
    .in('slug', BENGALURU_PROJECT_INVENTORY.map((project) => project.slug));

  const projectIdBySlug = new Map(
    (catalogProjects || []).map((project: { id: string; slug: string; name: string }) => [project.slug, project.id])
  );
  const missingProjects = BENGALURU_PROJECT_INVENTORY
    .map((project) => project.slug)
    .filter((slug) => !projectIdBySlug.has(slug));

  if (missingProjects.length > 0) {
    return { error: `Project catalog missing for: ${missingProjects.join(', ')}. Run migration 005_project_inventory.sql on Supabase first.` };
  }

  const { data: agents } = await service
    .from('profiles')
    .select('id, role')
    .eq('organization_id', orgId)
    .eq('is_active', true);
  const assignableAgents = (agents || []).filter(
    (agent: { id: string; role: string }) => agent.role === 'sales_agent' || agent.role === 'sales_manager' || agent.role === 'admin'
  );
  const pickAgentId = (index: number) => assignableAgents[index % assignableAgents.length]?.id || user.id;

  // ----- Properties -----
  const properties = BENGALURU_PROJECT_INVENTORY.flatMap((project) =>
    project.units.map((unit) => ({
      organization_id: orgId,
      project_id: projectIdBySlug.get(project.slug) || null,
      ...unit,
      owner_name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      owner_phone: randomPhone(),
      property_type: unit.property_type as typeof PROPERTY_TYPES[number],
      furnishing: unit.furnishing,
      availability: unit.availability,
    }))
  );

  const { error: propErr } = await service.from('properties').insert(properties);
  if (propErr) return { error: `Properties: ${propErr.message}` };

  // ----- Leads -----
  const leads = BENGALURU_LEADS.map((lead, index) => ({
      organization_id: orgId,
      full_name: lead.full_name,
      phone: randomPhone(),
      email: `${lead.full_name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      source: lead.source as typeof LEAD_SOURCES[number],
      property_type: lead.property_type as typeof PROPERTY_TYPES[number],
      budget_min: lead.budget_min,
      budget_max: lead.budget_max,
      preferred_location: lead.preferred_location,
      status: lead.status as typeof STATUSES[number],
      temperature: lead.temperature as typeof TEMPS[number],
      assigned_agent_id: pickAgentId(index),
      notes: lead.notes,
      next_follow_up: new Date(Date.now() + randInt(-1, 5) * 86400000).toISOString(),
    }));

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
      description: i === 0 ? `Lead created from ${lead.source} for Bengaluru project search` : null,
      created_at: new Date(Date.now() - randInt(0, 30) * 86400000).toISOString(),
    }));
  });
  await service.from('activities').insert(activities);

  // ----- Follow-ups -----
  const followups = (insertedLeads ?? []).slice(0, 12).map((lead: { id: string; full_name: string }, index: number) => ({
    organization_id: orgId,
    lead_id: lead.id,
    agent_id: pickAgentId(index),
    type: pick(['whatsapp', 'sms', 'call', 'email'] as const),
    status: 'pending',
    scheduled_at: new Date(Date.now() + randInt(-1, 5) * 86400000).toISOString(),
    message: `Hi ${lead.full_name.split(' ')[0]}, sharing the shortlist we discussed for Bengaluru projects.`,
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
