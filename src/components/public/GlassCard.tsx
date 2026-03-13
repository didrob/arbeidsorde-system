import { ReactNode } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}

export function GlassCard({ children, className, accent = false }: GlassCardProps) {
  const { isDark } = useTheme();

  return (
    <div
      className={cn(
        'transition-all duration-300',
        isDark ? 'glass-card' : 'glass-card-light',
        accent && 'border-asco-teal/30',
        className
      )}
    >
      {children}
    </div>
  );
}
