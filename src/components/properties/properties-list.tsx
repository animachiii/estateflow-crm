import Link from 'next/link';
import { Plus, Search, Building2, MapPin, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';

const availabilityColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  hold: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-red-100 text-red-800',
  rented: 'bg-blue-100 text-blue-800',
};

interface Props {
  properties: any[];
  projects: {
    id: string;
    name: string;
    builder_name: string | null;
    locality: string;
    micro_market: string | null;
  }[];
  filters: {
    type: string;
    availability: string;
    q: string;
    locality: string;
    builder: string;
    project: string;
    bedrooms: string;
    furnishing: string;
    minPrice: string;
    maxPrice: string;
  };
}

export function PropertiesList({ properties, projects, filters }: Props) {
  const builders = [...new Set(projects.map((project) => project.builder_name).filter(Boolean))] as string[];
  const localities = [...new Set(projects.flatMap((project) => [project.locality, project.micro_market]).filter(Boolean))] as string[];
  const groups = properties.reduce<Map<string, { project: any; properties: any[] }>>((result, property) => {
    const key = property.project?.id || 'standalone';
    const group = result.get(key) || {
      project: property.project || null,
      properties: [],
    };
    group.properties.push(property);
    result.set(key, group);
    return result;
  }, new Map<string, { project: any; properties: any[] }>());

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Properties</h1>
        <Link href="/properties/new">
          <Button size="sm"><Plus className="h-4 w-4" /> Add</Button>
        </Link>
      </div>

      <form action="/properties" className="space-y-3 rounded-lg bg-white p-3 ring-1 ring-slate-900/[0.06]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input name="q" placeholder="Search unit, project, builder, locality..." className="pl-9" defaultValue={filters.q} />
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          <Select name="locality" defaultValue={filters.locality}>
            <option value="">All localities</option>
            {localities.map((locality) => <option key={locality} value={locality}>{locality}</option>)}
          </Select>
          <Select name="builder" defaultValue={filters.builder}>
            <option value="">All builders</option>
            {builders.map((builder) => <option key={builder} value={builder}>{builder}</option>)}
          </Select>
          <Select name="project" defaultValue={filters.project} className="col-span-2 lg:col-span-1">
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </Select>
          <Select name="bedrooms" defaultValue={filters.bedrooms}>
            <option value="">Any BHK</option>
            {[1, 2, 3, 4, 5].map((bedrooms) => <option key={bedrooms} value={bedrooms}>{bedrooms} BHK</option>)}
          </Select>
          <Select name="availability" defaultValue={filters.availability}>
            <option value="">All status</option>
            <option value="available">Available</option>
            <option value="hold">Hold</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
          </Select>
          <Select name="type" defaultValue={filters.type}>
            <option value="">All types</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="plot">Plot</option>
            <option value="commercial">Commercial</option>
            <option value="rental">Rental</option>
          </Select>
          <Select name="furnishing" defaultValue={filters.furnishing}>
            <option value="">Any furnishing</option>
            <option value="unfurnished">Unfurnished</option>
            <option value="semi_furnished">Semi Furnished</option>
            <option value="fully_furnished">Fully Furnished</option>
          </Select>
          <Input name="minPrice" type="number" min="0" placeholder="Min price" defaultValue={filters.minPrice} />
          <Input name="maxPrice" type="number" min="0" placeholder="Max price, e.g. 20000000" defaultValue={filters.maxPrice} />
          <div className="col-span-2 flex gap-2 lg:col-span-1">
            <Button type="submit" className="flex-1"><SlidersHorizontal className="h-4 w-4" /> Filter</Button>
            <Link href="/properties"><Button type="button" variant="outline">Clear</Button></Link>
          </div>
        </div>
      </form>

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties found"
          description="Add your first property listing"
          action={<Link href="/properties/new"><Button size="sm">Add Property</Button></Link>}
        />
      ) : (
        Array.from(groups.values()).map((group) => (
          <section key={group.project?.id || 'standalone'} className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{group.project?.name || 'Standalone Units'}</h2>
                {group.project && (
                  <p className="text-xs text-gray-500">
                    {group.project.builder_name || 'Independent'} / {group.project.locality}
                    {group.project.micro_market ? ` / ${group.project.micro_market}` : ''}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500">{group.properties.length} unit{group.properties.length === 1 ? '' : 's'}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.properties.map((property: any) => {
                const primaryImage = property.images?.find((image: any) => image.is_primary) || property.images?.[0];
                return (
                  <Link key={property.id} href={`/properties/${property.id}`}>
                    <Card className="hover:shadow-md transition-shadow overflow-hidden">
                      <div className="h-40 bg-gray-100 flex items-center justify-center">
                        {primaryImage ? (
                          <img src={primaryImage.url} alt={property.title} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="h-12 w-12 text-gray-300" />
                        )}
                      </div>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{property.title}</h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" /> {property.location}
                            </p>
                          </div>
                          <Badge className={availabilityColors[property.availability]}>{property.availability}</Badge>
                        </div>
                        <p className="text-base font-bold text-gray-900 mt-2">{formatCurrency(property.price)}</p>
                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                          {property.bedrooms && <span>{property.bedrooms} BHK</span>}
                          {property.size_sqft && <span>{property.size_sqft} sq.ft</span>}
                          <span className="capitalize">{property.property_type}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
