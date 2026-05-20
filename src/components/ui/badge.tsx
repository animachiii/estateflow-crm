import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-[1.4] tracking-tight',
        variant === 'default' && 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/15',
        variant === 'secondary' && 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-600/10',
        variant === 'outline' && 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300',
        className,
      )}
      {...props}
    />
  );
}
