import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PropertyDetail } from '@/components/properties/property-detail';

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: property } = await supabase
    .from('properties')
    .select('*, images:property_images(*), documents:property_documents(*), project:projects(*)')
    .eq('id', id)
    .single();

  if (!property) return notFound();

  return <PropertyDetail property={property} />;
}
