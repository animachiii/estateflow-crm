'use client';

import { useActionState } from 'react';
import { createSocialPost } from '@/app/actions/social';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function NewSocialPostPage() {
  const [state, formAction, pending] = useActionState(createSocialPost, null);

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">New Social Post</h1>

      <form action={formAction} className="space-y-4">
        {state?.error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{state.error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Post Type *</label>
          <Select name="post_type" required>
            <option value="instagram_reel">Instagram Reel</option>
            <option value="instagram_post">Instagram Post</option>
            <option value="facebook_post">Facebook Post</option>
            <option value="linkedin_post">LinkedIn Post</option>
            <option value="story">Story</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Caption *</label>
          <Textarea name="caption" required rows={4} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <Select name="status" defaultValue="draft">
            <option value="idea">Idea</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Date</label>
          <Input name="scheduled_at" type="datetime-local" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <Textarea name="notes" rows={2} />
        </div>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Creating...' : 'Create Post'}
        </Button>
      </form>
    </div>
  );
}
