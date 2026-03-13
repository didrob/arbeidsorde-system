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
        'backdrop-blur-[20px] rounded-brand shadow-brand-lg transition-all duration-300',
        'bg-white/[0.08] border border-white/[0.15]',
        'hover:border-white/[0.25] hover:shadow-[0_0_30px_rgba(0,253,199,0.08)]',
        accent && 'border-asco-teal/30 hover:border-asco-teal/50',
        className
      )}
    >
      {children}
    </div>
  );
}
