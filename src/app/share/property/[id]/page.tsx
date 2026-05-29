import { notFound } from 'next/navigation';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import { Building2, MapPin, Ruler, BedDouble, Bath, CheckCircle2 } from 'lucide-react';

type SharedPropertyImage = {
  url: string;
  is_primary: boolean | null;
};

export default async function SharedPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { data: property } = await supabase
    .from('properties')
    .select('*, images:property_images(*), project:projects(name, builder_name, locality, city)')
    .eq('id', id)
    .single();

  if (!property) return notFound();

  const images = (property.images || []) as SharedPropertyImage[];
  const primaryImage = images.find((image) => image.is_primary) || images[0];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {primaryImage ? (
        <div className="h-[42vh] min-h-[280px] w-full bg-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={primaryImage.url} alt={property.title} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-[34vh] min-h-[240px] w-full items-center justify-center bg-slate-200">
          <Building2 className="h-16 w-16 text-slate-400" />
        </div>
      )}

      <section className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.06]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                {property.project?.name || property.property_type}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{property.title}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="h-4 w-4" /> {property.location}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-2xl font-semibold text-slate-950">{formatCurrency(property.price)}</p>
              <p className="text-xs capitalize text-slate-500">{property.availability}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {property.bedrooms && (
              <div className="rounded-xl bg-slate-50 p-3">
                <BedDouble className="h-4 w-4 text-slate-500" />
                <p className="mt-2 text-sm font-medium">{property.bedrooms} BHK</p>
              </div>
            )}
            {property.bathrooms && (
              <div className="rounded-xl bg-slate-50 p-3">
                <Bath className="h-4 w-4 text-slate-500" />
                <p className="mt-2 text-sm font-medium">{property.bathrooms} Baths</p>
              </div>
            )}
            {property.size_sqft && (
              <div className="rounded-xl bg-slate-50 p-3">
                <Ruler className="h-4 w-4 text-slate-500" />
                <p className="mt-2 text-sm font-medium">{property.size_sqft} sq.ft</p>
              </div>
            )}
            {property.furnishing && (
              <div className="rounded-xl bg-slate-50 p-3">
                <CheckCircle2 className="h-4 w-4 text-slate-500" />
                <p className="mt-2 text-sm font-medium capitalize">{property.furnishing.replace('_', ' ')}</p>
              </div>
            )}
          </div>

          {property.description && (
            <p className="mt-5 text-sm leading-6 text-slate-600">{property.description}</p>
          )}

          {property.amenities?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {property.amenities.map((amenity: string) => (
                <span key={amenity} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
