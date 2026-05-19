'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function getAuthProfile() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) throw new Error('Profile not found');
  return { supabase, user, profile };
}

export async function createSocialPost(_prevState: unknown, formData: FormData) {
  const { supabase, profile } = await getAuthProfile();

  const postType = formData.get('post_type') as string;
  const caption = formData.get('caption') as string;
  const status = formData.get('status') as string || 'draft';
  const scheduledAt = formData.get('scheduled_at') as string;
  const assignedTo = formData.get('assigned_to') as string;
  const notes = formData.get('notes') as string;

  if (!postType || !caption) return { error: 'Post type and caption are required' };

  const { error } = await supabase.from('social_posts').insert({
    organization_id: profile.organization_id,
    post_type: postType,
    caption,
    status,
    scheduled_at: scheduledAt || null,
    assigned_to: assignedTo || null,
    notes: notes || null,
    media_urls: [],
  });

  if (error) return { error: error.message };
  revalidatePath('/social');
  redirect('/social');
}

export async function updateSocialPostStatus(postId: string, status: string) {
  const { supabase } = await getAuthProfile();
  const update: Record<string, unknown> = { status };
  if (status === 'published') update.published_at = new Date().toISOString();
  await supabase.from('social_posts').update(update).eq('id', postId);
  revalidatePath('/social');
}

export async function deleteSocialPost(postId: string) {
  const { supabase } = await getAuthProfile();
  await supabase.from('social_posts').delete().eq('id', postId);
  revalidatePath('/social');
}
