import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}

export function GlassCard({ children, className, accent = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-[16px] transition-all duration-300',
        'bg-white/[0.06] border border-white/[0.12]',
        'hover:border-white/[0.25]',
        accent && 'border-[rgba(0,253,199,0.3)] hover:border-asco-teal',
        className
      )}
    >
      {children}
    </div>
  );
}
