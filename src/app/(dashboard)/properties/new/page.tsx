import { PropertyForm } from '@/components/properties/property-form';

export default function NewPropertyPage() {
  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Add Property</h1>
      <PropertyForm />
    </div>
  );
}
