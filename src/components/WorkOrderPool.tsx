import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkOrders, useUpdateWorkOrder } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Clock, MapPin, User, Search, Filter, Grab } from 'lucide-react';

interface WorkOrderPoolProps {
  isMobile?: boolean;
}

export function WorkOrderPool({ isMobile = false }: WorkOrderPoolProps) {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  
  const { user } = useAuth();
  const { data: workOrders } = useWorkOrders();
  const updateWorkOrder = useUpdateWorkOrder();
  const { toast } = useToast();

  // Filter orders that are not assigned or in the pool
  const poolOrders = workOrders?.filter(order => 
    !order.assigned_to && order.status === 'pending'
  ) || [];

  const filteredOrders = poolOrders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(search.toLowerCase()) ||
                         order.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const handleClaimOrder = async (orderId: string) => {
    try {
      await updateWorkOrder.mutateAsync({
        id: orderId,
        data: {
          assigned_to: user?.id,
          status: 'pending' // Keep as pending until actually started
        }
      });

      toast({
        title: 'Suksess',
        description: 'Arbeidsordre tildelt til deg',
      });
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke ta arbeidsordre',
        variant: 'destructive'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Høy';
      case 'medium': return 'Normal';
      case 'low': return 'Lav';
      default: return 'Normal';
    }
  };

  const OrderCard = ({ order }: { order: any }) => (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold leading-tight line-clamp-2">
              {order.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{order.customer?.name || 'Ingen kunde'}</span>
            </div>
          </div>
          <Badge variant="outline" className={getPriorityColor(order.priority || 'medium')}>
            {getPriorityText(order.priority || 'medium')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {order.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {order.description}
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Estimert:</span>
            <span className="font-medium">{order.estimated_hours || 0}t</span>
          </div>
          
          {order.customer?.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground truncate">
                {order.customer.address}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Opprettet: {new Date(order.created_at).toLocaleDateString('nb-NO')}
          </div>
          <Button 
            onClick={() => handleClaimOrder(order.id)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Grab className="w-4 h-4" />
            Ta ordre
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Søk ledige ordrer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Prioritet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle prioriteter</SelectItem>
              <SelectItem value="high">Høy prioritet</SelectItem>
              <SelectItem value="medium">Normal prioritet</SelectItem>
              <SelectItem value="low">Lav prioritet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <p>Ingen ledige ordrer akkurat nå</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ordre-pool</h2>
        <Badge variant="secondary" className="text-base px-3 py-1">
          {filteredOrders.length} ledige ordrer
        </Badge>
      </div>

      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="available">Ledige ordrer</TabsTrigger>
          <TabsTrigger value="urgent">Hastesaker</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Søk etter ordrer, kunder eller beskrivelser..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Prioritet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle prioriteter</SelectItem>
                <SelectItem value="high">Høy prioritet</SelectItem>
                <SelectItem value="medium">Normal prioritet</SelectItem>
                <SelectItem value="low">Lav prioritet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders Grid */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ingen ledige ordrer</h3>
              <p className="text-muted-foreground">
                {search ? 'Prøv å justere søkekriteriene.' : 'Det er ingen ledige ordrer akkurat nå.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="urgent" className="space-y-6">
          {/* Urgent orders */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrders
              .filter(order => order.priority === 'high')
              .map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}