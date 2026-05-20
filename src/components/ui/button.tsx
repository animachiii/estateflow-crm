import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'press inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl text-[13px] font-medium',
    'select-none tracking-tight',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    'disabled:pointer-events-none disabled:opacity-50',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),_0_1px_2px_rgba(15,23,42,0.10),_0_6px_16px_-8px_rgba(79,70,229,0.45)] hover:from-indigo-500 hover:to-indigo-700',
        destructive:
          'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),_0_1px_2px_rgba(15,23,42,0.10),_0_6px_16px_-8px_rgba(244,63,94,0.45)] hover:from-rose-500 hover:to-rose-700',
        outline:
          'bg-white text-slate-700 ring-1 ring-slate-900/10 shadow-sm hover:bg-slate-50',
        secondary:
          'bg-slate-100 text-slate-900 ring-1 ring-slate-900/[0.04] hover:bg-slate-200/70',
        ghost:
          'text-slate-700 hover:bg-slate-100',
        link:
          'text-indigo-600 underline-offset-4 hover:underline',
        success:
          'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),_0_1px_2px_rgba(15,23,42,0.10),_0_6px_16px_-8px_rgba(16,185,129,0.45)] hover:from-emerald-500 hover:to-emerald-700',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-[15px]',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, loadingText, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    // When asChild is true (e.g. wrapping a Link), Slot requires a single child.
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {children as React.ReactElement}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {loading && loadingText ? loadingText : children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
