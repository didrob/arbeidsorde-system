import { useState } from 'react';
import { useWorkOrders, useCreateWorkOrder, useUpdateWorkOrder, useDeleteWorkOrder, useCustomers, useFieldWorkers } from '@/hooks/useApi';
import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit, Trash2, Eye, MoreHorizontal, User, Clock, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WorkOrderDetails } from '@/components/WorkOrderDetails';
import { WorkOrderAssignment } from './WorkOrderAssignment';
import { NotificationCenter } from './NotificationCenter';

interface WorkOrderForm {
  title: string;
  description: string;
  customer_id: string;
  assigned_to?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  pricing_type: 'hourly' | 'fixed' | 'material_only';
  pricing_model: 'fixed' | 'resource_based';
  estimated_hours?: number;
  price_value?: number;
}

export default function WorkOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);
  const [selectedOrders, setSelectedOrders] = useState<any[]>([]);
  const [bulkAssignMode, setBulkAssignMode] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const { data: workOrders, isLoading } = useWorkOrders();
  const createWorkOrder = useCreateWorkOrder();
  const updateWorkOrder = useUpdateWorkOrder();
  const deleteWorkOrder = useDeleteWorkOrder();
  const { toast } = useToast();

  const filteredWorkOrders = workOrders?.filter((order: any) => {
    const matchesSearch = order.title.toLowerCase().includes(search.toLowerCase()) ||
                         order.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onSubmit = async (data: any) => {
    try {
      await createWorkOrder.mutateAsync(data);
      setIsCreateDialogOpen(false);
      toast({ 
        title: 'Suksess', 
        description: 'Arbeidsordre opprettet' 
      });
    } catch (error: any) {
      toast({ 
        title: 'Feil', 
        description: error?.message || 'Kunne ikke opprette arbeidsordre', 
        variant: 'destructive' 
      });
    }
  };

  const handleViewDetails = (workOrder: any) => {
    setSelectedWorkOrder(workOrder);
    setIsDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'in_progress': return 'bg-primary/10 text-primary border-primary/20';
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Venter';
      case 'in_progress': return 'Pågår';
      case 'completed': return 'Fullført';
      case 'cancelled': return 'Avbrutt';
      default: return status;
    }
  };

  const WorkOrderSkeleton = () => (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
        <Search className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Ingen arbeidsordrer funnet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {search ? 'Prøv å justere søkekriteriene dine.' : 'Kom i gang ved å opprette din første arbeidsordre.'}
      </p>
      {!search && (
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Opprett arbeidsordre
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <TopBar 
        title="Arbeidsordrer" 
        onCreateClick={() => setIsCreateDialogOpen(true)}
      />
      
      <div className="flex-1 p-4 md:p-8">
        {/* Enhanced Search and Filters */}
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-10 pb-6 mb-6 border-b">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Søk etter arbeidsordrer, kunder eller beskrivelser..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-11">
                <SelectValue placeholder="Filtrer etter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statuser</SelectItem>
                <SelectItem value="pending">Venter</SelectItem>
                <SelectItem value="in_progress">Pågår</SelectItem>
                <SelectItem value="completed">Fullført</SelectItem>
                <SelectItem value="cancelled">Avbrutt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Status Tabs */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                Alle ({workOrders?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm">
                Venter ({workOrders?.filter((o: any) => o.status === 'pending').length || 0})
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs sm:text-sm">
                Pågår ({workOrders?.filter((o: any) => o.status === 'in_progress').length || 0})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm">
                Fullført ({workOrders?.filter((o: any) => o.status === 'completed').length || 0})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs sm:text-sm">
                Avbrutt ({workOrders?.filter((o: any) => o.status === 'cancelled').length || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Work Orders Grid */}
        {isLoading ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <WorkOrderSkeleton key={i} />
            ))}
          </div>
        ) : filteredWorkOrders?.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredWorkOrders?.map((order: any) => (
              <Card 
                key={order.id} 
                className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                onClick={() => handleViewDetails(order)}
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
                        handleViewDetails(order);
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
                          onClick={() => {
                            setSelectedWorkOrder(order);
                            setIsAssignDialogOpen(true);
                          }}
                        >
                          <User className="w-4 h-4" />
                          Tildel til feltarbeider
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          Rediger arbeidsordre
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 text-destructive focus:text-destructive">
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
        )}

        {/* Work Order Wizard */}
        <WorkOrderWizard 
          open={isCreateDialogOpen} 
          onClose={() => setIsCreateDialogOpen(false)}
          onSubmit={onSubmit}
        />

        {/* Work Order Assignment Dialog */}
        <WorkOrderAssignment 
          workOrder={selectedWorkOrder}
          isOpen={isAssignDialogOpen}
          onClose={() => {
            setIsAssignDialogOpen(false);
            setSelectedWorkOrder(null);
          }}
          bulkMode={bulkAssignMode}
          selectedOrders={selectedOrders}
        />

        {/* Work Order Details Dialog */}
        <WorkOrderDetails 
          workOrder={selectedWorkOrder}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
        />
      </div>
    </div>
  );
}