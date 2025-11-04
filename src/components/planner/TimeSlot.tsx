import { useDroppable } from '@dnd-kit/core';
import { WorkOrder } from '@/types';
import { OrderBlock } from './OrderBlock';

interface TimeSlotProps {
  slotId: string;
  orderId: string;
  slotIndex: number;
  startHour?: number;
  viewMode: 'day' | 'week';
  order: WorkOrder;
  onUnschedule: (orderId: string) => void;
  onEditDuration: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
}

export function TimeSlot({
  slotId,
  orderId,
  slotIndex,
  startHour,
  viewMode,
  order,
  onUnschedule,
  onEditDuration,
  onViewDetails,
}: TimeSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: {
      orderId,
      slotIndex,
      startHour,
    },
  });

  // Only render the order block if this order has a scheduled time
  const shouldRenderOrderBlock = 
    viewMode === 'day' && 
    startHour !== undefined && 
    order.scheduled_start && 
    order.scheduled_end;

  let renderOrderBlock = false;
  let durationHours = 0;

  if (shouldRenderOrderBlock) {
    const orderStart = new Date(order.scheduled_start!);
    const orderHour = orderStart.getHours();
    
    // Only render in the first slot (where the order starts)
    if (orderHour === startHour) {
      renderOrderBlock = true;
      const orderEnd = new Date(order.scheduled_end!);
      const durationMs = orderEnd.getTime() - orderStart.getTime();
      durationHours = durationMs / (1000 * 60 * 60);
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[80px] min-h-[60px] border-r border-border last:border-r-0 relative transition-colors ${
        isOver ? 'bg-primary/10' : ''
      }`}
    >
      {renderOrderBlock && (
        <OrderBlock
          order={order}
          startHour={startHour!}
          duration={durationHours}
          onUnschedule={() => onUnschedule(orderId)}
          onEditDuration={() => onEditDuration(orderId)}
          onViewDetails={() => onViewDetails(orderId)}
        />
      )}
    </div>
  );
}
