'use client';

import { useActionState } from 'react';
import { createLead } from '@/app/actions/leads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface LeadFormProps {
  agents: { id: string; full_name: string }[];
}

export function LeadForm({ agents }: LeadFormProps) {
  const [state, formAction, pending] = useActionState(createLead, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{state.error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <Input name="full_name" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <Input name="phone" type="tel" required placeholder="+91..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <Input name="email" type="email" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
          <Select name="source" defaultValue="manual">
            <option value="36_acre">36 Acre</option>
            <option value="magicbricks">MagicBricks</option>
            <option value="housing">Housing.com</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="manual">Manual</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
          <Select name="property_type">
            <option value="">Select...</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="plot">Plot</option>
            <option value="commercial">Commercial</option>
            <option value="rental">Rental</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Location</label>
          <Input name="preferred_location" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget Min</label>
          <Input name="budget_min" type="number" placeholder="e.g. 5000000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget Max</label>
          <Input name="budget_max" type="number" placeholder="e.g. 10000000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
          <Select name="temperature" defaultValue="warm">
            <option value="cold">Cold</option>
            <option value="warm">Warm</option>
            <option value="hot">Hot</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assign Agent</label>
          <Select name="assigned_agent_id">
            <option value="">Auto-assign</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <Textarea name="notes" rows={3} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? 'Creating...' : 'Create Lead'}
        </Button>
      </div>
    </form>
  );
}
