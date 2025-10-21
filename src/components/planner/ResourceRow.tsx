import { Personnel, WorkOrder } from '@/types';
import { TimeSlot } from './TimeSlot';
import { User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ResourceRowProps {
  resource: Personnel;
  scheduledOrders: WorkOrder[];
  viewMode: 'day' | 'week';
  selectedDate: Date;
  onUnschedule: (orderId: string) => void;
  onEditDuration: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
}

export function ResourceRow({ 
  resource, 
  scheduledOrders, 
  viewMode, 
  selectedDate,
  onUnschedule,
  onEditDuration,
  onViewDetails,
}: ResourceRowProps) {
  const slots = viewMode === 'day' ? 15 : 7; // 15 hours or 7 days
  const startHour = 6; // Start at 6 AM for day view

  // Filter orders for this resource
  const resourceOrders = scheduledOrders.filter(order => 
    order.personnel?.some(p => p.personnel_id === resource.id)
  );

  // Calculate allocated hours for this day
  const dailyCapacity = 7.5; // TODO: Get from personnel.daily_capacity_hours
  const totalAllocatedHours = resourceOrders.reduce((sum, order) => {
    if (!order.scheduled_start || !order.scheduled_end) return sum;
    
    const start = new Date(order.scheduled_start);
    const end = new Date(order.scheduled_end);
    const orderDate = new Date(start);
    orderDate.setHours(0, 0, 0, 0);
    const currentDate = new Date(selectedDate);
    currentDate.setHours(0, 0, 0, 0);
    
    // Only count if order is on selected date
    if (orderDate.getTime() === currentDate.getTime()) {
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }
    return sum;
  }, 0);

  const utilizationPercent = Math.min((totalAllocatedHours / dailyCapacity) * 100, 100);
  
  const getCapacityColor = () => {
    if (totalAllocatedHours > dailyCapacity * 1.2) return 'text-destructive';
    if (totalAllocatedHours > dailyCapacity) return 'text-yellow-600';
    return 'text-muted-foreground';
  };

  const getProgressColor = () => {
    if (totalAllocatedHours > dailyCapacity * 1.2) return 'bg-destructive';
    if (totalAllocatedHours > dailyCapacity) return 'bg-yellow-500';
    return '';
  };

  return (
    <div className="flex border-b border-border hover:bg-muted/20 transition-colors">
      {/* Resource Name Column */}
      <div className="w-64 p-3 border-r border-border bg-card shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
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
        
        {/* Capacity Indicator */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1 cursor-help">
                <div className="flex items-center justify-between text-xs">
                  <span className={getCapacityColor()}>
                    {totalAllocatedHours.toFixed(1)} / {dailyCapacity}t
                  </span>
                  <span className={getCapacityColor()}>
                    ({utilizationPercent.toFixed(0)}%)
                  </span>
                </div>
                <Progress 
                  value={utilizationPercent} 
                  className="h-1.5"
                  indicatorClassName={getProgressColor()}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-semibold text-xs">Allokerte ordre:</p>
                {resourceOrders.length > 0 ? (
                  resourceOrders.map(order => {
                    if (!order.scheduled_start || !order.scheduled_end) return null;
                    const start = new Date(order.scheduled_start);
                    const end = new Date(order.scheduled_end);
                    const hours = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1);
                    return (
                      <div key={order.id} className="text-xs">
                        • {order.title} ({hours}t)
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground">Ingen ordre allokert</p>
                )}
                {totalAllocatedHours > dailyCapacity && (
                  <p className="text-xs text-destructive font-medium mt-2">
                    ⚠ Overbooket med {(totalAllocatedHours - dailyCapacity).toFixed(1)}t
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
              onUnschedule={onUnschedule}
              onEditDuration={onEditDuration}
              onViewDetails={onViewDetails}
            />
          );
        })}
      </div>
    </div>
  );
}
