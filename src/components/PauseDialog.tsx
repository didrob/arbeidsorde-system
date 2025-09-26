import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PAUSE_REASONS } from '@/hooks/usePauseManager';
import { Coffee, Users, Wrench, Package, AlertTriangle, Car, Clock, MoreHorizontal } from 'lucide-react';

interface PauseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartPause: (reason: string, notes?: string) => void;
  isLoading?: boolean;
}

const REASON_ICONS = {
  lunch: Coffee,
  meeting: Users,
  waiting_for_equipment: Wrench,
  waiting_for_materials: Package,
  technical_issues: AlertTriangle,
  travel: Car,
  break: Clock,
  other: MoreHorizontal
};

export function PauseDialog({ open, onOpenChange, onStartPause, isLoading = false }: PauseDialogProps) {
  const [selectedReason, setSelectedReason] = useState('break');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    onStartPause(selectedReason, notes.trim() || undefined);
    setNotes('');
    onOpenChange(false);
  };

  const handleQuickPause = () => {
    onStartPause('break');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start pause</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex gap-2">
            <Button 
              onClick={handleQuickPause}
              disabled={isLoading}
              className="flex-1"
              variant="outline"
            >
              Rask pause
            </Button>
          </div>

          <div className="space-y-4">
            <Label>Velg pausegrunn:</Label>
            <RadioGroup 
              value={selectedReason} 
              onValueChange={setSelectedReason}
              className="grid grid-cols-2 gap-2"
            >
              {PAUSE_REASONS.map((reason) => {
                const IconComponent = REASON_ICONS[reason.value as keyof typeof REASON_ICONS];
                return (
                  <div key={reason.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label 
                      htmlFor={reason.value} 
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <IconComponent className="h-4 w-4" />
                      {reason.label}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notater (valgfritt):</Label>
            <Textarea
              id="notes"
              placeholder="Legg til ekstra informasjon om pausen..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Avbryt
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1"
            >
              Start pause
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}