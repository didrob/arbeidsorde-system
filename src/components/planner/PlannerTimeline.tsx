import { Personnel, WorkOrder } from '@/types';
import { TimelineHeader } from './TimelineHeader';
import { ResourceRow } from './ResourceRow';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PlannerTimelineProps {
  personnel: Personnel[];
  scheduledOrders: WorkOrder[];
  viewMode: 'day' | 'week';
  selectedDate: Date;
  onUnschedule: (orderId: string) => void;
  onEditDuration: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
}

export function PlannerTimeline({
  personnel,
  scheduledOrders,
  viewMode,
  selectedDate,
  onUnschedule,
  onEditDuration,
  onViewDetails,
}: PlannerTimelineProps) {
  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <TimelineHeader viewMode={viewMode} selectedDate={selectedDate} />
      
      <ScrollArea className="flex-1">
        <div className="min-w-max">
          {personnel.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>Ingen ressurser funnet for valgt sted</p>
            </div>
          ) : (
            personnel.map((resource) => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                scheduledOrders={scheduledOrders}
                viewMode={viewMode}
                selectedDate={selectedDate}
                onUnschedule={onUnschedule}
                onEditDuration={onEditDuration}
                onViewDetails={onViewDetails}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
