import { WorkOrder } from '@/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UnallocatedOrdersPanel } from './UnallocatedOrdersPanel';
import { OngoingOrdersPanel } from './OngoingOrdersPanel';

interface LeftPanelTabsProps {
  unassignedOrders: WorkOrder[];
  ongoingOrders: WorkOrder[];
  onOrderClick: (orderId: string) => void;
}

export function LeftPanelTabs({
  unassignedOrders,
  ongoingOrders,
  onOrderClick,
}: LeftPanelTabsProps) {
  return (
    <Tabs defaultValue="unassigned" className="w-[320px] h-full flex flex-col">
      <TabsList className="w-full grid grid-cols-2 mx-4 mt-4 mb-0">
        <TabsTrigger value="unassigned" className="text-xs">
          📦 Ufordelte ({unassignedOrders.length})
        </TabsTrigger>
        <TabsTrigger value="ongoing" className="text-xs">
          ⏳ Pågår ({ongoingOrders.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="unassigned" className="flex-1 mt-0 overflow-hidden">
        <UnallocatedOrdersPanel orders={unassignedOrders} onOrderClick={onOrderClick} />
      </TabsContent>

      <TabsContent value="ongoing" className="flex-1 mt-0 overflow-hidden">
        <OngoingOrdersPanel orders={ongoingOrders} onOrderClick={onOrderClick} />
      </TabsContent>
    </Tabs>
  );
}
