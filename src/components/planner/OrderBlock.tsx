import { WorkOrder } from '@/types';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface OrderBlockProps {
  order: WorkOrder;
  startHour: number;
  duration: number; // in hours
}

export function OrderBlock({ order, startHour, duration }: OrderBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `scheduled-${order.id}`,
    data: { order },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-500/90 border-blue-600 text-white';
      case 'in_progress':
        return 'bg-amber-500/90 border-amber-600 text-white';
      case 'completed':
        return 'bg-green-500/90 border-green-600 text-white';
      default:
        return 'bg-muted border-border text-foreground';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`absolute rounded-md border-2 p-2 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${getStatusColor(order.status)}`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-1">
        <GripVertical className="h-3 w-3 opacity-50 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">
            {order.title}
          </p>
          {order.customer && (
            <p className="text-[10px] opacity-90 truncate">
              {order.customer.name}
            </p>
          )}
          <p className="text-[10px] opacity-75 mt-0.5">
            {duration}t
          </p>
        </div>
      </div>
    </div>
  );
}
