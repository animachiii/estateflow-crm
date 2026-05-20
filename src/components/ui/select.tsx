import * as React from 'react';
import { cn } from '@/lib/utils';

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-11 w-full appearance-none rounded-xl bg-white pl-3.5 pr-9 text-[14px] text-slate-900',
          'ring-1 ring-slate-900/[0.08] shadow-[inset_0_1px_0_rgba(15,23,42,0.02)]',
          'transition-shadow duration-150',
          'bg-[url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2364748b%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27><polyline points=%276 9 12 15 18 9%27/></svg>")] bg-[length:12px_12px] bg-no-repeat bg-[right_14px_center]',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:shadow-[0_0_0_4px_rgba(79,70,229,0.10)]',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = 'Select';

export { Select };
