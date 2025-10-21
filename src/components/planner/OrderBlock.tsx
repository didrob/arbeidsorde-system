import { WorkOrder } from '@/types';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, User } from 'lucide-react';
import { OrderContextMenu } from './OrderContextMenu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

interface OrderBlockProps {
  order: WorkOrder;
  startHour: number;
  duration: number; // in hours
  onUnschedule?: () => void;
  onEditDuration?: () => void;
  onViewDetails?: () => void;
}

export function OrderBlock({ 
  order, 
  startHour, 
  duration,
  onUnschedule = () => {},
  onEditDuration = () => {},
  onViewDetails = () => {},
}: OrderBlockProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `scheduled-${order.id}`,
    data: { order },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/work-orders?id=${order.id}`);
  };

  const slotWidth = 80; // min-w-[80px] per slot
  const blockWidth = duration * slotWidth;

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    width: `${blockWidth}px`,
    minWidth: `${blockWidth}px`,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-500/90 border-blue-600 text-white';
      case 'in_progress':
        return 'bg-amber-500/90 border-amber-600 text-white';
      case 'completed':
        return 'bg-green-500/90 border-green-600 text-white';
      default:
        return 'bg-muted border-border text-foreground';
    }
  };

  const personnelCount = order.personnel?.length || 0;
  const personnelToShow = order.personnel?.slice(0, 2) || [];
  const remainingCount = personnelCount > 2 ? personnelCount - 2 : 0;

  return (
    <OrderContextMenu
      order={order}
      onUnschedule={onUnschedule}
      onEditDuration={onEditDuration}
      onViewDetails={onViewDetails}
    >
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div
            ref={setNodeRef}
            style={style}
            onClick={handleClick}
            className={`absolute left-0 top-1 rounded-md border-2 p-2 cursor-pointer hover:shadow-lg transition-all ${getStatusColor(order.status)}`}
            {...listeners}
            {...attributes}
          >
            <div className="flex items-start gap-1 h-full">
              <GripVertical className="h-3 w-3 opacity-50 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-xs font-semibold truncate">
                  {order.title}
                </p>
                {order.customer && (
                  <p className="text-[10px] opacity-90 truncate">
                    {order.customer.name}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-[10px] opacity-75">
                    {duration.toFixed(1)}t
                  </p>
                  {personnelCount > 0 && (
                    <div className="flex items-center gap-0.5 ml-1">
                      {personnelToShow.map(p => (
                        <Avatar key={p.id} className="h-3 w-3 border border-white/50">
                          <AvatarFallback className="text-[8px] bg-white/20">
                            {p.personnel?.name.split(' ').map(n => n[0]).join('').substring(0, 2) || '??'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {remainingCount > 0 && (
                        <span className="text-[8px] opacity-75 ml-0.5">+{remainingCount}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80" side="right" align="start">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">{order.title}</h4>
              {order.customer && (
                <p className="text-xs text-muted-foreground">
                  Kunde: {order.customer.name}
                </p>
              )}
            </div>

            {order.description && (
              <p className="text-xs text-muted-foreground line-clamp-3">
                {order.description}
              </p>
            )}

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="h-5 text-xs">
                  {order.status === 'pending' && 'Venter'}
                  {order.status === 'in_progress' && 'Pågår'}
                  {order.status === 'completed' && 'Fullført'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimert tid:</span>
                <span className="font-medium">{order.estimated_hours || duration.toFixed(1)}t</span>
              </div>
              {order.actual_hours && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Faktisk tid:</span>
                  <span className="font-medium">{order.actual_hours}t</span>
                </div>
              )}
              {order.price_value && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pris:</span>
                  <span className="font-medium">{order.price_value.toLocaleString('nb-NO')} kr</span>
                </div>
              )}
            </div>

            {personnelCount > 0 && (
              <div>
                <p className="text-xs font-medium mb-2">Tildelte ressurser ({personnelCount}):</p>
                <div className="space-y-1">
                  {order.personnel?.map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-xs">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {p.personnel?.name.split(' ').map(n => n[0]).join('').substring(0, 2) || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{p.personnel?.name || 'Ukjent'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={handleClick}
              className="w-full text-xs text-primary hover:underline text-left"
            >
              Klikk for å se detaljer →
            </button>
          </div>
        </HoverCardContent>
      </HoverCard>
    </OrderContextMenu>
  );
}
