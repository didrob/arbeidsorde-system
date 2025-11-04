import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, MoreHorizontal, User, Clock, Edit, Trash2 } from 'lucide-react';

interface WorkOrderListViewProps {
  orders: any[];
  onViewDetails: (order: any) => void;
  onAssign: (order: any) => void;
  onDelete: (order: any) => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

export function WorkOrderListView({ 
  orders, 
  onViewDetails, 
  onAssign, 
  onDelete,
  getStatusColor,
  getStatusText 
}: WorkOrderListViewProps) {
  return (
    <div className="space-y-3">
      {orders.map((order: any) => (
        <Card 
          key={order.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onViewDetails(order)}
        >
          <div className="p-4">
            <div className="flex items-start gap-4">
              {/* Status Badge */}
              <Badge 
                variant="outline" 
                className={`${getStatusColor(order.status)} shrink-0 text-xs`}
              >
                {getStatusText(order.status)}
              </Badge>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base mb-1 truncate hover:text-primary transition-colors">
                  {order.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{order.customer?.name || 'Ingen kunde'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Tildelt: {order.assigned_user?.full_name || 'Ikke tildelt'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{order.estimated_hours || 0}t</span>
                  </div>
                  <span className="text-xs">ID: #{order.id?.slice(-6)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(order);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem 
                      className="flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssign(order);
                      }}
                    >
                      <User className="w-4 h-4" />
                      Tildel til feltarbeider
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Rediger arbeidsordre
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(order);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Slett arbeidsordre
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
