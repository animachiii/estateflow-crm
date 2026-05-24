import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { LeadForm } from '@/components/leads/lead-form';

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const [{ data: lead }, { data: agents }] = await Promise.all([
    supabase.from('leads').select('*').eq('id', id).single(),
    supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['sales_agent', 'sales_manager', 'admin']),
  ]);

  if (!lead) return notFound();

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/leads/${lead.id}`}><ArrowLeft className="h-5 w-5 text-gray-500" /></Link>
        <h1 className="text-xl font-bold text-gray-900">Edit Lead</h1>
      </div>
      <LeadForm agents={agents || []} lead={lead} mode="edit" />
    </div>
  );
}
