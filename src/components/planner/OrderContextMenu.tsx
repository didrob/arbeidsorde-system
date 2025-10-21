import { WorkOrder } from '@/types';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Clock, Move, Trash2, Info } from 'lucide-react';

interface OrderContextMenuProps {
  order: WorkOrder;
  children: React.ReactNode;
  onUnschedule: () => void;
  onEditDuration: () => void;
  onViewDetails: () => void;
}

export function OrderContextMenu({
  order,
  children,
  onUnschedule,
  onEditDuration,
  onViewDetails,
}: OrderContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onViewDetails}>
          <Info className="mr-2 h-4 w-4" />
          Se detaljer
        </ContextMenuItem>
        <ContextMenuItem onClick={onEditDuration}>
          <Clock className="mr-2 h-4 w-4" />
          Rediger varighet
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={onUnschedule}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Fjern allokering
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
