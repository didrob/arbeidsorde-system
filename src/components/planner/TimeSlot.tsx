import { useDroppable } from '@dnd-kit/core';
import { WorkOrder } from '@/types';
import { OrderBlock } from './OrderBlock';

interface TimeSlotProps {
  slotId: string;
  resourceId: string;
  slotIndex: number;
  startHour?: number;
  viewMode: 'day' | 'week';
  resourceOrders: WorkOrder[];
}

export function TimeSlot({
  slotId,
  resourceId,
  slotIndex,
  startHour,
  viewMode,
  resourceOrders,
}: TimeSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: {
      resourceId,
      slotIndex,
      startHour,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[80px] min-h-[60px] border-r border-border last:border-r-0 relative transition-colors ${
        isOver ? 'bg-primary/10' : ''
      }`}
    >
      {/* Render scheduled orders in this slot */}
      {viewMode === 'day' && startHour !== undefined && resourceOrders.map(order => {
        if (!order.scheduled_start) return null;
        
        const orderStart = new Date(order.scheduled_start);
        const orderHour = orderStart.getHours();
        
        // Check if this order belongs in this slot
        if (orderHour === startHour) {
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
}
