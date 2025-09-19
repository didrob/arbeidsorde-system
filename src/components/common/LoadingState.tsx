// Phase 4: Consistent Loading States
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
  rows?: number; // For skeleton variant
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  size = 'md',
  message,
  className,
  rows = 3
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              'w-full',
              size === 'sm' && 'h-4',
              size === 'md' && 'h-6', 
              size === 'lg' && 'h-8'
            )} 
          />
        ))}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-full bg-primary animate-pulse',
                size === 'sm' && 'h-2 w-2',
                size === 'md' && 'h-3 w-3',
                size === 'lg' && 'h-4 w-4'
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
        {message && (
          <span className="ml-3 text-sm text-muted-foreground">{message}</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {message && (
        <span className="ml-2 text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
};

// Specialized loading components
export const PageLoadingState: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="min-h-[400px] flex items-center justify-center">
    <LoadingState variant="spinner" size="lg" message={message} />
  </div>
);

export const CardLoadingState: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="p-4 space-y-3">
    <LoadingState variant="skeleton" rows={rows} />
  </div>
);

export const ButtonLoadingState: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <span className="flex items-center">
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    {children || 'Loading...'}
  </span>
);

export const InlineLoadingState: React.FC<{ message?: string }> = ({ message }) => (
  <LoadingState variant="dots" size="sm" message={message} className="py-2" />
);