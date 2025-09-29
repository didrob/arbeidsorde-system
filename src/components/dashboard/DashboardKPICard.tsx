import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardKPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  format?: 'number' | 'currency' | 'percentage';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  comparison?: {
    value: string | number;
    label: string;
  };
  status?: 'success' | 'warning' | 'destructive' | 'default';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function DashboardKPICard({
  title,
  value,
  icon,
  format = 'number',
  trend,
  comparison,
  status = 'default',
  action,
  className
}: DashboardKPICardProps) {
  const formatValue = (val: string | number, fmt: string) => {
    if (typeof val === 'string') return val;
    
    switch (fmt) {
      case 'currency':
        return new Intl.NumberFormat('nb-NO', {
          style: 'currency',
          currency: 'NOK',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString('nb-NO');
    }
  };

  const getStatusStyles = (st: string) => {
    switch (st) {
      case 'success':
        return 'border-l-4 border-l-success bg-gradient-to-r from-success/5 to-transparent';
      case 'warning':
        return 'border-l-4 border-l-warning bg-gradient-to-r from-warning/5 to-transparent';
      case 'destructive':
        return 'border-l-4 border-l-destructive bg-gradient-to-r from-destructive/5 to-transparent';
      default:
        return 'border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-success" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-destructive" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTrendTextColor = () => {
    if (!trend) return 'text-muted-foreground';
    
    switch (trend.direction) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200 hover:shadow-card cursor-pointer group",
      getStatusStyles(status),
      className
    )}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-background shadow-sm">
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              {comparison && (
                <p className="text-xs text-muted-foreground">{comparison.label}</p>
              )}
            </div>
          </div>
          {action && (
            <button
              onClick={action.onClick}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary hover:text-primary/80 font-medium"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Main Value */}
        <div className="mb-4">
          <div className="text-3xl font-bold text-foreground mb-1">
            {formatValue(value, format)}
          </div>
          {comparison && (
            <div className="text-sm text-muted-foreground">
              vs {formatValue(comparison.value, format)}
            </div>
          )}
        </div>

        {/* Trend and Status */}
        <div className="flex items-center justify-between">
          {trend && (
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <span className={cn("text-sm font-medium", getTrendTextColor())}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-muted-foreground">
                  {trend.label}
                </span>
              )}
            </div>
          )}
          
          {status !== 'default' && (
            <Badge variant={status === 'success' ? 'default' : status === 'destructive' ? 'destructive' : 'secondary'}>
              {status === 'success' ? 'På mål' : 
               status === 'destructive' ? 'Kritisk' : 'Normal'}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}