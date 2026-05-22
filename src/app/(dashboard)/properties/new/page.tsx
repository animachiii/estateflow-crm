import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PropertyForm } from '@/components/properties/property-form';

export default async function NewPropertyPage() {
  const supabase = await createServerSupabaseClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, builder_name, locality')
    .order('name');

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Add Property</h1>
      <PropertyForm projects={projects || []} />
    </div>
  );
}
