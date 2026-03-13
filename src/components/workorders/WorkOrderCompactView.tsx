import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { isInternalOrder } from '@/lib/internalOrders';
import { cn } from '@/lib/utils';

interface WorkOrderCompactViewProps {
  orders: any[];
  onViewDetails: (order: any) => void;
  getStatusColor: (status: string) => string;
}

export function WorkOrderCompactView({ 
  orders, 
  onViewDetails,
  getStatusColor
}: WorkOrderCompactViewProps) {
  return (
    <div className="space-y-2">
      {orders.map((order: any) => (
        <div 
          key={order.id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group",
            isInternalOrder(order) && "bg-muted/20 border-[hsl(var(--cobalt))]/20"
          )}
          onClick={() => onViewDetails(order)}
        >
          {/* Status Dot */}
          <div 
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              order.status === 'pending' ? 'bg-warning' :
              order.status === 'in_progress' ? 'bg-primary' :
              order.status === 'completed' ? 'bg-success' :
              order.status === 'cancelled' ? 'bg-destructive' :
              'bg-muted-foreground'
            }`}
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
              {order.title}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {order.customer?.name || 'Ingen kunde'} • #{order.id?.slice(-6)}
            </div>
          </div>

          {/* Quick Action */}
          <Button 
            variant="ghost" 
            size="sm"
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(order);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
