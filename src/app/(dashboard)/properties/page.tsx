import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PropertiesList } from '@/components/properties/properties-list';

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('properties')
    .select('*, images:property_images(id, url, is_primary)')
    .order('created_at', { ascending: false });

  if (params.type) query = query.eq('property_type', params.type);
  if (params.availability) query = query.eq('availability', params.availability);
  if (params.q) query = query.or(`title.ilike.%${params.q}%,location.ilike.%${params.q}%`);

  const { data: properties } = await query.limit(50);

  return <PropertiesList properties={properties || []} filters={{
    type: (params.type as string) || '',
    availability: (params.availability as string) || '',
    q: (params.q as string) || '',
  }} />;
}
