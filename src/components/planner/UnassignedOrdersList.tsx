import { WorkOrder } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface UnassignedOrdersListProps {
  orders: WorkOrder[];
}

function DraggableOrderCard({ order }: { order: WorkOrder }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `unassigned-${order.id}`,
    data: { order },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (estimatedHours?: number) => {
    if (!estimatedHours) return 'bg-muted';
    if (estimatedHours > 6) return 'bg-destructive/10 border-destructive/20';
    if (estimatedHours > 3) return 'bg-warning/10 border-warning/20';
    return 'bg-success/10 border-success/20';
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${getPriorityColor(order.estimated_hours)}`}>
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm text-foreground line-clamp-1">
              {order.title}
            </h4>
            <Badge variant="outline" className="text-xs shrink-0 ml-2">
              {order.status === 'pending' ? 'Venter' : 'Pågår'}
            </Badge>
          </div>
          
          {order.customer && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {order.customer.name}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {order.estimated_hours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{order.estimated_hours}t</span>
              </div>
            )}
            {order.gps_location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>Lokasjon</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function UnassignedOrdersList({ orders }: UnassignedOrdersListProps) {
  return (
    <div className="w-80 bg-muted/30 border-r border-border p-4 overflow-y-auto">
      <div className="sticky top-0 bg-muted/30 pb-3 mb-3 border-b border-border">
        <h3 className="font-semibold text-foreground">
          Ufordelte Ordre
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {orders.length} ordre tilgjengelig
        </p>
      </div>

      <div className="space-y-2">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Ingen ufordelte ordre
          </p>
        ) : (
          orders.map((order) => (
            <DraggableOrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  );
}
