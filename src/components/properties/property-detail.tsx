'use client';

import Link from 'next/link';
import { ArrowLeft, MapPin, Building2, Bed, Bath, Maximize, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

const availabilityColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  hold: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-red-100 text-red-800',
  rented: 'bg-blue-100 text-blue-800',
};

export function PropertyDetail({ property }: { property: any }) {
  const images = property.images || [];

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/properties"><ArrowLeft className="h-5 w-5 text-gray-500" /></Link>
        <h1 className="text-lg font-bold text-gray-900 flex-1">{property.title}</h1>
        <Badge className={availabilityColors[property.availability]}>{property.availability}</Badge>
      </div>

      {/* Image Gallery */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 rounded-xl overflow-hidden">
          {images.map((img: any, i: number) => (
            <div key={img.id} className={i === 0 ? 'col-span-2 row-span-2' : ''}>
              <img src={img.url} alt={img.caption || property.title} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center">
          <Building2 className="h-16 w-16 text-gray-300" />
        </div>
      )}

      {/* Price + Key Info */}
      <Card>
        <CardContent className="p-4">
          <p className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(property.price)}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <MapPin className="h-4 w-4" /> {property.location}
            {property.address && <span>· {property.address}</span>}
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="capitalize flex items-center gap-1">
              <Building2 className="h-4 w-4 text-gray-400" /> {property.property_type}
            </span>
            {property.bedrooms && <span className="flex items-center gap-1"><Bed className="h-4 w-4 text-gray-400" /> {property.bedrooms} BHK</span>}
            {property.bathrooms && <span className="flex items-center gap-1"><Bath className="h-4 w-4 text-gray-400" /> {property.bathrooms} Bath</span>}
            {property.size_sqft && <span className="flex items-center gap-1"><Maximize className="h-4 w-4 text-gray-400" /> {property.size_sqft} sq.ft</span>}
            {property.floor !== null && <span>Floor: {property.floor}</span>}
            {property.furnishing && <span className="capitalize">{property.furnishing.replace('_', ' ')}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {property.description && (
        <Card>
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-600 whitespace-pre-wrap">{property.description}</p></CardContent>
        </Card>
      )}

      {/* Amenities */}
      {property.amenities?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((a: string) => (
                <Badge key={a} variant="secondary">{a}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {property.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {property.tags.map((t: string) => (
            <Badge key={t} variant="outline" className="flex items-center gap-1"><Tag className="h-3 w-3" /> {t}</Badge>
          ))}
        </div>
      )}

      {/* Owner Info */}
      {(property.owner_name || property.owner_phone) && (
        <Card>
          <CardHeader><CardTitle>Owner / Developer</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            {property.owner_name && <p>{property.owner_name}</p>}
            {property.owner_phone && <p className="text-gray-500">{property.owner_phone}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
