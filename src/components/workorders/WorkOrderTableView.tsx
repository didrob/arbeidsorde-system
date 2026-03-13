import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, MoreHorizontal, User, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { isInternalOrder } from '@/lib/internalOrders';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
  const isMobile = useIsMobile();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Mobile: stacked cards
  if (isMobile) {
    return (
      <div className="space-y-3">
        {orders.map((order: any) => {
          const isExpanded = expandedIds.has(order.id);
          return (
            <Card
              key={order.id}
              className="rounded-brand shadow-brand-sm overflow-hidden"
            >
              <CardContent className="p-4">
                {/* Primary: title + status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{order.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      #{order.id?.slice(-6)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(order.status)} text-xs shrink-0`}
                  >
                    {getStatusText(order.status)}
                  </Badge>
                </div>

                {/* Customer always visible */}
                {order.customer?.name && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {order.customer.name}
                  </p>
                )}

                {/* Expand toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={() => toggleExpand(order.id)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Skjul detaljer
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-3 w-3 mr-1" />
                      Vis mer
                    </>
                  )}
                </Button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="pt-3 mt-2 border-t border-border space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tildelt</span>
                      <span>{order.assigned_user?.full_name || 'Ikke tildelt'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Timer</span>
                      <span>{order.estimated_hours || 0}t</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Opprettet</span>
                      <span>
                        {order.created_at
                          ? format(new Date(order.created_at), 'dd MMM yyyy', { locale: nb })
                          : '-'}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onViewDetails(order)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Detaljer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAssign(order)}
                      >
                        <User className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop: table
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
