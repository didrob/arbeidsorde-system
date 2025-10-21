import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Clock } from 'lucide-react';
import { WorkOrder } from '@/types';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface OngoingOrdersPanelProps {
  orders: WorkOrder[];
  onOrderClick: (orderId: string) => void;
}

export function OngoingOrdersPanel({ orders, onOrderClick }: OngoingOrdersPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    return (
      order.title?.toLowerCase().includes(searchLower) ||
      order.customer?.name?.toLowerCase().includes(searchLower)
    );
  });

  const calculateDuration = (start: string) => {
    const startTime = new Date(start);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}t ${minutes}min`;
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold mb-3">⏳ Pågående ordre</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Søk pågående ordre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? (
                <p>Ingen ordre funnet</p>
              ) : (
                <p>Ingen pågående ordre</p>
              )}
            </div>
          ) : (
            filteredOrders.map(order => (
              <Card
                key={order.id}
                className="p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => onOrderClick(order.id)}
              >
                <div className="space-y-2">
                  {/* Title */}
                  <h3 className="font-medium text-sm truncate">{order.title}</h3>

                  {/* Customer */}
                  {order.customer && (
                    <p className="text-xs text-muted-foreground truncate">
                      🏠 {order.customer.name}
                    </p>
                  )}

                  {/* Assigned personnel */}
                  {order.personnel && order.personnel.length > 0 && (
                    <div className="flex items-center gap-1">
                      {order.personnel.slice(0, 3).map((p) => (
                        <Avatar key={p.personnel_id} className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {p.personnel?.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('') || '?'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {order.personnel.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{order.personnel.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Time info */}
                  {order.scheduled_start && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Startet {format(new Date(order.scheduled_start), 'HH:mm', { locale: nb })}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {calculateDuration(order.scheduled_start)}
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
