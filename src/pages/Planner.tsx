import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { useSiteFilter } from '@/hooks/useSiteFilter';
import { usePlannerData } from '@/hooks/usePlannerData';
import { useScheduleWorkOrder } from '@/hooks/useScheduleWorkOrder';
import { PlannerFilters } from '@/components/planner/PlannerFilters';
import { UnassignedOrdersList } from '@/components/planner/UnassignedOrdersList';
import { PlannerTimeline } from '@/components/planner/PlannerTimeline';
import { TopBar } from '@/components/TopBar';
import { LoadingState } from '@/components/common/LoadingState';
import { WorkOrder } from '@/types';

export default function Planner() {
  const { selectedSiteId, setSelectedSiteId } = useSiteFilter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [activeOrder, setActiveOrder] = useState<WorkOrder | null>(null);

  const { personnel, scheduledOrders, unassignedOrders, isLoading, refetchOrders } = usePlannerData(
    selectedSiteId,
    selectedDate
  );

  const scheduleOrderMutation = useScheduleWorkOrder();

  const handleDragStart = (event: any) => {
    const order = event.active.data.current?.order;
    if (order) {
      setActiveOrder(order);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveOrder(null);

    const { active, over } = event;
    
    if (!over) return;

    const order = active.data.current?.order as WorkOrder;
    const dropData = over.data.current;

    if (!order || !dropData) return;

    const { resourceId, slotIndex, startHour } = dropData;

    if (!resourceId) return;

    // Calculate scheduled times based on slot
    let scheduledStart: Date;
    let scheduledEnd: Date;

    if (viewMode === 'day' && startHour !== undefined) {
      scheduledStart = new Date(selectedDate);
      scheduledStart.setHours(startHour, 0, 0, 0);
      
      scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setHours(startHour + (order.estimated_hours || 1));
    } else {
      // Week view - use slot index as day offset
      scheduledStart = new Date(selectedDate);
      scheduledStart.setDate(scheduledStart.getDate() + slotIndex);
      scheduledStart.setHours(8, 0, 0, 0); // Default to 8 AM
      
      scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setHours(8 + (order.estimated_hours || 8));
    }

    // Schedule the order
    scheduleOrderMutation.mutate({
      orderId: order.id,
      personnelId: resourceId,
      scheduledStart: scheduledStart.toISOString(),
      scheduledEnd: scheduledEnd.toISOString(),
    }, {
      onSuccess: () => {
        refetchOrders();
      },
    });
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Planlegger" />

      <PlannerFilters
        selectedSiteId={selectedSiteId}
        onSiteChange={setSelectedSiteId}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex flex-1 overflow-hidden">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <UnassignedOrdersList orders={unassignedOrders} />
          
          <PlannerTimeline
            personnel={personnel}
            scheduledOrders={scheduledOrders}
            viewMode={viewMode}
            selectedDate={selectedDate}
          />

          <DragOverlay>
            {activeOrder && (
              <div className="bg-primary text-primary-foreground p-3 rounded-md shadow-lg border-2 border-primary">
                <p className="text-sm font-semibold">{activeOrder.title}</p>
                <p className="text-xs opacity-90">{activeOrder.customer?.name}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
