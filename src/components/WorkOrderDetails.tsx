import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, User, Building, Calculator, MapPin, Paperclip } from 'lucide-react';
import { AttachmentViewer } from './AttachmentViewer';
import { AttachmentUpload } from './AttachmentUpload';

interface WorkOrderDetailsProps {
  workOrder: any;
  isOpen: boolean;
  onClose: () => void;
}

export function WorkOrderDetails({ workOrder, isOpen, onClose }: WorkOrderDetailsProps) {
  if (!workOrder) return null;

  const handleAttachmentUpdate = () => {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-status-active-subtle text-status-active';
      case 'in_progress': return 'bg-info text-info';
      case 'completed': return 'bg-status-complete-subtle text-status-complete';
      case 'cancelled': return 'bg-status-urgent-subtle text-status-urgent';
      default: return 'bg-muted text-muted-foreground';
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

  const calculateActualHours = () => {
    if (!workOrder.time_entries || workOrder.time_entries.length === 0) return 0;
    return workOrder.time_entries.reduce((total: number, entry: any) => {
      if (entry.start_time && entry.end_time) {
        const start = new Date(entry.start_time);
        const end = new Date(entry.end_time);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      return total;
    }, 0);
  };

  const calculateEfficiency = () => {
    const actualHours = calculateActualHours();
    const estimatedHours = workOrder.estimated_hours || 0;
    if (actualHours === 0 || estimatedHours === 0) return null;
    return Math.round((estimatedHours / actualHours) * 100);
  };

  const getEfficiencyColor = (efficiency: number | null) => {
    if (efficiency === null) return 'text-muted-foreground';
    if (efficiency >= 90) return 'text-status-complete';
    if (efficiency >= 70) return 'text-status-active';
    return 'text-destructive';
  };

  const actualHours = calculateActualHours();
  const efficiency = calculateEfficiency();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl">{workOrder.title}</DialogTitle>
            <Badge className={getStatusColor(workOrder.status)}>
              {getStatusText(workOrder.status)}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="time">Tid</TabsTrigger>
            <TabsTrigger value="materials">Materialer</TabsTrigger>
            <TabsTrigger value="attachments">
              <Paperclip className="h-4 w-4 mr-1" />
              Vedlegg
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Grunnleggende informasjon
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium">Beskrivelse:</span>
                  <p className="text-muted-foreground mt-1">{workOrder.description || 'Ingen beskrivelse'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Kunde:</span>
                    <p className="text-muted-foreground">{workOrder.customer?.name || 'Ikke tildelt'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Tildelt til:</span>
                    <p className="text-muted-foreground">{workOrder.assigned_user?.full_name || 'Ikke tildelt'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Opprettet:</span>
                    <p className="text-muted-foreground">
                      {new Date(workOrder.created_at).toLocaleDateString('nb-NO')}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Pristype:</span>
                    <p className="text-muted-foreground">
                      {workOrder.pricing_type === 'hourly' ? 'Timebasert' : 
                       workOrder.pricing_type === 'fixed' ? 'Fast pris' : 'Kun materialer'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Tid og effektivitetsanalyse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-info rounded-lg">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-info" />
                    <div className="text-2xl font-bold text-info">
                      {workOrder.estimated_hours || 0}t
                    </div>
                    <div className="text-sm text-muted-foreground">Estimert tid</div>
                  </div>
                  <div className="text-center p-4 bg-status-active-subtle rounded-lg">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-status-active" />
                    <div className="text-2xl font-bold text-status-active">
                      {actualHours.toFixed(1)}t
                    </div>
                    <div className="text-sm text-muted-foreground">Faktisk tid</div>
                  </div>
                  <div className="text-center p-4 bg-status-complete-subtle rounded-lg">
                    <Calculator className="h-8 w-8 mx-auto mb-2 text-status-complete" />
                    <div className={`text-2xl font-bold ${getEfficiencyColor(efficiency)}`}>
                      {efficiency ? `${efficiency}%` : 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Effektivitet</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {workOrder.time_entries && workOrder.time_entries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Timeregistreringer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workOrder.time_entries.map((entry: any, index: number) => (
                      <div key={entry.id || index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium">
                            {new Date(entry.start_time).toLocaleDateString('nb-NO')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(entry.start_time).toLocaleTimeString('nb-NO', { 
                              hour: '2-digit', minute: '2-digit' 
                            })} - {
                              entry.end_time 
                                ? new Date(entry.end_time).toLocaleTimeString('nb-NO', { 
                                    hour: '2-digit', minute: '2-digit' 
                                  })
                                : 'Pågår'
                            }
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {entry.end_time 
                              ? `${((new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / (1000 * 60 * 60)).toFixed(1)}t`
                              : 'Aktiv'
                            }
                          </div>
                          {entry.notes && (
                            <div className="text-sm text-muted-foreground">{entry.notes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="materials" className="space-y-6">
            {workOrder.materials && workOrder.materials.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Materialer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {workOrder.materials.map((material: any, index: number) => (
                      <div key={material.id || index} className="flex justify-between items-center p-2 border-b">
                        <div>
                          <div className="font-medium">{material.material?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {material.quantity} {material.material?.unit}
                          </div>
                        </div>
                        <div className="text-right">
                          {material.unit_price && (
                            <div className="font-medium">
                              {(material.quantity * material.unit_price).toLocaleString('nb-NO')} kr
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  Ingen materialer registrert på denne ordren
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="attachments" className="space-y-6">
            <AttachmentViewer workOrderId={workOrder.id} />
            <AttachmentUpload 
              workOrderId={workOrder.id} 
              onUploadComplete={handleAttachmentUpdate}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Lukk</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
