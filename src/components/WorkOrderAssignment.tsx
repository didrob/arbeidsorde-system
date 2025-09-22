import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFieldWorkers, useWorkOrders, useUpdateWorkOrder } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { User, Clock, MapPin, AlertTriangle, Users, Zap } from 'lucide-react';

interface WorkOrderAssignmentProps {
  workOrder?: any;
  isOpen: boolean;
  onClose: () => void;
  bulkMode?: boolean;
  selectedOrders?: any[];
}

export function WorkOrderAssignment({ 
  workOrder, 
  isOpen, 
  onClose, 
  bulkMode = false, 
  selectedOrders = [] 
}: WorkOrderAssignmentProps) {
  const [selectedWorker, setSelectedWorker] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  
  const { data: fieldWorkers } = useFieldWorkers();
  const { data: workOrders } = useWorkOrders();
  const updateWorkOrder = useUpdateWorkOrder();
  const { toast } = useToast();

  const ordersToAssign = bulkMode ? selectedOrders : workOrder ? [workOrder] : [];

  // Calculate worker workload
  const getWorkerWorkload = (workerId: string) => {
    const workerOrders = workOrders?.filter(order => 
      order.assigned_to === workerId && 
      ['pending', 'in_progress'].includes(order.status)
    ) || [];
    
    const totalHours = workerOrders.reduce((sum, order) => sum + (order.estimated_hours || 0), 0);
    return {
      orderCount: workerOrders.length,
      totalHours,
      load: totalHours < 20 ? 'low' : totalHours < 40 ? 'medium' : 'high'
    };
  };

  // Get suggested workers based on workload and location
  const getSuggestedWorkers = () => {
    if (!fieldWorkers) return [];
    
    return fieldWorkers
      .map(worker => ({
        ...worker,
        workload: getWorkerWorkload(worker.user_id)
      }))
      .sort((a, b) => {
        // Sort by workload (ascending) then by name
        if (a.workload.totalHours !== b.workload.totalHours) {
          return a.workload.totalHours - b.workload.totalHours;
        }
        return a.full_name.localeCompare(b.full_name);
      });
  };

  const handleAssign = async () => {
    if (!selectedWorker) {
      toast({
        title: 'Feil',
        description: 'Velg en feltarbeider å tildele til',
        variant: 'destructive'
      });
      return;
    }

    try {
      for (const order of ordersToAssign) {
        await updateWorkOrder.mutateAsync({
          id: order.id,
          data: {
            assigned_to: selectedWorker,
            notes: assignmentNotes ? `${order.notes ? order.notes + '\n\n' : ''}Tildeling: ${assignmentNotes}` : order.notes,
            // Add urgency and due date if needed
          }
        });
      }

      toast({
        title: 'Suksess',
        description: `${ordersToAssign.length} arbeidsordre(r) tildelt`,
      });

      onClose();
      setSelectedWorker('');
      setAssignmentNotes('');
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke tildele arbeidsordre(r)',
        variant: 'destructive'
      });
    }
  };

  const getWorkloadColor = (load: string) => {
    switch (load) {
      case 'low': return 'text-success bg-success/10 border-success/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'high': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const getWorkloadText = (load: string) => {
    switch (load) {
      case 'low': return 'Lav';
      case 'medium': return 'Middels';
      case 'high': return 'Høy';
      default: return 'Ukjent';
    }
  };

  const suggestedWorkers = getSuggestedWorkers();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {bulkMode ? `Tildel ${ordersToAssign.length} arbeidsordrer` : 'Tildel arbeidsordre'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="assign" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assign">Tildeling</TabsTrigger>
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ordre som skal tildeles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ordersToAssign.map((order, index) => (
                    <div key={order.id || index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <div className="font-medium">{order.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Kunde: {order.customer?.name || 'Ikke tildelt'} • 
                          Estimert: {order.estimated_hours || 0}t
                        </div>
                      </div>
                      <Badge variant="outline" className={
                        order.status === 'pending' ? 'bg-warning/10 text-warning border-warning/20' : 
                        'bg-primary/10 text-primary border-primary/20'
                      }>
                        {order.status === 'pending' ? 'Venter' : 'Pågår'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Worker Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Anbefalte feltarbeidere
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {suggestedWorkers.slice(0, 3).map((worker) => (
                    <div 
                      key={worker.user_id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                        selectedWorker === worker.user_id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/30'
                      }`}
                      onClick={() => setSelectedWorker(worker.user_id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{worker.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {worker.workload.orderCount} aktive ordrer • {worker.workload.totalHours}t
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getWorkloadColor(worker.workload.load)}>
                            {getWorkloadText(worker.workload.load)} belastning
                          </Badge>
                          {worker.workload.load === 'low' && (
                            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                              Anbefalt
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Manual selection */}
                <div className="pt-4 border-t">
                  <Label className="text-base font-medium">Eller velg manuelt</Label>
                  <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Velg feltarbeider..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldWorkers?.map((worker) => {
                        const workload = getWorkerWorkload(worker.user_id);
                        return (
                          <SelectItem key={worker.user_id} value={worker.user_id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{worker.full_name}</span>
                              <Badge variant="outline" className={`ml-2 ${getWorkloadColor(workload.load)}`}>
                                {workload.orderCount} ordrer
                              </Badge>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tildelingsdetaljer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="urgency">Prioritet</Label>
                  <Select value={urgencyLevel} onValueChange={(value: 'low' | 'medium' | 'high') => setUrgencyLevel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Lav prioritet</SelectItem>
                      <SelectItem value="medium">Normal prioritet</SelectItem>
                      <SelectItem value="high">Høy prioritet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dueDate">Ønsket ferdigstillelse (valgfritt)</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Tildelingsnotater</Label>
                  <Textarea
                    placeholder="Spesielle instruksjoner eller notater for feltarbeideren..."
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            {/* Team Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Teamoversikt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {fieldWorkers?.map((worker) => {
                    const workload = getWorkerWorkload(worker.user_id);
                    return (
                      <div key={worker.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{worker.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {workload.orderCount} aktive ordrer • {workload.totalHours} estimerte timer
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getWorkloadColor(workload.load)}>
                            {getWorkloadText(workload.load)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button onClick={handleAssign} disabled={!selectedWorker}>
            Tildel {bulkMode ? `${ordersToAssign.length} ordrer` : 'ordre'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}