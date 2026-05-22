import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PropertiesList } from '@/components/properties/properties-list';

type PropertySearchParams = { [key: string]: string | string[] | undefined };

interface ProjectOption {
  id: string;
  name: string;
  builder_name: string | null;
  locality: string;
  micro_market: string | null;
}

function getParam(params: PropertySearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function sanitizeSearch(value: string) {
  return value.trim().replace(/[%(),]/g, ' ').replace(/\s+/g, ' ');
}

function projectMatches(project: ProjectOption, value: string) {
  const needle = value.toLowerCase();
  return [
    project.name,
    project.builder_name || '',
    project.locality,
    project.micro_market || '',
  ].some((field) => field.toLowerCase().includes(needle));
}

function projectIdFilter(ids: string[]) {
  return ids.length > 0 ? `project_id.in.(${ids.join(',')})` : 'project_id.eq.00000000-0000-0000-0000-000000000000';
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<PropertySearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const filters = {
    q: sanitizeSearch(getParam(params, 'q')),
    type: getParam(params, 'type'),
    availability: getParam(params, 'availability'),
    locality: sanitizeSearch(getParam(params, 'locality')),
    builder: getParam(params, 'builder'),
    project: getParam(params, 'project'),
    bedrooms: getParam(params, 'bedrooms'),
    furnishing: getParam(params, 'furnishing'),
    minPrice: getParam(params, 'minPrice'),
    maxPrice: getParam(params, 'maxPrice'),
  };

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, builder_name, locality, micro_market')
    .order('name');

  const projectOptions = (projects || []) as ProjectOption[];

  let query = supabase
    .from('properties')
    .select('*, images:property_images(id, url, is_primary), project:projects(id, name, builder_name, locality, micro_market, city)')
    .order('created_at', { ascending: false });

  if (filters.type) query = query.eq('property_type', filters.type);
  if (filters.availability) query = query.eq('availability', filters.availability);
  if (filters.project) query = query.eq('project_id', filters.project);
  if (filters.bedrooms) query = query.eq('bedrooms', filters.bedrooms);
  if (filters.furnishing) query = query.eq('furnishing', filters.furnishing);

  const minPrice = Number(filters.minPrice);
  const maxPrice = Number(filters.maxPrice);
  if (Number.isFinite(minPrice) && minPrice > 0) query = query.gte('price', minPrice);
  if (Number.isFinite(maxPrice) && maxPrice > 0) query = query.lte('price', maxPrice);

  if (filters.builder) {
    const builderProjectIds = projectOptions
      .filter((project) => project.builder_name === filters.builder)
      .map((project) => project.id);
    query = query.in('project_id', builderProjectIds.length > 0 ? builderProjectIds : ['00000000-0000-0000-0000-000000000000']);
  }

  if (filters.locality) {
    const localityProjectIds = projectOptions
      .filter((project) => projectMatches(project, filters.locality))
      .map((project) => project.id);
    query = query.or(`location.ilike.%${filters.locality}%,address.ilike.%${filters.locality}%,${projectIdFilter(localityProjectIds)}`);
  }

  if (filters.q) {
    const searchProjectIds = projectOptions
      .filter((project) => projectMatches(project, filters.q))
      .map((project) => project.id);
    query = query.or(`title.ilike.%${filters.q}%,location.ilike.%${filters.q}%,address.ilike.%${filters.q}%,${projectIdFilter(searchProjectIds)}`);
  }

  const { data: properties } = await query.limit(50);

  return <PropertiesList properties={properties || []} projects={projectOptions} filters={filters} />;
}
