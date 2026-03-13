import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  FileText, 
  Package, 
  Camera, 
  CheckCircle, 
  AlertTriangle,
  Timer,
  DollarSign,
  User,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useMaterials, useAddMaterialToWorkOrder } from '@/hooks/useApi';
import { toast } from 'sonner';
import { AttachmentUpload } from './AttachmentUpload';

interface WorkOrder {
  id: string;
  title: string;
  description: string | null;
  status: string;
  customer_name: string;
  estimated_hours?: number | null;
  pricing_model?: string;
  pricing_type?: string;
  price_value?: number | null;
}

interface TimeEntry {
  id: string;
  start_time: string;
  end_time: string | null;
  break_duration: number;
  notes: string | null;
}

interface CompletionData {
  finalNotes: string;
  materialsUsed: Array<{
    material_id: string;
    quantity: number;
    notes?: string;
  }>;
  timeAdjustments: Array<{
    adjustment_type: 'extra_time' | 'deviation';
    reason: string;
    extra_minutes?: number;
    extra_cost?: number;
    notes: string;
  }>;
  attachments: File[];
}

interface WorkOrderCompletionDialogProps {
  open: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
  onComplete: () => void;
}

export const WorkOrderCompletionDialog = ({ 
  open, 
  onClose, 
  workOrder, 
  onComplete 
}: WorkOrderCompletionDialogProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [completionData, setCompletionData] = useState<CompletionData>({
    finalNotes: '',
    materialsUsed: [],
    timeAdjustments: [],
    attachments: []
  });

  const { data: materials = [] } = useMaterials();
  const addMaterial = useAddMaterialToWorkOrder();

  const steps = [
    { title: 'Tidsoversikt', icon: Clock },
    { title: 'Materialer', icon: Package },
    { title: 'Sluttrapport', icon: FileText },
    { title: 'Vedlegg', icon: Camera },
    { title: 'Bekreftelse', icon: CheckCircle },
    { title: 'Fullført', icon: CheckCircle }
  ];

  useEffect(() => {
    if (open && workOrder.id) {
      fetchTimeEntries();
    }
  }, [open, workOrder.id]);

  const fetchTimeEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('work_order_time_entries')
        .select('*')
        .eq('work_order_id', workOrder.id)
        .eq('user_id', user?.id)
        .order('start_time', { ascending: true });

      if (error) throw error;

      setTimeEntries(data || []);
      
      // Calculate total time
      let total = 0;
      data?.forEach(entry => {
        if (entry.end_time) {
          const start = new Date(entry.start_time);
          const end = new Date(entry.end_time);
          const duration = (end.getTime() - start.getTime()) / 1000;
          const breakDuration = (entry.break_duration || 0) * 60;
          total += duration - breakDuration;
        }
      });
      setTotalTime(total);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}t ${minutes}m`;
  };

  const formatHours = (seconds: number) => {
    return (seconds / 3600).toFixed(2);
  };

  const addMaterialUsed = () => {
    setCompletionData(prev => ({
      ...prev,
      materialsUsed: [...prev.materialsUsed, { material_id: '', quantity: 0 }]
    }));
  };

  const updateMaterialUsed = (index: number, field: string, value: any) => {
    setCompletionData(prev => ({
      ...prev,
      materialsUsed: prev.materialsUsed.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const removeMaterialUsed = (index: number) => {
    setCompletionData(prev => ({
      ...prev,
      materialsUsed: prev.materialsUsed.filter((_, i) => i !== index)
    }));
  };

  const addTimeAdjustment = (type: 'extra_time' | 'deviation') => {
    setCompletionData(prev => ({
      ...prev,
      timeAdjustments: [...prev.timeAdjustments, {
        adjustment_type: type,
        reason: '',
        extra_minutes: type === 'extra_time' ? 0 : undefined,
        extra_cost: 0,
        notes: ''
      }]
    }));
  };

  const updateTimeAdjustment = (index: number, field: string, value: any) => {
    setCompletionData(prev => ({
      ...prev,
      timeAdjustments: prev.timeAdjustments.map((adj, i) => 
        i === index ? { ...adj, [field]: value } : adj
      )
    }));
  };

  const removeTimeAdjustment = (index: number) => {
    setCompletionData(prev => ({
      ...prev,
      timeAdjustments: prev.timeAdjustments.filter((_, i) => i !== index)
    }));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // 1. Add materials to work order
      for (const material of completionData.materialsUsed) {
        if (material.material_id && material.quantity > 0) {
          await addMaterial.mutateAsync({
            workOrderId: workOrder.id,
            materialId: material.material_id,
            quantity: material.quantity,
            notes: material.notes
          });
        }
      }

      // 2. Add time adjustments
      for (const adjustment of completionData.timeAdjustments) {
        const { error } = await supabase
          .from('work_order_time_adjustments')
          .insert({
            work_order_id: workOrder.id,
            user_id: user?.id,
            adjustment_type: adjustment.adjustment_type,
            reason: adjustment.reason,
            extra_minutes: adjustment.extra_minutes || 0,
            extra_cost: adjustment.extra_cost || 0,
            notes: adjustment.notes
          });
        
        if (error) throw error;
      }

      // 3. Complete the work order with final notes
      const { error: updateError } = await supabase
        .from('work_orders')
        .update({ 
          status: 'completed',
          notes: completionData.finalNotes,
          completed_at: new Date().toISOString()
        })
        .eq('id', workOrder.id);

      if (updateError) throw updateError;

      // 4. End any active time entry
      const { error: timeError } = await supabase
        .from('work_order_time_entries')
        .update({ end_time: new Date().toISOString() })
        .eq('work_order_id', workOrder.id)
        .eq('user_id', user?.id)
        .is('end_time', null);

      if (timeError) throw timeError;

      // Show success step instead of closing immediately
      setCurrentStep(5); // Success step
      toast.success('Arbeidsordre fullført!');
      
    } catch (error) {
      console.error('Error completing work order:', error);
      toast.error('Feil ved fullføring av arbeidsordre');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: return true; // Time overview
      case 1: return true; // Materials (optional)
      case 2: return completionData.finalNotes.trim().length > 0; // Final notes required
      case 3: return true; // Attachments (optional)
      case 4: return true; // Confirmation
      case 5: return true; // Success (can close)
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Time Overview
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Tidssammendrag
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total tid brukt</p>
                    <p className="text-2xl font-bold text-primary">{formatHours(totalTime)} timer</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estimert</p>
                    <p className="text-2xl font-bold">
                      {workOrder.estimated_hours || 'Ikke satt'} 
                      {workOrder.estimated_hours && 't'}
                    </p>
                  </div>
                </div>
                
                {workOrder.estimated_hours && (
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      totalTime/3600 <= workOrder.estimated_hours ? 'default' : 'destructive'
                    }>
                      {totalTime/3600 <= workOrder.estimated_hours ? 'Innenfor estimat' : 'Over estimat'}
                    </Badge>
                    {totalTime/3600 > workOrder.estimated_hours && (
                      <span className="text-sm text-muted-foreground">
                        (+{((totalTime/3600) - workOrder.estimated_hours).toFixed(2)}t)
                      </span>
                    )}
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Tidsperioder</h4>
                  {timeEntries.map((entry, index) => (
                    <div key={entry.id} className="flex justify-between text-sm">
                      <span>
                        {new Date(entry.start_time).toLocaleTimeString('nb-NO', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} - {
                          entry.end_time 
                            ? new Date(entry.end_time).toLocaleTimeString('nb-NO', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })
                            : 'Pågår'
                        }
                      </span>
                      <span>
                        {entry.end_time && formatTime(
                          (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / 1000 
                          - (entry.break_duration || 0) * 60
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Time Adjustments */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Tidsjusteringer</h4>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeAdjustment('extra_time')}
                      >
                        Ekstra tid
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeAdjustment('deviation')}
                      >
                        Avvik
                      </Button>
                    </div>
                  </div>
                  
                  {completionData.timeAdjustments.map((adjustment, index) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={adjustment.adjustment_type === 'extra_time' ? 'default' : 'secondary'}>
                            {adjustment.adjustment_type === 'extra_time' ? 'Ekstra tid' : 'Avvik'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeAdjustment(index)}
                          >
                            Fjern
                          </Button>
                        </div>
                        <Input
                          placeholder="Årsak..."
                          value={adjustment.reason}
                          onChange={(e) => updateTimeAdjustment(index, 'reason', e.target.value)}
                        />
                        {adjustment.adjustment_type === 'extra_time' && (
                          <Input
                            type="number"
                            placeholder="Ekstra minutter"
                            value={adjustment.extra_minutes || ''}
                            onChange={(e) => updateTimeAdjustment(index, 'extra_minutes', parseInt(e.target.value) || 0)}
                          />
                        )}
                        <Input
                          type="number"
                          placeholder="Ekstra kostnad (kr)"
                          value={adjustment.extra_cost || ''}
                          onChange={(e) => updateTimeAdjustment(index, 'extra_cost', parseFloat(e.target.value) || 0)}
                        />
                        <Textarea
                          placeholder="Notater..."
                          value={adjustment.notes}
                          onChange={(e) => updateTimeAdjustment(index, 'notes', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 1: // Materials
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Materialer brukt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={addMaterialUsed} variant="outline" className="w-full">
                  Legg til material
                </Button>
                
                {completionData.materialsUsed.map((material, index) => (
                  <Card key={index} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Material {index + 1}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMaterialUsed(index)}
                        >
                          Fjern
                        </Button>
                      </div>
                      <Select
                        value={material.material_id}
                        onValueChange={(value) => updateMaterialUsed(index, 'material_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Velg material" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((mat) => (
                            <SelectItem key={mat.id} value={mat.id}>
                              {mat.name} ({mat.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Mengde"
                        value={material.quantity || ''}
                        onChange={(e) => updateMaterialUsed(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                      <Input
                        placeholder="Notater (valgfritt)"
                        value={material.notes || ''}
                        onChange={(e) => updateMaterialUsed(index, 'notes', e.target.value)}
                      />
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case 2: // Final Report
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Sluttrapport
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="finalNotes">Sammendrag av utført arbeid *</Label>
                  <Textarea
                    id="finalNotes"
                    placeholder="Beskriv arbeidet som er utført, eventuelle utfordringer, og resultat..."
                    value={completionData.finalNotes}
                    onChange={(e) => setCompletionData(prev => ({ ...prev, finalNotes: e.target.value }))}
                    rows={6}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Dette vil være synlig for kunden og brukes i faktureringen.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3: // Attachments
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Vedlegg og bilder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AttachmentUpload
                  workOrderId={workOrder.id}
                  onUploadComplete={() => {
                    // Refresh or handle upload completion
                  }}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 4: // Confirmation
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Bekreft fullføring
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Arbeidsordre</p>
                    <p className="text-muted-foreground">{workOrder.title}</p>
                  </div>
                  <div>
                    <p className="font-medium">Kunde</p>
                    <p className="text-muted-foreground">{workOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total tid</p>
                    <p className="text-muted-foreground">{formatHours(totalTime)} timer</p>
                  </div>
                  <div>
                    <p className="font-medium">Materialer</p>
                    <p className="text-muted-foreground">{completionData.materialsUsed.length} stk</p>
                  </div>
                </div>

                {completionData.timeAdjustments.length > 0 && (
                  <div>
                    <p className="font-medium text-sm">Tidsjusteringer</p>
                    <div className="space-y-1">
                      {completionData.timeAdjustments.map((adj, index) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          • {adj.reason} {adj.extra_cost && `(+${adj.extra_cost} kr)`}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm">Sluttrapport</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {completionData.finalNotes || 'Ingen sluttrapport'}
                  </p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-status-complete-subtle rounded-lg">
                  <CheckCircle className="h-5 w-5 text-status-complete" />
                  <p className="text-sm">
                    Arbeidsordren vil bli markert som fullført og du vil ikke lenger kunne redigere den.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 5: // Success
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-status-complete-subtle rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-status-complete" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Arbeidsordre fullført!
              </h3>
              <p className="text-muted-foreground mt-2">
                "{workOrder.title}" er nå registrert som fullført
              </p>
            </div>

            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Total tid brukt</p>
                    <p className="text-lg text-green-600">{formatHours(totalTime)} timer</p>
                  </div>
                  <div>
                    <p className="font-medium">Materialer brukt</p>
                    <p className="text-lg text-green-600">{completionData.materialsUsed.length} stk</p>
                  </div>
                </div>
                
                {completionData.timeAdjustments.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-medium text-sm text-amber-600">
                      {completionData.timeAdjustments.length} tidsjustering(er) registrert
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                Arbeidsordren er klar for fakturering og vil vises som fullført i systemet.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl sm:max-w-2xl max-h-[95vh] overflow-y-auto mobile-dialog">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Fullfør arbeidsordre</DialogTitle>
        </DialogHeader>

        {/* Progress Steps - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={index} className="flex items-center flex-shrink-0">
                  <div className={`
                    flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-colors
                    ${isActive ? 'border-primary bg-primary text-primary-foreground' : 
                      isCompleted ? 'border-status-complete bg-status-complete text-foreground' : 
                      'border-muted-foreground bg-background'}
                  `}>
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-4 sm:w-8 h-0.5 mx-1 sm:mx-2 ${
                      isCompleted ? 'bg-status-complete' : 'bg-muted'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-2 text-center">
            {steps[currentStep].title}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[250px] sm:min-h-[300px]">
          {renderStep()}
        </div>

        {/* Navigation - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="order-2 sm:order-1"
          >
            Forrige
          </Button>
          
          <div className="flex gap-2 order-1 sm:order-2">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-initial">
              Avbryt
            </Button>
            
            {currentStep < steps.length - 2 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceedToNext()}
                className="flex-1 sm:flex-initial"
              >
                Neste
              </Button>
            ) : currentStep === steps.length - 2 ? (
              <Button
                onClick={handleComplete}
                disabled={!canProceedToNext() || isSubmitting}
                className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial"
              >
                {isSubmitting ? 'Fullører...' : 'Fullfør arbeidsordre'}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  onComplete();
                  onClose();
                }}
                className="bg-primary hover:bg-primary/90 flex-1 sm:flex-initial"
              >
                Lukk
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};