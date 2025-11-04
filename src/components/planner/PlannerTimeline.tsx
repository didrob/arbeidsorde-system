import { WorkOrder } from '@/types';
import { TimelineHeader } from './TimelineHeader';
import { OrderRow } from './OrderRow';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PlannerTimelineProps {
  scheduledOrders: WorkOrder[];
  unassignedOrders: WorkOrder[];
  viewMode: 'day' | 'week';
  selectedDate: Date;
  onUnschedule: (orderId: string) => void;
  onEditDuration: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
}

export function PlannerTimeline({
  scheduledOrders,
  unassignedOrders,
  viewMode,
  selectedDate,
  onUnschedule,
  onEditDuration,
  onViewDetails,
}: PlannerTimelineProps) {
  // Filter orders for selected date
  const ordersForDate = scheduledOrders.filter(order => {
    if (!order.scheduled_start) return false;
    const orderDate = new Date(order.scheduled_start);
    orderDate.setHours(0, 0, 0, 0);
    const currentDate = new Date(selectedDate);
    currentDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === currentDate.getTime();
  });

  // Sort by scheduled_start
  const sortedOrders = ordersForDate.sort((a, b) => {
    const aStart = new Date(a.scheduled_start!);
    const bStart = new Date(b.scheduled_start!);
    return aStart.getTime() - bStart.getTime();
  });

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <TimelineHeader viewMode={viewMode} selectedDate={selectedDate} />
      
      <ScrollArea className="flex-1">
        <div className="min-w-max">
          {/* Scheduled orders */}
          {sortedOrders.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>Ingen ordre planlagt for denne datoen</p>
            </div>
          ) : (
            sortedOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                viewMode={viewMode}
                selectedDate={selectedDate}
                onUnschedule={onUnschedule}
                onEditDuration={onEditDuration}
                onViewDetails={onViewDetails}
              />
            ))
          )}

          {/* Unscheduled orders section */}
          {unassignedOrders.length > 0 && (
            <div className="border-t-2 border-border mt-4">
              <div className="p-3 bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground">
                  ⚠️ Ordre uten tidspunkt ({unassignedOrders.length})
                </p>
              </div>
              {unassignedOrders.map(order => (
                <OrderRow
                  key={order.id}
                  order={order}
                  viewMode={viewMode}
                  selectedDate={selectedDate}
                  onUnschedule={onUnschedule}
                  onEditDuration={onEditDuration}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
