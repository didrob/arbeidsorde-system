import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  started_at?: string | null;
}

interface WorkOrderConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  workOrder: WorkOrder;
  onConfirm: () => void;
}

export const WorkOrderConfirmationDialog = ({ 
  open, 
  onClose, 
  workOrder, 
  onConfirm 
}: WorkOrderConfirmationDialogProps) => {
  const { user } = useAuth();
  const [totalTime, setTotalTime] = useState(0);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (open && workOrder) {
      fetchTimeData();
    }
  }, [open, workOrder]);

  const fetchTimeData = async () => {
    if (!user?.id) return;
    
    try {
      const { data: entries, error } = await supabase
        .from('work_order_time_entries')
        .select('*')
        .eq('work_order_id', workOrder.id)
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;

      setTimeEntries(entries || []);
      
      const total = entries?.reduce((sum, entry) => {
        if (entry.end_time) {
          const start = new Date(entry.start_time).getTime();
          const end = new Date(entry.end_time).getTime();
          return sum + Math.floor((end - start) / 1000);
        }
        return sum;
      }, 0) || 0;

      setTotalTime(total);
    } catch (error) {
      console.error('Error fetching time data:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}t ${minutes}m`;
  };

  const formatHours = (seconds: number): string => {
    return (seconds / 3600).toFixed(1) + 't';
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    await onConfirm();
    setIsConfirming(false);
  };

  const estimatedSeconds = (workOrder.estimated_hours || 0) * 3600;
  const timeDifference = totalTime - estimatedSeconds;
  const isOverTime = timeDifference > 0;
  const isSignificantDifference = Math.abs(timeDifference) > 1800; // 30 minutes

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Fullfør arbeidsordre?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Work Order Info */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{workOrder.customer_name}</span>
                </div>
                <h3 className="font-semibold">{workOrder.title}</h3>
                {workOrder.description && (
                  <p className="text-sm text-muted-foreground">{workOrder.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Time Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Tidssammendrag</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Brukt tid:</p>
                    <p className="font-semibold text-lg">{formatTime(totalTime)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estimert tid:</p>
                    <p className="font-semibold text-lg">
                      {workOrder.estimated_hours ? formatHours(estimatedSeconds) : 'Ikke angitt'}
                    </p>
                  </div>
                </div>

                {workOrder.estimated_hours && isSignificantDifference && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">
                        {isOverTime ? 'Overtid' : 'Under estimat'}
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      {isOverTime ? '+' : ''}{formatTime(Math.abs(timeDifference))} 
                      {isOverTime ? ' mer enn estimert' : ' mindre enn estimert'}
                    </p>
                  </div>
                )}

                {/* Pricing info if available */}
                {workOrder.price_value && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {workOrder.pricing_type === 'fixed' ? 'Fast pris' : 'Timepris'}: 
                      <span className="font-medium ml-1">{workOrder.price_value} kr</span>
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Confirmation Message */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-center">
              Er du sikker på at du vil fullføre denne arbeidsordren? 
              Du vil få mulighet til å legge til materialer, vedlegg og kommentarer i neste steg.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={onClose}
              disabled={isConfirming}
            >
              Avbryt
            </Button>
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700" 
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Fullfører...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Ja, fullfør
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};