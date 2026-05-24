'use client';

import { useActionState } from 'react';
import { createProperty } from '@/app/actions/properties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

interface ProjectOption {
  id: string;
  name: string;
  builder_name: string | null;
  locality: string;
}

interface PropertyFormValues {
  project_id?: string | null;
  title?: string | null;
  location?: string | null;
  address?: string | null;
  property_type?: string | null;
  price?: number | null;
  size_sqft?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor?: number | null;
  furnishing?: string | null;
  availability?: string | null;
  description?: string | null;
  amenities?: string[] | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  tags?: string[] | null;
}

type PropertyFormState = {
  error?: string;
  success?: boolean;
} | null;

type PropertyFormAction = (prevState: PropertyFormState, formData: FormData) => Promise<PropertyFormState>;

interface PropertyFormProps {
  projects: ProjectOption[];
  action?: PropertyFormAction;
  initialValues?: PropertyFormValues;
  submitLabel?: string;
  pendingLabel?: string;
  cancelHref?: string;
}

export function PropertyForm({
  projects,
  action = createProperty,
  initialValues,
  submitLabel = 'Create Property',
  pendingLabel = 'Creating...',
  cancelHref,
}: PropertyFormProps) {
  const [state, formAction, pending] = useActionState<PropertyFormState, FormData>(action, null);
  const amenitiesValue = initialValues?.amenities?.join(', ') || '';
  const tagsValue = initialValues?.tags?.join(', ') || '';

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{state.error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Project / Society</label>
          <Select name="project_id" defaultValue={initialValues?.project_id || ''}>
            <option value="">Standalone unit or project not in catalog</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.builder_name || 'Independent'} - {project.locality}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <Input name="title" required placeholder="e.g. Tower 5 3BHK resale unit" defaultValue={initialValues?.title || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
          <Input name="location" required placeholder="e.g. Whitefield" defaultValue={initialValues?.location || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <Input name="address" defaultValue={initialValues?.address || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property Type *</label>
          <Select name="property_type" required defaultValue={initialValues?.property_type || 'apartment'}>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="plot">Plot</option>
            <option value="commercial">Commercial</option>
            <option value="rental">Rental</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
          <Input name="price" type="number" required placeholder="e.g. 7500000" defaultValue={initialValues?.price?.toString() || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Size (sq.ft)</label>
          <Input name="size_sqft" type="number" defaultValue={initialValues?.size_sqft?.toString() || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
          <Input name="bedrooms" type="number" defaultValue={initialValues?.bedrooms?.toString() || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
          <Input name="bathrooms" type="number" defaultValue={initialValues?.bathrooms?.toString() || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
          <Input name="floor" type="number" defaultValue={initialValues?.floor?.toString() || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Furnishing</label>
          <Select name="furnishing" defaultValue={initialValues?.furnishing || ''}>
            <option value="">Select...</option>
            <option value="unfurnished">Unfurnished</option>
            <option value="semi_furnished">Semi Furnished</option>
            <option value="fully_furnished">Fully Furnished</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
          <Select name="availability" defaultValue={initialValues?.availability || 'available'}>
            <option value="available">Available</option>
            <option value="hold">Hold</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <Textarea name="description" rows={3} defaultValue={initialValues?.description || ''} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma-separated)</label>
        <Input name="amenities" placeholder="Pool, Gym, Parking, Club House" defaultValue={amenitiesValue} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
          <Input name="owner_name" defaultValue={initialValues?.owner_name || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Owner Phone</label>
          <Input name="owner_phone" type="tel" defaultValue={initialValues?.owner_phone || ''} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
        <Input name="tags" placeholder="premium, golf-course, new-launch" defaultValue={tagsValue} />
      </div>

      <div className="flex gap-3">
        {cancelHref && (
          <Button type="button" variant="outline" asChild className="flex-1">
            <Link href={cancelHref}>Cancel</Link>
          </Button>
        )}
        <Button type="submit" loading={pending} loadingText={pendingLabel} className="flex-1">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
