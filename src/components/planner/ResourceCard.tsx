import { useDroppable } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ResourceWithUtilization } from '@/lib/plannerUtils';
import { getUtilizationBgClass, getUtilizationTextClass } from '@/lib/plannerUtils';

interface ResourceCardProps {
  resource: ResourceWithUtilization;
  onClick: () => void;
}

export function ResourceCard({ resource, onClick }: ResourceCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `resource-${resource.id}`,
    data: {
      type: 'resource-card',
      personnelId: resource.id,
    },
  });

  const remainingHours = Math.max(0, resource.capacity - resource.allocatedHours);
  const utilizationPercent = Math.min(100, resource.utilization);

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        'p-4 cursor-pointer transition-all hover:shadow-lg',
        getUtilizationBgClass(resource.utilization),
        isOver && 'ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div>
          <h3 className="font-semibold text-sm">{resource.name}</h3>
          <p className="text-xs text-muted-foreground">{resource.role || 'Arbeider'}</p>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <Progress value={utilizationPercent} className="h-2" />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {resource.allocatedHours.toFixed(1)} / {resource.capacity}t
            </span>
            <span className={cn('font-medium', getUtilizationTextClass(resource.utilization))}>
              {resource.utilization.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Allocated orders */}
        {resource.allocatedOrders.length > 0 && (
          <div className="space-y-2">
            {resource.allocatedOrders.slice(0, 3).map(order => (
              <div key={order.id} className="text-xs p-2 bg-background/50 rounded border">
                <div className="font-medium truncate">{order.title}</div>
                <div className="text-muted-foreground truncate">
                  {order.customer?.name}
                </div>
              </div>
            ))}
            {resource.allocatedOrders.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{resource.allocatedOrders.length - 3} til
              </Badge>
            )}
          </div>
        )}

        {/* Remaining capacity */}
        <div className={cn('text-xs font-medium', getUtilizationTextClass(resource.utilization))}>
          {remainingHours > 0 ? (
            <>🟢 {remainingHours.toFixed(1)}t ledig kapasitet</>
          ) : resource.utilization > 100 ? (
            <>🔴 Overbooket med {(resource.allocatedHours - resource.capacity).toFixed(1)}t</>
          ) : (
            <>⚪ Fullt booket</>
          )}
        </div>
      </div>
    </Card>
  );
}
