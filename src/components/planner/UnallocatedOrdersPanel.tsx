import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { WorkOrder } from '@/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnallocatedOrdersPanelProps {
  orders: WorkOrder[];
  onOrderClick: (orderId: string) => void;
}

function DraggableOrderCard({ order, onClick }: { order: WorkOrder; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `order-${order.id}`,
    data: { order },
  });

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'p-3 cursor-move hover:bg-accent transition-colors',
        isDragging && 'opacity-50'
      )}
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="font-medium text-sm truncate">{order.title}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">🏠 {order.customer?.name || 'Ukjent kunde'}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {order.estimated_hours && (
            <Badge variant="secondary" className="text-xs">
              ⏱️ {order.estimated_hours}t
            </Badge>
          )}
          {order.price_value && (
            <Badge variant="secondary" className="text-xs">
              💰 {order.price_value.toLocaleString('no-NO')} kr
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

export function UnallocatedOrdersPanel({ orders, onOrderClick }: UnallocatedOrdersPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase();
    return (
      order.title.toLowerCase().includes(query) ||
      order.customer?.name?.toLowerCase().includes(query) ||
      order.description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-80 border-r flex flex-col bg-muted/30">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <h2 className="font-semibold text-sm mb-3">
          📦 Ufordelte ordre ({orders.length})
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk ordre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Orders list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              {searchQuery ? (
                <p className="text-sm text-muted-foreground">Ingen ordre funnet</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-2xl">🎉</p>
                  <p className="text-sm text-muted-foreground">Alle ordre er tildelt</p>
                </div>
              )}
            </div>
          ) : (
            filteredOrders.map(order => (
              <DraggableOrderCard
                key={order.id}
                order={order}
                onClick={() => onOrderClick(order.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
