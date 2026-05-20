import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[88px] w-full rounded-xl bg-white px-3.5 py-2.5 text-[14px] text-slate-900',
          'ring-1 ring-slate-900/[0.08] shadow-[inset_0_1px_0_rgba(15,23,42,0.02)]',
          'placeholder:text-slate-400',
          'transition-shadow duration-150',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:shadow-[0_0_0_4px_rgba(79,70,229,0.10)]',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
