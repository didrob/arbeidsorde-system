import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, MoreHorizontal, User, Clock, Calendar, Edit, Trash2 } from 'lucide-react';

interface WorkOrderGridViewProps {
  orders: any[];
  onViewDetails: (order: any) => void;
  onAssign: (order: any) => void;
  onDelete: (order: any) => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

export function WorkOrderGridView({ 
  orders, 
  onViewDetails, 
  onAssign, 
  onDelete,
  getStatusColor,
  getStatusText 
}: WorkOrderGridViewProps) {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {orders.map((order: any) => (
        <Card 
          key={order.id} 
          className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
          onClick={() => onViewDetails(order)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {order.title}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>ID: #{order.id?.slice(-6)}</span>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={`${getStatusColor(order.status)} shrink-0 text-xs font-medium`}
              >
                {getStatusText(order.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {order.description}
              </p>
            )}
            
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Kunde:</span>
                <span className="font-medium truncate">{order.customer?.name || 'Ikke tildelt'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Tildelt:</span>
                <span className="font-medium truncate">{order.assigned_user?.full_name || 'Ikke tildelt'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Estimert:</span>
                <span className="font-medium">{order.estimated_hours || 0} timer</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <Button 
                variant="default" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(order);
                }}
                className="flex-1 mr-2"
              >
                <Eye className="w-4 h-4 mr-2" />
                Vis detaljer
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" className="px-2">
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
