'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

const availabilityColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  hold: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-red-100 text-red-800',
  rented: 'bg-blue-100 text-blue-800',
};

interface Props {
  properties: any[];
  filters: { type: string; availability: string; q: string };
}

export function PropertiesList({ properties, filters }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(filters.q);

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Properties</h1>
        <Link href="/properties/new">
          <Button size="sm"><Plus className="h-4 w-4" /> Add</Button>
        </Link>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); applyFilter('q', search); }} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search properties..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </form>

      <div className="flex gap-2">
        <Select value={filters.type} onChange={(e) => applyFilter('type', e.target.value)} className="w-auto">
          <option value="">All Types</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
          <option value="plot">Plot</option>
          <option value="commercial">Commercial</option>
          <option value="rental">Rental</option>
        </Select>
        <Select value={filters.availability} onChange={(e) => applyFilter('availability', e.target.value)} className="w-auto">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="hold">Hold</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
        </Select>
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties found"
          description="Add your first property listing"
          action={<Link href="/properties/new"><Button size="sm">Add Property</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => {
            const primaryImage = p.images?.find((i: any) => i.is_primary) || p.images?.[0];
            return (
              <Link key={p.id} href={`/properties/${p.id}`}>
                <Card className="hover:shadow-md transition-shadow overflow-hidden">
                  <div className="h-40 bg-gray-100 flex items-center justify-center">
                    {primaryImage ? (
                      <img src={primaryImage.url} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="h-12 w-12 text-gray-300" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{p.title}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {p.location}
                        </p>
                      </div>
                      <Badge className={availabilityColors[p.availability]}>{p.availability}</Badge>
                    </div>
                    <p className="text-base font-bold text-gray-900 mt-2">{formatCurrency(p.price)}</p>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                      {p.bedrooms && <span>{p.bedrooms} BHK</span>}
                      {p.size_sqft && <span>{p.size_sqft} sq.ft</span>}
                      <span className="capitalize">{p.property_type}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
