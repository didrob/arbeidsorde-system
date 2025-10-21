import { Personnel, WorkOrder } from '@/types';
import { TimeSlot } from './TimeSlot';
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
          const slotStartHour = viewMode === 'day' ? startHour + index : undefined;

          return (
            <TimeSlot
              key={slotId}
              slotId={slotId}
              resourceId={resource.id}
              slotIndex={index}
              startHour={slotStartHour}
              viewMode={viewMode}
              resourceOrders={resourceOrders}
            />
          );
        })}
      </div>
    </div>
  );
}
