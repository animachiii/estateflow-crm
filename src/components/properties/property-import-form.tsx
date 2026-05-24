'use client';

import { useActionState } from 'react';
import { importPropertiesCsv } from '@/app/actions/properties';
import { Button } from '@/components/ui/button';
import { AlertCircle, Building2, CheckCircle2, Download, Upload } from 'lucide-react';

type ImportState = {
  success?: boolean;
  error?: string;
  imported?: number;
  failed?: number;
  createdProjects?: number;
  createdProjectNames?: string[];
  errors?: Array<{ row: number; message: string }>;
} | null;

export function PropertyImportForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(importPropertiesCsv, null);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-900/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900">Start with the template</p>
            <p className="text-xs text-slate-500">
              Core columns: <span className="font-mono">project_name, locality, property_type, price</span>. Optional fields like <span className="font-mono">bedrooms</span>, <span className="font-mono">amenities</span>, and <span className="font-mono">owner_phone</span> are supported too.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href="/property-import-template.csv" download>
              <Download className="h-4 w-4" /> Download template
            </a>
          </Button>
        </div>
      </div>

      {state?.error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Imported {state.imported} properties.
          {(state.createdProjects ?? 0) > 0 ? ` Created ${state.createdProjects} new project${state.createdProjects === 1 ? '' : 's'} automatically.` : ''}
          {(state.failed ?? 0) > 0 ? ` ${state.failed} row${state.failed === 1 ? '' : 's'} still need attention.` : ''}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">CSV file</label>
          <input
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="block h-11 w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-900/[0.08] file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>

        <label className="flex items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-900/[0.08]">
          <input
            type="checkbox"
            name="create_missing_projects"
            defaultChecked
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="space-y-0.5">
            <span className="block text-sm font-medium text-slate-900">Create missing project or society records automatically</span>
            <span className="block text-xs text-slate-500">
              Useful when your CSV has projects outside the seeded catalog. The importer will create org-specific project rows and attach units to them.
            </span>
          </span>
        </label>

        <div className="grid gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-900/[0.08]">
          <div className="flex items-start gap-2 text-sm text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
            Price fields accept values like <span className="font-mono">18500000</span> or <span className="font-mono">1,85,00,000</span>.
          </div>
          <div className="flex items-start gap-2 text-sm text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
            Amenities and tags can be separated with <span className="font-mono">|</span> to avoid CSV quoting headaches.
          </div>
          <div className="flex items-start gap-2 text-sm text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
            If <span className="font-mono">title</span> is blank, the importer will generate a sensible unit title from BHK, type, and project.
          </div>
        </div>

        <Button type="submit" loading={pending} loadingText="Importing..." className="w-full">
          <Upload className="h-4 w-4" /> Import Properties
        </Button>
      </form>

      {state?.createdProjectNames && state.createdProjectNames.length > 0 && (
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-900/[0.08]">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-900">
            <Building2 className="h-4 w-4 text-indigo-600" /> New projects created from this CSV
          </p>
          <div className="flex flex-wrap gap-2">
            {state.createdProjectNames.slice(0, 8).map((projectName) => (
              <span key={projectName} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                {projectName}
              </span>
            ))}
            {state.createdProjectNames.length > 8 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                +{state.createdProjectNames.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {state?.errors && state.errors.length > 0 && (
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-900/[0.08]">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
            <AlertCircle className="h-4 w-4 text-amber-600" /> Rows to fix
          </p>
          <div className="space-y-2">
            {state.errors.map((issue) => (
              <div key={`${issue.row}-${issue.message}`} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <span className="font-semibold">Row {issue.row}:</span> {issue.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
