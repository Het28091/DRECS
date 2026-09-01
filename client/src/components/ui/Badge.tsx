import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'orange';

const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-700 text-slate-300',
  success:  'bg-green-900/40  text-green-400  border border-green-800/60',
  warning:  'bg-yellow-900/40 text-yellow-400 border border-yellow-800/60',
  danger:   'bg-red-900/40    text-red-400    border border-red-800/60',
  info:     'bg-blue-900/40   text-blue-400   border border-blue-800/60',
  orange:   'bg-orange-900/40 text-orange-400 border border-orange-800/60',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        badgeStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
