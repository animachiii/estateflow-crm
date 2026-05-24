'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { propertySchema } from '@/lib/validators/property';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type PropertyType = 'apartment' | 'villa' | 'plot' | 'commercial' | 'rental';
type FurnishingStatus = 'unfurnished' | 'semi_furnished' | 'fully_furnished';
type PropertyAvailability = 'available' | 'hold' | 'sold' | 'rented';

type ProjectRecord = {
  id: string;
  organization_id: string | null;
  name: string;
  slug: string;
  builder_name: string | null;
  locality: string;
  micro_market: string | null;
  city: string;
};

type PropertyImportRow = {
  rowNumber: number;
  title: string;
  projectName: string | null;
  projectSlug: string | null;
  builderName: string | null;
  locality: string | null;
  microMarket: string | null;
  city: string | null;
  location: string | null;
  address: string | null;
  propertyType: string | null;
  price: string | null;
  sizeSqft: string | null;
  bedrooms: string | null;
  bathrooms: string | null;
  floor: string | null;
  furnishing: string | null;
  availability: string | null;
  description: string | null;
  amenities: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  tags: string | null;
};

const CSV_FIELD_ALIASES = {
  title: ['title', 'unit_title', 'property_title', 'listing_title'],
  projectName: ['project_name', 'project', 'society', 'society_name', 'project_society'],
  projectSlug: ['project_slug', 'slug'],
  builderName: ['builder_name', 'builder', 'developer'],
  locality: ['locality', 'area', 'neighbourhood', 'neighborhood'],
  microMarket: ['micro_market', 'micro_market_name', 'submarket'],
  city: ['city'],
  location: ['location'],
  address: ['address', 'full_address'],
  propertyType: ['property_type', 'type', 'unit_type'],
  price: ['price', 'expected_price', 'asking_price'],
  sizeSqft: ['size_sqft', 'sqft', 'size', 'super_builtup_area', 'area_sqft'],
  bedrooms: ['bedrooms', 'bhk', 'bedroom_count'],
  bathrooms: ['bathrooms', 'bathroom_count'],
  floor: ['floor', 'floor_number'],
  furnishing: ['furnishing', 'furnishing_status'],
  availability: ['availability', 'status'],
  description: ['description', 'notes', 'remarks'],
  amenities: ['amenities'],
  ownerName: ['owner_name', 'owner', 'landlord_name'],
  ownerPhone: ['owner_phone', 'owner_mobile', 'owner_contact'],
  tags: ['tags', 'labels'],
} as const;

const PROPERTY_TYPE_ALIASES: Record<string, PropertyType> = {
  apartment: 'apartment',
  flat: 'apartment',
  condo: 'apartment',
  villa: 'villa',
  house: 'villa',
  bungalow: 'villa',
  plot: 'plot',
  site: 'plot',
  land: 'plot',
  commercial: 'commercial',
  office: 'commercial',
  shop: 'commercial',
  retail: 'commercial',
  rental: 'rental',
  rent: 'rental',
};

const FURNISHING_ALIASES: Record<string, FurnishingStatus> = {
  unfurnished: 'unfurnished',
  semi_furnished: 'semi_furnished',
  semifurnished: 'semi_furnished',
  semi: 'semi_furnished',
  fully_furnished: 'fully_furnished',
  full: 'fully_furnished',
  furnished: 'fully_furnished',
};

const AVAILABILITY_ALIASES: Record<string, PropertyAvailability> = {
  available: 'available',
  active: 'available',
  open: 'available',
  hold: 'hold',
  on_hold: 'hold',
  held: 'hold',
  sold: 'sold',
  closed: 'sold',
  rented: 'rented',
  lease: 'rented',
  leased: 'rented',
};

function normalizeText(value: string | null | undefined) {
  return value?.trim() || '';
}

function optionalText(value: string | null | undefined) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeLookup(value: string | null | undefined) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function uniqueSlug(base: string, usedSlugs: Set<string>) {
  const safeBase = base || 'project';
  let candidate = safeBase;
  let suffix = 2;
  while (usedSlugs.has(candidate)) {
    candidate = `${safeBase}-${suffix}`;
    suffix += 1;
  }
  usedSlugs.add(candidate);
  return candidate;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') index += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows
    .map((currentRow) => currentRow.map((cell) => cell.trim()))
    .filter((currentRow) => currentRow.some((cell) => cell.length > 0));
}

function getCell(headers: string[], row: string[], aliases: readonly string[]) {
  for (const alias of aliases) {
    const headerIndex = headers.indexOf(alias);
    if (headerIndex >= 0) return normalizeText(row[headerIndex]);
  }
  return '';
}

function parseList(value: string | null) {
  if (!value) return [];
  return value
    .split(/[|;,]/)
    .flatMap((entry) => entry.split('\n'))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseNumberish(value: string | null) {
  if (!value) return null;
  const cleaned = value.replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseWholeNumber(value: string | null) {
  const parsed = parseNumberish(value);
  if (parsed === null) return null;
  return Math.round(parsed);
}

function normalizePropertyType(value: string | null) {
  if (!value) return null;
  return PROPERTY_TYPE_ALIASES[normalizeHeader(value)] || null;
}

function normalizeFurnishing(value: string | null) {
  if (!value) return null;
  return FURNISHING_ALIASES[normalizeHeader(value)] || null;
}

function normalizeAvailability(value: string | null) {
  if (!value) return 'available';
  return AVAILABILITY_ALIASES[normalizeHeader(value)] || 'available';
}

function deriveTitle(row: PropertyImportRow, propertyType: PropertyType | null, projectName: string | null, location: string) {
  if (row.title) return row.title;

  const bedroomCount = parseWholeNumber(row.bedrooms);
  const bedroomLabel = bedroomCount ? `${bedroomCount} BHK` : null;
  const typeLabel = propertyType ? propertyType.charAt(0).toUpperCase() + propertyType.slice(1) : 'Unit';
  const projectLabel = projectName || location || 'inventory';

  return [bedroomLabel, typeLabel, 'in', projectLabel].filter(Boolean).join(' ');
}

function buildProjectKeys(name: string, locality: string | null, slug: string | null) {
  const normalizedName = normalizeLookup(name);
  const normalizedLocality = normalizeLookup(locality);
  const keys = new Set<string>();
  if (slug) keys.add(`slug:${slug.toLowerCase()}`);
  if (normalizedName) keys.add(`name:${normalizedName}`);
  if (normalizedName && normalizedLocality) keys.add(`name:${normalizedName}|${normalizedLocality}`);
  return keys;
}

function indexProjects(projects: ProjectRecord[]) {
  const lookup = new Map<string, ProjectRecord>();

  const sorted = [...projects].sort((left, right) => {
    const leftPriority = left.organization_id ? 0 : 1;
    const rightPriority = right.organization_id ? 0 : 1;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    return left.name.localeCompare(right.name);
  });

  for (const project of sorted) {
    const keys = buildProjectKeys(project.name, project.locality, project.slug);
    for (const key of keys) {
      if (!lookup.has(key)) lookup.set(key, project);
    }
  }

  return lookup;
}

function matchProject(projectLookup: Map<string, ProjectRecord>, row: PropertyImportRow) {
  const candidateSlug = normalizeText(row.projectSlug).toLowerCase();
  if (candidateSlug) {
    const slugMatch = projectLookup.get(`slug:${candidateSlug}`);
    if (slugMatch) return slugMatch;
  }

  if (!row.projectName) return null;

  const nameKey = normalizeLookup(row.projectName);
  const localityKey = normalizeLookup(row.locality);

  if (nameKey && localityKey) {
    const exactWithLocality = projectLookup.get(`name:${nameKey}|${localityKey}`);
    if (exactWithLocality) return exactWithLocality;
  }

  return nameKey ? projectLookup.get(`name:${nameKey}`) || null : null;
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function getAuthProfile() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) throw new Error('Profile not found');
  return { supabase, user, profile };
}

export async function createProperty(_prevState: unknown, formData: FormData) {
  const { supabase, profile } = await getAuthProfile();

  const raw = Object.fromEntries(formData.entries());
  const amenities = formData.get('amenities')
    ? (formData.get('amenities') as string).split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const tags = formData.get('tags')
    ? (formData.get('tags') as string).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const parsed = propertySchema.safeParse({ ...raw, amenities, tags });
  if (!parsed.success) {
    return { error: parsed.error.issues.map(e => e.message).join(', ') };
  }

  const { data, error } = await supabase
    .from('properties')
    .insert({ ...parsed.data, organization_id: profile.organization_id })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/properties');
  redirect(`/properties/${data.id}`);
}

export async function importPropertiesCsv(_prevState: unknown, formData: FormData) {
  const { supabase, profile } = await getAuthProfile();
  const file = formData.get('file');
  const shouldCreateProjects = formData.get('create_missing_projects') === 'on';

  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Upload a CSV file to import inventory.' };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: 'CSV is too large. Keep it under 2 MB for this first-pass importer.' };
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return { error: 'CSV needs a header row plus at least one property row.' };
  }

  const headers = rows[0].map(normalizeHeader);
  const dataRows = rows.slice(1);

  const parsedRows: PropertyImportRow[] = dataRows.map((row, index) => ({
    rowNumber: index + 2,
    title: getCell(headers, row, CSV_FIELD_ALIASES.title),
    projectName: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.projectName)),
    projectSlug: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.projectSlug)),
    builderName: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.builderName)),
    locality: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.locality)),
    microMarket: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.microMarket)),
    city: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.city)),
    location: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.location)),
    address: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.address)),
    propertyType: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.propertyType)),
    price: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.price)),
    sizeSqft: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.sizeSqft)),
    bedrooms: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.bedrooms)),
    bathrooms: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.bathrooms)),
    floor: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.floor)),
    furnishing: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.furnishing)),
    availability: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.availability)),
    description: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.description)),
    amenities: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.amenities)),
    ownerName: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.ownerName)),
    ownerPhone: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.ownerPhone)),
    tags: optionalText(getCell(headers, row, CSV_FIELD_ALIASES.tags)),
  }));

  const { data: existingProjects, error: projectLookupError } = await supabase
    .from('projects')
    .select('id, organization_id, name, slug, builder_name, locality, micro_market, city');

  if (projectLookupError) {
    return { error: projectLookupError.message };
  }

  const projects = (existingProjects || []) as ProjectRecord[];
  const projectLookup = indexProjects(projects);
  const usedOrgSlugs = new Set(
    projects
      .filter((project) => project.organization_id === profile.organization_id)
      .map((project) => project.slug)
  );

  const missingProjects = new Map<string, {
    name: string;
    slug: string;
    builder_name: string | null;
    locality: string;
    micro_market: string | null;
    city: string;
    property_types: PropertyType[];
    bedroom_options: number[];
  }>();

  for (const row of parsedRows) {
    if (!row.projectName || matchProject(projectLookup, row)) continue;
    if (!shouldCreateProjects) continue;

    const normalizedName = normalizeLookup(row.projectName);
    const normalizedLocality = normalizeLookup(row.locality);
    const missingKey = `${normalizedName}|${normalizedLocality}`;
    if (missingProjects.has(missingKey)) {
      const existing = missingProjects.get(missingKey);
      const propertyType = normalizePropertyType(row.propertyType);
      const bedrooms = parseWholeNumber(row.bedrooms);
      if (existing && propertyType && !existing.property_types.includes(propertyType)) existing.property_types.push(propertyType);
      if (existing && bedrooms && !existing.bedroom_options.includes(bedrooms)) existing.bedroom_options.push(bedrooms);
      continue;
    }

    const propertyType = normalizePropertyType(row.propertyType);
    const bedrooms = parseWholeNumber(row.bedrooms);
    missingProjects.set(missingKey, {
      name: row.projectName,
      slug: uniqueSlug(slugify(row.projectName), usedOrgSlugs),
      builder_name: row.builderName,
      locality: row.locality || row.location || 'Bengaluru',
      micro_market: row.microMarket,
      city: row.city || 'Bengaluru',
      property_types: propertyType ? [propertyType] : [],
      bedroom_options: bedrooms ? [bedrooms] : [],
    });
  }

  let createdProjectNames: string[] = [];
  if (missingProjects.size > 0) {
    const { data: insertedProjects, error: insertProjectsError } = await supabase
      .from('projects')
      .insert(
        Array.from(missingProjects.values()).map((project) => ({
          organization_id: profile.organization_id,
          ...project,
          notes: 'Created from property CSV import.',
        }))
      )
      .select('id, organization_id, name, slug, builder_name, locality, micro_market, city');

    if (insertProjectsError) {
      return { error: `Could not create missing projects: ${insertProjectsError.message}` };
    }

    createdProjectNames = (insertedProjects || []).map((project: { name: string }) => project.name);
    for (const project of (insertedProjects || []) as ProjectRecord[]) {
      const keys = buildProjectKeys(project.name, project.locality, project.slug);
      for (const key of keys) projectLookup.set(key, project);
    }
  }

  const validProperties: Array<ReturnType<typeof propertySchema.parse> & { organization_id: string }> = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (const row of parsedRows) {
    const matchedProject = matchProject(projectLookup, row);

    if (row.projectName && !matchedProject && !shouldCreateProjects) {
      errors.push({
        row: row.rowNumber,
        message: `Project "${row.projectName}" was not found. Enable auto-create or add that society to the catalog first.`,
      });
      continue;
    }

    const propertyType = normalizePropertyType(row.propertyType);
    if (!propertyType) {
      errors.push({
        row: row.rowNumber,
        message: 'Property type is required. Use apartment, villa, plot, commercial, or rental.',
      });
      continue;
    }

    const price = parseNumberish(row.price);
    if (price === null) {
      errors.push({
        row: row.rowNumber,
        message: 'Price is required. Numbers like 18500000 or 1,85,00,000 both work.',
      });
      continue;
    }

    const location = row.location || row.locality || matchedProject?.locality || '';
    const candidate = {
      project_id: matchedProject?.id || null,
      title: deriveTitle(row, propertyType, matchedProject?.name || row.projectName, location),
      location,
      address: row.address,
      property_type: propertyType,
      price,
      size_sqft: parseWholeNumber(row.sizeSqft),
      bedrooms: parseWholeNumber(row.bedrooms),
      bathrooms: parseWholeNumber(row.bathrooms),
      floor: parseWholeNumber(row.floor),
      furnishing: normalizeFurnishing(row.furnishing),
      availability: normalizeAvailability(row.availability),
      description: row.description,
      amenities: parseList(row.amenities),
      owner_name: row.ownerName,
      owner_phone: row.ownerPhone,
      tags: parseList(row.tags),
    };

    const parsed = propertySchema.safeParse(candidate);
    if (!parsed.success) {
      errors.push({
        row: row.rowNumber,
        message: parsed.error.issues.map((issue) => issue.message).join(', '),
      });
      continue;
    }

    validProperties.push({
      ...parsed.data,
      organization_id: profile.organization_id,
    });
  }

  if (validProperties.length === 0) {
    return {
      error: errors.length > 0 ? `No rows were imported. Fix the CSV errors and try again.` : 'No valid property rows were found in the CSV.',
      imported: 0,
      failed: errors.length,
      createdProjects: createdProjectNames.length,
      createdProjectNames,
      errors: errors.slice(0, 12),
    };
  }

  for (const rowsChunk of chunk(validProperties, 100)) {
    const { error } = await supabase.from('properties').insert(rowsChunk);
    if (error) {
      return { error: `Import failed while saving properties: ${error.message}` };
    }
  }

  revalidatePath('/properties');
  revalidatePath('/properties/new');

  return {
    success: true,
    imported: validProperties.length,
    failed: errors.length,
    createdProjects: createdProjectNames.length,
    createdProjectNames,
    errors: errors.slice(0, 12),
  };
}

export async function updateProperty(propertyId: string, _prevState: unknown, formData: FormData) {
  const { supabase, profile } = await getAuthProfile();

  const raw = Object.fromEntries(formData.entries());
  const amenities = formData.get('amenities')
    ? (formData.get('amenities') as string).split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const tags = formData.get('tags')
    ? (formData.get('tags') as string).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const parsed = propertySchema.safeParse({ ...raw, amenities, tags });
  if (!parsed.success) {
    return { error: parsed.error.issues.map(e => e.message).join(', ') };
  }

  const { error } = await supabase
    .from('properties')
    .update(parsed.data)
    .eq('id', propertyId)
    .eq('organization_id', profile.organization_id);
  if (error) return { error: error.message };

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath('/properties');
  revalidatePath('/properties/new');
  redirect(`/properties/${propertyId}`);
}

export async function deleteProperty(propertyId: string) {
  const { supabase } = await getAuthProfile();
  await supabase.from('properties').delete().eq('id', propertyId);
  revalidatePath('/properties');
  redirect('/properties');
}

export async function shareProperty(leadId: string, propertyId: string, channel: string) {
  const { supabase, user, profile } = await getAuthProfile();

  const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single();
  const { data: property } = await supabase.from('properties').select('*').eq('id', propertyId).single();

  if (!lead || !property) return { error: 'Lead or property not found' };

  const { propertyShareService } = await import('@/lib/services/property-share-service');

  let result;
  if (channel === 'whatsapp') result = await propertyShareService.shareViaWhatsApp(lead, property);
  else if (channel === 'sms') result = await propertyShareService.shareViaSms(lead, property);
  else if (channel === 'email') result = await propertyShareService.shareViaEmail(lead, property);
  else return { error: 'Invalid channel' };

  const shareLink = propertyShareService.generateShareLink(propertyId);

  await supabase.from('lead_property_shares').insert({
    lead_id: leadId,
    property_id: propertyId,
    shared_by: user.id,
    share_link: shareLink,
    channel,
  });

  await supabase.from('activities').insert({
    organization_id: profile.organization_id,
    lead_id: leadId,
    user_id: user.id,
    type: 'property_share',
    title: `Shared ${property.title} via ${channel}`,
    metadata: { property_id: propertyId, channel },
  });

  revalidatePath(`/leads/${leadId}`);
  return { success: true, dryRun: (result as any)?.dryRun };
}
