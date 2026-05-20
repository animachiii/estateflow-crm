'use server';

import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getSupabaseSetupError } from '@/lib/supabase/config';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

function getAuthErrorMessage(error: unknown) {
  if (error instanceof TypeError && error.message === 'fetch failed') {
    return 'Could not connect to Supabase. Check NEXT_PUBLIC_SUPABASE_URL in .env.local, then restart the server.';
  }

  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export async function signIn(_prevState: unknown, formData: FormData) {
  const setupError = getSupabaseSetupError();
  if (setupError) return { error: setupError };

  const supabase = await createServerSupabaseClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password }).catch((error: unknown) => ({
    error: { message: getAuthErrorMessage(error) },
  }));

  if (error) {
    return { error: error.message };
  }

  redirect('/');
}

export async function signUp(_prevState: unknown, formData: FormData) {
  const setupError = getSupabaseSetupError();
  if (setupError) return { error: setupError };

  const supabase = await createServerSupabaseClient();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const orgName = formData.get('org_name') as string;
  const phone = formData.get('phone') as string;

  if (!email || !password || !fullName || !orgName) {
    return { error: 'All fields are required' };
  }

  const serviceClient = createServiceRoleClient();

  // Use admin.createUser so we can skip email confirmation. Falls back to
  // a clear error if the email is already registered.
  const { data: created, error: createError } = await serviceClient.auth.admin
    .createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    .catch((error: unknown) => ({ data: null, error: { message: getAuthErrorMessage(error) } }));

  if (createError) {
    const msg = createError.message || '';
    if (/already registered|already exists|duplicate/i.test(msg)) {
      return { error: 'An account with this email already exists. Try signing in instead.' };
    }
    return { error: msg || 'Signup failed' };
  }
  if (!created?.user) return { error: 'Signup failed' };

  const authData = { user: created.user };

  // Establish a session immediately so the redirect to "/" lands on the dashboard.
  const { error: signInError } = await supabase.auth
    .signInWithPassword({ email, password })
    .catch((error: unknown) => ({ error: { message: getAuthErrorMessage(error) } }));
  if (signInError) {
    return { error: `Account created but auto-login failed: ${signInError.message}. Please sign in manually.` };
  }

  const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const { data: org, error: orgError } = await serviceClient
    .from('organizations')
    .insert({ name: orgName, slug })
    .select()
    .single();

  if (orgError) return { error: 'Failed to create organization' };

  await serviceClient.from('profiles').insert({
    id: authData.user.id,
    email,
    full_name: fullName,
    phone: phone || null,
    organization_id: org.id,
    role: 'admin',
  });

  await serviceClient.from('integration_settings').insert({
    organization_id: org.id,
  });

  // Insert default follow-up templates
  await serviceClient.from('followup_templates').insert([
    {
      organization_id: org.id,
      name: 'Check Property Details',
      type: 'whatsapp',
      message: 'Hi {{leadName}}, just checking if you had a chance to review the property details I shared.',
      is_default: true,
    },
    {
      organization_id: org.id,
      name: 'Quick Call',
      type: 'whatsapp',
      message: 'Hi {{leadName}}, are you available for a quick call today to discuss properties in {{preferredLocation}}?',
      is_default: true,
    },
    {
      organization_id: org.id,
      name: 'New Options',
      type: 'whatsapp',
      message: 'Hi {{leadName}}, we have a few new options matching your budget. Should I share them?',
      is_default: true,
    },
  ]);

  redirect('/');
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function inviteTeamMember(_prevState: unknown, formData: FormData) {
  const setupError = getSupabaseSetupError();
  if (setupError) return { error: setupError };

  const supabase = await createServerSupabaseClient();
  const serviceClient = createServiceRoleClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'sales_manager')) {
    return { error: 'Only admins and managers can invite members' };
  }

  const email = formData.get('email') as string;
  const fullName = formData.get('full_name') as string;
  const role = formData.get('role') as string;
  const phone = formData.get('phone') as string;

  if (!email || !fullName || !role) return { error: 'All fields are required' };

  const tempPassword = `Welcome${Date.now()}!`;
  const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError) return { error: createError.message };
  if (!newUser.user) return { error: 'Failed to create user' };

  await serviceClient.from('profiles').insert({
    id: newUser.user.id,
    email,
    full_name: fullName,
    phone: phone || null,
    organization_id: profile.organization_id,
    role,
  });

  revalidatePath('/team');
  return { success: true, tempPassword };
}
