import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  format?: 'number' | 'currency' | 'percentage';
  color?: 'default' | 'success' | 'warning' | 'destructive';
}

interface MobileStatsGridProps {
  stats: StatCardProps[];
  className?: string;
}

export function MobileStatsGrid({ stats, className }: MobileStatsGridProps) {
  const isMobile = useIsMobile();
  
  const formatValue = (value: string | number, format?: string) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('nb-NO', {
          style: 'currency',
          currency: 'NOK'
        }).format(value);
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString('nb-NO');
    }
  };
  
  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-orange-600';
      case 'destructive':
        return 'text-red-600';
      default:
        return 'text-foreground';
    }
  };
  
  return (
    <div className={cn(
      "grid gap-4",
      isMobile 
        ? "grid-cols-1 sm:grid-cols-2" 
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {stats.map((stat, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className={cn(
            "flex items-center justify-between",
            isMobile ? "p-4" : "p-6"
          )}>
            <div className="min-w-0 flex-1">
              <p className={cn(
                "font-medium text-muted-foreground truncate",
                isMobile ? "text-xs" : "text-sm"
              )}>
                {stat.title}
              </p>
              <p className={cn(
                "font-bold truncate",
                isMobile ? "text-lg" : "text-2xl",
                getColorClasses(stat.color)
              )}>
                {formatValue(stat.value, stat.format)}
              </p>
            </div>
            <div className={cn(
              "flex-shrink-0 ml-3",
              isMobile ? "h-6 w-6" : "h-8 w-8"
            )}>
              {stat.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}