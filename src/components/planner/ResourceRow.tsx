import { Personnel, WorkOrder } from '@/types';
import { useDroppable } from '@dnd-kit/core';
import { OrderBlock } from './OrderBlock';
import { User } from 'lucide-react';

interface ResourceRowProps {
  resource: Personnel;
  scheduledOrders: WorkOrder[];
  viewMode: 'day' | 'week';
  selectedDate: Date;
}

export function ResourceRow({ resource, scheduledOrders, viewMode }: ResourceRowProps) {
  const slots = viewMode === 'day' ? 15 : 7; // 15 hours or 7 days
  const startHour = 6; // Start at 6 AM for day view

  // Filter orders for this resource
  const resourceOrders = scheduledOrders.filter(order => 
    order.personnel?.some(p => p.personnel_id === resource.id)
  );

  return (
    <div className="flex border-b border-border hover:bg-muted/20 transition-colors">
      {/* Resource Name Column */}
      <div className="w-48 p-3 border-r border-border bg-card flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {resource.name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {resource.role}
          </p>
        </div>
      </div>

      {/* Timeline Slots */}
      <div className="flex-1 flex relative">
        {Array.from({ length: slots }).map((_, index) => {
          const slotId = `${resource.id}-${index}`;
          
          const { setNodeRef, isOver } = useDroppable({
            id: slotId,
            data: {
              resourceId: resource.id,
              slotIndex: index,
              startHour: viewMode === 'day' ? startHour + index : undefined,
            },
          });

          return (
            <div
              key={slotId}
              ref={setNodeRef}
              className={`flex-1 min-w-[80px] min-h-[60px] border-r border-border last:border-r-0 relative transition-colors ${
                isOver ? 'bg-primary/10' : ''
              }`}
            >
              {/* Render scheduled orders in this slot */}
              {viewMode === 'day' && resourceOrders.map(order => {
                if (!order.scheduled_start) return null;
                
                const orderStart = new Date(order.scheduled_start);
                const orderHour = orderStart.getHours();
                const orderMinutes = orderStart.getMinutes();
                
                // Check if this order belongs in this slot
                if (orderHour === startHour + index) {
                  const duration = order.estimated_hours || 1;
                  
                  return (
                    <OrderBlock
                      key={order.id}
                      order={order}
                      startHour={orderHour}
                      duration={duration}
                    />
                  );
                }
                return null;
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
