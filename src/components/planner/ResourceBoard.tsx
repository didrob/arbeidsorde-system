import { Personnel, WorkOrder } from '@/types';
import { ResourceColumn } from './ResourceColumn';
import { groupResourcesByUtilization } from '@/lib/plannerUtils';

interface ResourceBoardProps {
  personnel: Personnel[];
  scheduledOrders: WorkOrder[];
  selectedDate: Date;
  onResourceClick: (personnelId: string) => void;
}

export function ResourceBoard({
  personnel,
  scheduledOrders,
  selectedDate,
  onResourceClick,
}: ResourceBoardProps) {
  const { available, partial, fullyBooked } = groupResourcesByUtilization(
    personnel,
    scheduledOrders,
    selectedDate
  );

  if (personnel.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-lg text-muted-foreground">Ingen ressurser funnet</p>
          <p className="text-sm text-muted-foreground">
            Velg et annet sted eller legg til ressurser
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-3 bg-background overflow-hidden">
      <ResourceColumn
        title="Ledig"
        icon="🟢"
        resources={available}
        onResourceClick={onResourceClick}
      />
      
      <ResourceColumn
        title="Delvis opptatt"
        icon="🟡"
        resources={partial}
        onResourceClick={onResourceClick}
      />
      
      <ResourceColumn
        title="Fullt / Overbooket"
        icon="🔴"
        resources={fullyBooked}
        onResourceClick={onResourceClick}
      />
    </div>
  );
}
