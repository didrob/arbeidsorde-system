import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, MoreHorizontal, User, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface WorkOrderTableViewProps {
  orders: any[];
  onViewDetails: (order: any) => void;
  onAssign: (order: any) => void;
  onDelete: (order: any) => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

export function WorkOrderTableView({ 
  orders, 
  onViewDetails, 
  onAssign, 
  onDelete,
  getStatusColor,
  getStatusText 
}: WorkOrderTableViewProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">ID</TableHead>
            <TableHead>Tittel</TableHead>
            <TableHead>Kunde</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead>Tildelt til</TableHead>
            <TableHead className="w-24 text-right">Timer</TableHead>
            <TableHead className="w-32">Opprettet</TableHead>
            <TableHead className="w-24 text-right">Handlinger</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order: any) => (
            <TableRow 
              key={order.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onViewDetails(order)}
            >
              <TableCell className="font-mono text-xs">
                #{order.id?.slice(-6)}
              </TableCell>
              <TableCell className="font-medium">
                <div className="max-w-xs truncate">{order.title}</div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate">
                  {order.customer?.name || '-'}
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(order.status)} text-xs`}
                >
                  {getStatusText(order.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {order.assigned_user?.full_name ? (
                    <>
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="truncate max-w-xs">{order.assigned_user.full_name}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">Ikke tildelt</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {order.estimated_hours || 0}t
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {order.created_at ? format(new Date(order.created_at), 'dd MMM yyyy', { locale: nb }) : '-'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
