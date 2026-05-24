import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PropertyForm } from '@/components/properties/property-form';
import { updateProperty } from '@/app/actions/properties';

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const [{ data: property }, { data: projects }] = await Promise.all([
    supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('projects')
      .select('id, name, builder_name, locality')
      .order('name'),
  ]);

  if (!property) return notFound();

  const updatePropertyAction = updateProperty.bind(null, id);

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900">Edit Property</h1>
          <p className="text-sm text-slate-500">
            Update unit details, pricing, owner info, and project mapping without re-entering the listing.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-900/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_8px_24px_-16px_rgba(15,23,42,0.10)]">
          <PropertyForm
            projects={projects || []}
            action={updatePropertyAction}
            initialValues={property}
            submitLabel="Save Changes"
            pendingLabel="Saving..."
            cancelHref={`/properties/${id}`}
          />
        </div>
      </div>
    </div>
  );
}
