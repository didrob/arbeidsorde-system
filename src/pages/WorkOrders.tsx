import { useState } from 'react';
import { useWorkOrders, useCreateWorkOrder, useUpdateWorkOrder, useDeleteWorkOrder, useCustomers, useFieldWorkers } from '@/hooks/useApi';
import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WorkOrderDetails } from '@/components/WorkOrderDetails';
import { WorkOrderWizard } from '@/components/workorder-wizard/WorkOrderWizard';

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
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>(null);
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <TopBar 
        title="Arbeidsordrer" 
        onCreateClick={() => setIsCreateDialogOpen(true)}
      />
      
      <div className="flex-1 p-8">
        {/* Search and Filters */}
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Søk etter arbeidsordrer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
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

        {/* Work Orders Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkOrders?.map((order: any) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{order.title}</CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {order.description}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Kunde:</span> {order.customer?.name || 'Ikke tildelt'}
                    </div>
                    <div>
                      <span className="font-medium">Tildelt:</span> {order.assigned_user?.full_name || 'Ikke tildelt'}
                    </div>
                    <div>
                      <span className="font-medium">Estimert tid:</span> {order.estimated_hours || 0} timer
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Vis detaljer
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Rediger
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Slett
                    </Button>
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