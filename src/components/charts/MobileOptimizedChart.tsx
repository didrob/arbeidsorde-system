import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

interface MobileOptimizedChartProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  config: any;
  className?: string;
  mobileHeight?: string;
  desktopHeight?: string;
}

export function MobileOptimizedChart({
  title,
  description,
  icon,
  children,
  config,
  className,
  mobileHeight = "h-[180px]",
  desktopHeight = "h-[200px]"
}: MobileOptimizedChartProps) {
  const isMobile = useIsMobile();
  
  return (
    <Card className={className}>
      <CardHeader className={cn("space-y-1", isMobile && "pb-3")}>
        <CardTitle className={cn(
          "flex items-center gap-2",
          isMobile ? "text-base" : "text-lg"
        )}>
          {icon}
          {title}
        </CardTitle>
        {description && (
          <p className={cn(
            "text-muted-foreground",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent className={cn(isMobile && "px-2 pb-2")}>
        <ChartContainer
          config={config}
          className={cn(
            isMobile ? mobileHeight : desktopHeight
          )}
        >
          <div className="w-full h-full">
            {children}
          </div>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}