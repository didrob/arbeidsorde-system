import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Save, X, AlertTriangle, Clock, User, FileText } from 'lucide-react';

interface BulkWorkOrderEditorProps {
  selectedOrders: any[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface BulkUpdateData {
  status?: string;
  assigned_to?: string;
  pricing_model?: string;
  estimated_hours?: number;
  notes?: string;
}

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export function BulkWorkOrderEditor({ selectedOrders, isOpen, onClose, onUpdate }: BulkWorkOrderEditorProps) {
  const [updateData, setUpdateData] = useState<BulkUpdateData>({});
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true, warnings: [], errors: [] });
  const [showPreview, setShowPreview] = useState(false);
  const [auditReason, setAuditReason] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validateBulkUpdate = (orders: any[], updates: BulkUpdateData): ValidationResult => {
    const warnings: string[] = [];
    const errors: string[] = [];

    orders.forEach(order => {
      // Check if order has active time entries when changing status
      if (updates.status && updates.status !== order.status) {
        if (order.status === 'in_progress' && updates.status === 'completed') {
          // Check for active time entries - this would need to be fetched from backend
          warnings.push(`Ordre ${order.title} har aktive tidsregistreringer som må avsluttes først.`);
        }
      }

      // Check if order is already completed
      if (order.status === 'completed' && updates.status && updates.status !== 'completed') {
        warnings.push(`Ordre ${order.title} er allerede fullført og endring kan påvirke fakturering.`);
      }

      // Check assignment conflicts
      if (updates.assigned_to && order.assigned_to && order.assigned_to !== updates.assigned_to) {
        warnings.push(`Ordre ${order.title} er allerede tildelt - dette vil overskrive eksisterende tildeling.`);
      }
    });

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  };

  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { updates: BulkUpdateData; orderIds: string[]; reason: string }) => {
      // Create audit log entry first
      const auditPromises = data.orderIds.map(orderId =>
        supabase.from('work_order_audit_log').insert({
          work_order_id: orderId,
          action: 'bulk_update',
          details: JSON.parse(JSON.stringify({
            updates: data.updates,
            reason: data.reason,
            order_count: data.orderIds.length
          })),
          performed_by: (await supabase.auth.getUser()).data.user?.id
        })
      );

      await Promise.all(auditPromises);

      // Perform bulk update
      const cleanUpdates = Object.fromEntries(
        Object.entries(data.updates).filter(([_, value]) => value !== undefined && value !== '')
      );

      const { error } = await supabase
        .from('work_orders')
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString()
        })
        .in('id', data.orderIds);

      if (error) throw error;

      return { updated: data.orderIds.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      toast({
        title: 'Bulk oppdatering fullført',
        description: `${result.updated} arbeidsordrer ble oppdatert.`
      });
      onUpdate();
      onClose();
      setUpdateData({});
      setAuditReason('');
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved bulk oppdatering',
        description: error.message || 'Kunne ikke oppdatere arbeidsordrer.',
        variant: 'destructive'
      });
    }
  });

  const handleFieldChange = (field: keyof BulkUpdateData, value: any) => {
    const newUpdateData = { ...updateData, [field]: value };
    setUpdateData(newUpdateData);
    
    // Validate on change
    const validation = validateBulkUpdate(selectedOrders, newUpdateData);
    setValidationResult(validation);
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleSubmit = () => {
    if (!auditReason.trim()) {
      toast({
        title: 'Begrunnelse kreves',
        description: 'Du må oppgi en begrunnelse for bulk-endringen.',
        variant: 'destructive'
      });
      return;
    }

    bulkUpdateMutation.mutate({
      updates: updateData,
      orderIds: selectedOrders.map(order => order.id),
      reason: auditReason
    });
  };

  const affectedOrders = selectedOrders?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Bulk Rediger Arbeidsordrer ({affectedOrders} valgt)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Validation Alerts */}
          {validationResult.warnings.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-yellow-800 text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Advarsler
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-sm text-yellow-700 space-y-1">
                  {validationResult.warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {validationResult.errors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-800 text-sm flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Feil
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-sm text-red-700 space-y-1">
                  {validationResult.errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {!showPreview ? (
            <>
              {/* Bulk Edit Form */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={updateData.status || ""} 
                    onValueChange={(value) => handleFieldChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg ny status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ikke endre</SelectItem>
                      <SelectItem value="pending">Venter</SelectItem>
                      <SelectItem value="in_progress">Pågår</SelectItem>
                      <SelectItem value="completed">Fullført</SelectItem>
                      <SelectItem value="cancelled">Avbrutt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estimerte timer</Label>
                  <Input
                    type="number"
                    placeholder="Ikke endre"
                    value={updateData.estimated_hours || ''}
                    onChange={(e) => handleFieldChange('estimated_hours', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prismodell</Label>
                  <Select 
                    value={updateData.pricing_model || ""} 
                    onValueChange={(value) => handleFieldChange('pricing_model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg prismodell..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ikke endre</SelectItem>
                      <SelectItem value="fixed">Fast pris</SelectItem>
                      <SelectItem value="resource_based">Ressursbasert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tildel til</Label>
                  <Input
                    placeholder="Ikke endre"
                    value={updateData.assigned_to || ''}
                    onChange={(e) => handleFieldChange('assigned_to', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tilleggsnotater</Label>
                <Textarea
                  placeholder="Legg til notater som vil bli lagt til alle valgte ordrer..."
                  value={updateData.notes || ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Begrunnelse for endring (påkrevd)</Label>
                <Textarea
                  placeholder="Beskriv hvorfor disse endringene gjøres..."
                  value={auditReason}
                  onChange={(e) => setAuditReason(e.target.value)}
                  className="border-primary/50"
                />
              </div>
            </>
          ) : (
            <>
              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Forhåndsvisning av endringer</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Arbeidsordre</TableHead>
                        <TableHead>Nåværende Status</TableHead>
                        <TableHead>Ny Status</TableHead>
                        <TableHead>Endringer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {updateData.status || order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              {updateData.estimated_hours && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {updateData.estimated_hours}t
                                </div>
                              )}
                              {updateData.assigned_to && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {updateData.assigned_to}
                                </div>
                              )}
                              {updateData.notes && (
                                <div className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  +notater
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          {!showPreview ? (
            <Button 
              onClick={handlePreview}
              disabled={Object.keys(updateData).length === 0}
            >
              Forhåndsvis endringer
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Tilbake til redigering
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!validationResult.isValid || !auditReason.trim() || bulkUpdateMutation.isPending}
              >
                {bulkUpdateMutation.isPending && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                <Save className="h-4 w-4 mr-2" />
                Lagre endringer
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}