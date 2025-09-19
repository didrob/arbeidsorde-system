import { useState } from 'react';
import { useWorkOrders, useCreateWorkOrder, useUpdateWorkOrder, useDeleteWorkOrder, useCustomers, useFieldWorkers } from '@/hooks/useApi';
import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WorkOrderDetails } from '@/components/WorkOrderDetails';

interface WorkOrderForm {
  title: string;
  description: string;
  customer_id: string;
  assigned_to?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  pricing_type: 'hourly' | 'fixed' | 'material_only';
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
  const { data: customers } = useCustomers();
  const { data: fieldWorkers } = useFieldWorkers();
  const createWorkOrder = useCreateWorkOrder();
  const updateWorkOrder = useUpdateWorkOrder();
  const deleteWorkOrder = useDeleteWorkOrder();
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<WorkOrderForm>({
    defaultValues: {
      status: 'pending',
      pricing_type: 'hourly'
    }
  });

  const filteredWorkOrders = workOrders?.filter((order: any) => {
    const matchesSearch = order.title.toLowerCase().includes(search.toLowerCase()) ||
                         order.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onSubmit = async (data: WorkOrderForm) => {
    try {
      const result = await createWorkOrder.mutateAsync(data);
      if (result.success) {
        toast({ title: 'Arbeidsordre opprettet', description: 'Ny arbeidsordre er opprettet' });
        setIsCreateDialogOpen(false);
        reset();
      } else {
        toast({ title: 'Feil', description: result.error?.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Feil', description: 'Kunne ikke opprette arbeidsordre', variant: 'destructive' });
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

        {/* Create Work Order Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Opprett ny arbeidsordre</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  placeholder="Tittel"
                  {...register('title', { required: 'Tittel er påkrevd' })}
                />
                {/* Hidden field to ensure customer_id is registered */}
                <input type="hidden" {...register('customer_id', { required: 'Kunde er påkrevd' })} />
                {errors.title && (
                  <p className="text-destructive text-sm mt-1">{errors.title.message}</p>
                )}
              </div>
              
              <div>
                <Textarea
                  placeholder="Beskrivelse"
                  {...register('description')}
                />
              </div>

              <div>
                <Select onValueChange={(value) => setValue('customer_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg kunde" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {customers?.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customer_id && (
                  <p className="text-destructive text-sm mt-1">Kunde er påkrevd</p>
                )}
              </div>

              <div>
                <Select onValueChange={(value) => setValue('assigned_to', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tildel til (valgfritt)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {fieldWorkers?.map((worker: any) => (
                      <SelectItem key={worker.user_id} value={worker.user_id}>
                        {worker.full_name || worker.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select onValueChange={(value) => setValue('pricing_type', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pristype" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="hourly">Timebasert</SelectItem>
                    <SelectItem value="fixed">Fast pris</SelectItem>
                    <SelectItem value="material_only">Kun materialer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Input
                  type="number"
                  placeholder="Estimerte timer"
                  {...register('estimated_hours', { valueAsNumber: true })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={createWorkOrder.isPending}>
                  {createWorkOrder.isPending ? 'Oppretter...' : 'Opprett'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Avbryt
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

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