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
  onUnschedule: (orderId: string) => void;
  onEditDuration: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
}

export function TimeSlot({
  slotId,
  resourceId,
  slotIndex,
  startHour,
  viewMode,
  resourceOrders,
  onUnschedule,
  onEditDuration,
  onViewDetails,
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
      {/* Render scheduled orders - only in first slot they occupy */}
      {viewMode === 'day' && startHour !== undefined && resourceOrders.map(order => {
        if (!order.scheduled_start || !order.scheduled_end) return null;
        
        const orderStart = new Date(order.scheduled_start);
        const orderEnd = new Date(order.scheduled_end);
        const orderHour = orderStart.getHours();
        
        // Only render in the first slot (where the order starts)
        if (orderHour === startHour) {
          const durationMs = orderEnd.getTime() - orderStart.getTime();
          const durationHours = durationMs / (1000 * 60 * 60);
          
          return (
            <OrderBlock
              key={order.id}
              order={order}
              startHour={orderHour}
              duration={durationHours}
              onUnschedule={() => onUnschedule(order.id)}
              onEditDuration={() => onEditDuration(order.id)}
              onViewDetails={() => onViewDetails(order.id)}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
