import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useSiteFilter } from '@/hooks/useSiteFilter';
import { usePlannerData } from '@/hooks/usePlannerData';
import { useScheduleWorkOrder } from '@/hooks/useScheduleWorkOrder';
import { useUnscheduleWorkOrder } from '@/hooks/useUnscheduleWorkOrder';
import { PlannerFilters } from '@/components/planner/PlannerFilters';
import { UnassignedOrdersList } from '@/components/planner/UnassignedOrdersList';
import { UnallocatedOrdersPanel } from '@/components/planner/UnallocatedOrdersPanel';
import { PlannerTimeline } from '@/components/planner/PlannerTimeline';
import { ResourceBoard } from '@/components/planner/ResourceBoard';
import { TopBar } from '@/components/TopBar';
import { LoadingState } from '@/components/common/LoadingState';
import { WorkOrder } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Planner() {
  const { selectedSiteId, setSelectedSiteId } = useSiteFilter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [layoutMode, setLayoutMode] = useState<'board' | 'timeline'>('board');
  const [activeOrder, setActiveOrder] = useState<WorkOrder | null>(null);
  const [multiResourceDialog, setMultiResourceDialog] = useState<{
    open: boolean;
    order: WorkOrder | null;
    personnelId: string;
    scheduledStart: string;
    scheduledEnd: string;
  }>({
    open: false,
    order: null,
    personnelId: '',
    scheduledStart: '',
    scheduledEnd: '',
  });

  const { personnel, scheduledOrders, unassignedOrders, isLoading, refetchOrders } = usePlannerData(
    selectedSiteId,
    selectedDate
  );

  const scheduleOrderMutation = useScheduleWorkOrder();
  const unscheduleOrderMutation = useUnscheduleWorkOrder();
  const navigate = useNavigate();

  const handleDragStart = (event: DragStartEvent) => {
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

    // Board view: dropping on ResourceCard
    if (layoutMode === 'board' && dropData.type === 'resource-card') {
      const personnelId = dropData.personnelId;
      
      // Calculate scheduled times (default to 8 AM - 4 PM)
      const scheduledStart = new Date(selectedDate);
      scheduledStart.setHours(8, 0, 0, 0);
      
      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setHours(8 + (order.estimated_hours || 8));
      
      // Check if this order already has personnel assigned
      const existingPersonnel = order.personnel || [];
      const isAlreadyAssigned = existingPersonnel.some(p => p.personnel_id === personnelId);
      
      if (isAlreadyAssigned) {
        toast.info('Denne ressursen er allerede tildelt oppdraget');
        return;
      }
      
      if (existingPersonnel.length > 0) {
        // Show multi-resource dialog
        setMultiResourceDialog({
          open: true,
          order: order,
          personnelId: personnelId,
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
        });
      } else {
        // First personnel assignment
        scheduleOrderMutation.mutate({
          orderId: order.id,
          personnelId: personnelId,
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
        }, {
          onSuccess: () => {
            refetchOrders();
          },
        });
      }
      return;
    }

    // Timeline view: existing logic
    const { resourceId, slotIndex, startHour } = dropData;

    if (!resourceId) return;

    // Calculate scheduled times based on slot
    let scheduledStart: Date;
    let scheduledEnd: Date;

    if (viewMode === 'day' && startHour !== undefined) {
      scheduledStart = new Date(selectedDate);
      scheduledStart.setHours(startHour, 0, 0, 0);
      
      // Calculate duration from existing schedule or estimated hours
      let durationHours = order.estimated_hours || 1;
      if (order.scheduled_start && order.scheduled_end) {
        const existingStart = new Date(order.scheduled_start);
        const existingEnd = new Date(order.scheduled_end);
        durationHours = (existingEnd.getTime() - existingStart.getTime()) / (1000 * 60 * 60);
      }
      
      scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setHours(startHour + durationHours);
    } else {
      // Week view - use slot index as day offset
      scheduledStart = new Date(selectedDate);
      scheduledStart.setDate(scheduledStart.getDate() + slotIndex);
      scheduledStart.setHours(8, 0, 0, 0); // Default to 8 AM
      
      scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setHours(8 + (order.estimated_hours || 8));
    }

    // Check if this order already has personnel assigned
    const existingPersonnel = order.personnel || [];
    const isAlreadyAssigned = existingPersonnel.some(p => p.personnel_id === resourceId);
    
    if (isAlreadyAssigned && order.scheduled_start) {
      // Just reschedule - don't add duplicate personnel
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
    } else if (existingPersonnel.length > 0 && !order.scheduled_start) {
      // Order has personnel but is unscheduled - show multi-resource dialog
      setMultiResourceDialog({
        open: true,
        order: order,
        personnelId: resourceId,
        scheduledStart: scheduledStart.toISOString(),
        scheduledEnd: scheduledEnd.toISOString(),
      });
    } else {
      // First personnel assignment
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
    }
  };

  const handleMultiResourceConfirm = () => {
    const { order, personnelId, scheduledStart, scheduledEnd } = multiResourceDialog;
    if (!order) return;

    scheduleOrderMutation.mutate({
      orderId: order.id,
      personnelId: personnelId,
      scheduledStart: scheduledStart,
      scheduledEnd: scheduledEnd,
    }, {
      onSuccess: () => {
        refetchOrders();
      },
    });

    setMultiResourceDialog({ open: false, order: null, personnelId: '', scheduledStart: '', scheduledEnd: '' });
  };

  const handleUnschedule = (orderId: string) => {
    unscheduleOrderMutation.mutate(orderId, {
      onSuccess: () => {
        refetchOrders();
      },
    });
  };

  const handleEditDuration = (orderId: string) => {
    toast.info('Dra ordren til ny tid, eller bruk høyreklikk for flere alternativer');
  };

  const handleViewDetails = (orderId: string) => {
    navigate(`/work-orders?id=${orderId}`);
  };

  const handleResourceClick = (personnelId: string) => {
    toast.info('Detaljvisning for ressurs kommer snart');
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
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
      />

      <div className="flex flex-1 overflow-hidden">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {layoutMode === 'board' ? (
            <>
              <UnallocatedOrdersPanel 
                orders={unassignedOrders}
                onOrderClick={handleViewDetails}
              />
              
              <ResourceBoard
                personnel={personnel}
                scheduledOrders={scheduledOrders}
                selectedDate={selectedDate}
                onResourceClick={handleResourceClick}
              />
            </>
          ) : (
            <>
              <UnassignedOrdersList orders={unassignedOrders} />
              
              <PlannerTimeline
                scheduledOrders={scheduledOrders}
                unassignedOrders={unassignedOrders}
                viewMode={viewMode}
                selectedDate={selectedDate}
                onUnschedule={handleUnschedule}
                onEditDuration={handleEditDuration}
                onViewDetails={handleViewDetails}
              />
            </>
          )}

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

      <AlertDialog open={multiResourceDialog.open} onOpenChange={(open) => 
        setMultiResourceDialog({ ...multiResourceDialog, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Legg til ekstra ressurs?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette oppdraget har allerede {multiResourceDialog.order?.personnel?.length || 0} ressurs(er) tildelt:
              <div className="mt-2 space-y-1">
                {multiResourceDialog.order?.personnel?.map(p => (
                  <div key={p.id} className="text-sm font-medium">
                    • {p.personnel?.name || 'Ukjent'}
                  </div>
                ))}
              </div>
              <div className="mt-3">
                Vil du legge til en ekstra ressurs? Dette vil øke totale manntimer for oppdraget.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleMultiResourceConfirm}>
              Ja, legg til ressurs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
