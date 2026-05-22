'use client';

import { useActionState } from 'react';
import { createProperty } from '@/app/actions/properties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ProjectOption {
  id: string;
  name: string;
  builder_name: string | null;
  locality: string;
}

export function PropertyForm({ projects }: { projects: ProjectOption[] }) {
  const [state, formAction, pending] = useActionState(createProperty, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{state.error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Project / Society</label>
          <Select name="project_id" defaultValue="">
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
          <Input name="title" required placeholder="e.g. Tower 5 3BHK resale unit" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
          <Input name="location" required placeholder="e.g. Whitefield" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <Input name="address" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property Type *</label>
          <Select name="property_type" required>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="plot">Plot</option>
            <option value="commercial">Commercial</option>
            <option value="rental">Rental</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
          <Input name="price" type="number" required placeholder="e.g. 7500000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Size (sq.ft)</label>
          <Input name="size_sqft" type="number" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
          <Input name="bedrooms" type="number" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
          <Input name="bathrooms" type="number" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
          <Input name="floor" type="number" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Furnishing</label>
          <Select name="furnishing">
            <option value="">Select...</option>
            <option value="unfurnished">Unfurnished</option>
            <option value="semi_furnished">Semi Furnished</option>
            <option value="fully_furnished">Fully Furnished</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
          <Select name="availability" defaultValue="available">
            <option value="available">Available</option>
            <option value="hold">Hold</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <Textarea name="description" rows={3} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma-separated)</label>
        <Input name="amenities" placeholder="Pool, Gym, Parking, Club House" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
          <Input name="owner_name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Owner Phone</label>
          <Input name="owner_phone" type="tel" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
        <Input name="tags" placeholder="premium, golf-course, new-launch" />
      </div>

      <Button type="submit" loading={pending} loadingText="Creating..." className="w-full">
        Create Property
      </Button>
    </form>
  );
}
