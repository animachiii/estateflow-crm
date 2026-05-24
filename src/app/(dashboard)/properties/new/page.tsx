import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PropertyForm } from '@/components/properties/property-form';
import { PropertyImportForm } from '@/components/properties/property-import-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Upload } from 'lucide-react';

export default async function NewPropertyPage() {
  const supabase = await createServerSupabaseClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, builder_name, locality')
    .order('name');

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900">Add Inventory</h1>
          <p className="text-sm text-slate-500">
            Add a single unit manually or bring in an entire project sheet from your existing broker inventory export.
          </p>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Add Single Unit
              </CardTitle>
              <CardDescription>
                Best for one-off resale, rental, or owner-sourced stock that needs a quick entry.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyForm projects={projects || []} />
            </CardContent>
          </Card>

          <Card id="import-csv">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-4 w-4" /> Bulk Import
              </CardTitle>
              <CardDescription>
                Bring in society-wise unit sheets from Excel, Google Sheets, MagicBricks exports, or internal ops trackers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PropertyImportForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
