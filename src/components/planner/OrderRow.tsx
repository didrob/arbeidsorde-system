import { WorkOrder } from '@/types';
import { TimeSlot } from './TimeSlot';
import { Package } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface OrderRowProps {
  order: WorkOrder;
  viewMode: 'day' | 'week';
  selectedDate: Date;
  onUnschedule: (orderId: string) => void;
  onEditDuration: (orderId: string) => void;
  onViewDetails: (orderId: string) => void;
}

export function OrderRow({ 
  order, 
  viewMode, 
  selectedDate,
  onUnschedule,
  onEditDuration,
  onViewDetails,
}: OrderRowProps) {
  const slots = viewMode === 'day' ? 15 : 7; // 15 hours or 7 days
  const startHour = 6; // Start at 6 AM for day view

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Venter';
      case 'in_progress':
        return 'Pågår';
      case 'completed':
        return 'Fullført';
      default:
        return status;
    }
  };

  const personnelCount = order.personnel?.length || 0;
  const personnelToShow = order.personnel?.slice(0, 3) || [];
  const remainingCount = personnelCount > 3 ? personnelCount - 3 : 0;

  return (
    <div className="flex border-b border-border hover:bg-muted/20 transition-colors">
      {/* Order Info Column */}
      <div className="w-[280px] p-3 border-r border-border bg-card shrink-0">
        <div className="flex items-start gap-2 mb-2">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate">
              {order.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {order.customer?.name || 'Ingen kunde'}
            </p>
          </div>
        </div>
        
        {/* Assigned personnel */}
        <div className="mb-2">
          {personnelCount > 0 ? (
            <div className="flex items-center gap-1 flex-wrap">
              {personnelToShow.map(p => (
                <Avatar key={p.personnel_id} className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-primary/10">
                    {p.personnel?.name?.split(' ').map(n => n[0]).join('').substring(0, 2) || '??'}
                  </AvatarFallback>
                </Avatar>
              ))}
              {remainingCount > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{remainingCount}
                </span>
              )}
            </div>
          ) : (
            <Badge variant="outline" className="text-xs">
              ⚠️ Ingen ressurs
            </Badge>
          )}
        </div>

        {/* Time info */}
        {order.scheduled_start && order.scheduled_end ? (
          <p className="text-xs text-muted-foreground mb-2">
            ⏱️ {format(new Date(order.scheduled_start), 'HH:mm')} - 
            {format(new Date(order.scheduled_end), 'HH:mm')} 
            ({((new Date(order.scheduled_end).getTime() - new Date(order.scheduled_start).getTime()) / (1000 * 60 * 60)).toFixed(1)}t)
          </p>
        ) : (
          <p className="text-xs text-yellow-600 mb-2">
            ⚠️ Tidspunkt ikke satt
          </p>
        )}

        {/* Status badge */}
        <Badge variant={getStatusVariant(order.status)} className="text-xs">
          {getStatusLabel(order.status)}
        </Badge>
      </div>

      {/* Timeline Slots */}
      <div className="flex-1 flex relative">
        {Array.from({ length: slots }).map((_, index) => {
          const slotId = `${order.id}-${index}`;
          const slotStartHour = viewMode === 'day' ? startHour + index : undefined;

          return (
            <TimeSlot
              key={slotId}
              slotId={slotId}
              orderId={order.id}
              slotIndex={index}
              startHour={slotStartHour}
              viewMode={viewMode}
              order={order}
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
