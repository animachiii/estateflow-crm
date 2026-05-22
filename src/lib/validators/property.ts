import { z } from 'zod';

export const propertySchema = z.object({
  project_id: z.preprocess(
    (value) => value === '' ? null : value,
    z.string().uuid('Select a valid project').optional().nullable(),
  ),
  title: z.string().min(1, 'Title is required').max(300),
  location: z.string().min(1, 'Location is required').max(300),
  address: z.string().max(500).optional().nullable(),
  property_type: z.enum(['apartment', 'villa', 'plot', 'commercial', 'rental']),
  price: z.coerce.number().min(0, 'Price must be positive'),
  size_sqft: z.coerce.number().min(0).optional().nullable(),
  bedrooms: z.coerce.number().min(0).max(50).optional().nullable(),
  bathrooms: z.coerce.number().min(0).max(50).optional().nullable(),
  floor: z.coerce.number().optional().nullable(),
  furnishing: z.enum(['unfurnished', 'semi_furnished', 'fully_furnished']).optional().nullable(),
  availability: z.enum(['available', 'hold', 'sold', 'rented']).default('available'),
  description: z.string().max(10000).optional().nullable(),
  amenities: z.array(z.string()).default([]),
  owner_name: z.string().max(200).optional().nullable(),
  owner_phone: z.string().max(20).optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export type PropertyInput = z.infer<typeof propertySchema>;
