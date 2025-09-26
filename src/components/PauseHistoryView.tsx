import { WorkOrderBreak, PAUSE_REASONS } from '@/hooks/usePauseManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Coffee, Users, Wrench, Package, AlertTriangle, Car, MoreHorizontal } from 'lucide-react';

interface PauseHistoryViewProps {
  breaks: WorkOrderBreak[];
  currentPauseElapsed?: number;
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

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatTimeRange(startTime: string, endTime?: string | null) {
  const start = new Date(startTime);
  const startStr = start.toLocaleTimeString('no-NO', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  if (!endTime) {
    return `${startStr} - Pågår`;
  }
  
  const end = new Date(endTime);
  const endStr = end.toLocaleTimeString('no-NO', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return `${startStr} - ${endStr}`;
}

function getBreakDuration(breakItem: WorkOrderBreak, currentElapsed?: number) {
  if (!breakItem.end_time) {
    return currentElapsed || 0;
  }
  
  const start = new Date(breakItem.start_time);
  const end = new Date(breakItem.end_time);
  return Math.floor((end.getTime() - start.getTime()) / 1000);
}

export function PauseHistoryView({ breaks, currentPauseElapsed }: PauseHistoryViewProps) {
  if (breaks.length === 0) {
    return null;
  }

  const totalPauseTime = breaks.reduce((total, breakItem) => {
    if (breakItem.end_time) {
      const start = new Date(breakItem.start_time);
      const end = new Date(breakItem.end_time);
      return total + Math.floor((end.getTime() - start.getTime()) / 1000);
    } else if (currentPauseElapsed !== undefined) {
      return total + currentPauseElapsed;
    }
    return total;
  }, 0);

  const getReasonLabel = (reason: string) => {
    return PAUSE_REASONS.find(r => r.value === reason)?.label || reason;
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pauser i dag
          </span>
          <Badge variant="secondary">
            {formatTime(totalPauseTime)} totalt
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {breaks.map((breakItem, index) => {
          const IconComponent = REASON_ICONS[breakItem.reason as keyof typeof REASON_ICONS] || Clock;
          const duration = getBreakDuration(breakItem, currentPauseElapsed);
          const isActive = !breakItem.end_time;
          
          return (
            <div key={breakItem.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`mt-0.5 ${isActive ? 'text-orange-500' : 'text-muted-foreground'}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {getReasonLabel(breakItem.reason)}
                      </span>
                      {isActive && (
                        <Badge variant="outline" className="text-xs animate-pulse">
                          Pågår
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimeRange(breakItem.start_time, breakItem.end_time)}
                    </div>
                    {breakItem.notes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {breakItem.notes}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm font-mono">
                  {formatTime(duration)}
                </div>
              </div>
              {index < breaks.length - 1 && <Separator className="mt-3" />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}