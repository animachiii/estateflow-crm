'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { signUp } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, null);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">EstateFlow</h1>
          </div>
          <p className="text-sm text-gray-500">Create your organization</p>
        </div>

        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{state.error}</div>
          )}
          <div>
            <label htmlFor="org_name" className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <Input id="org_name" name="org_name" required placeholder="Acme Real Estate" />
          </div>
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Your Full Name</label>
            <Input id="full_name" name="full_name" required />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <Input id="phone" name="phone" type="tel" placeholder="+91..." />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <Input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
