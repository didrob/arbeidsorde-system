import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Play, Pause, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePauseManager } from '@/hooks/usePauseManager';
import { PauseDialog } from '@/components/PauseDialog';
import { PauseHistoryView } from '@/components/PauseHistoryView';

interface TimeEntry {
  id: string;
  start_time: string;
  end_time: string | null;
  notes: string | null;
  break_duration: number;
}

interface TimeTrackerProps {
  workOrderId: string;
  onComplete: () => void;
}

export function TimeTracker({ workOrderId, onComplete }: TimeTrackerProps) {
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [notes, setNotes] = useState('');
  const [totalTime, setTotalTime] = useState(0);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    pauseState,
    breaks,
    startPause,
    endPause,
    getTotalPauseTime,
    isStartingPause,
    isEndingPause
  } = usePauseManager(currentEntry?.id || null);

  useEffect(() => {
    fetchActiveTimeEntry();
    fetchTotalTime();
  }, [workOrderId, user]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isTracking && currentEntry && !pauseState.isOnPause) {
      interval = setInterval(() => {
        const startTime = new Date(currentEntry.start_time);
        const now = new Date();
        const totalElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const pauseTime = getTotalPauseTime();
        const workingTime = totalElapsed - pauseTime;
        setElapsedTime(Math.max(0, workingTime));
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTracking, currentEntry, pauseState.isOnPause, getTotalPauseTime]);

  const fetchActiveTimeEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('work_order_time_entries')
        .select('*')
        .eq('work_order_id', workOrderId)
        .eq('user_id', user?.id)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setCurrentEntry(data[0]);
        setIsTracking(true);
        setNotes(data[0].notes || '');
        
        // Calculate elapsed time
        const startTime = new Date(data[0].start_time);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }
    } catch (error) {
      console.error('Error fetching time entry:', error);
    }
  };

  const fetchTotalTime = async () => {
    try {
      const { data, error } = await supabase
        .from('work_order_time_entries')
        .select('start_time, end_time, break_duration')
        .eq('work_order_id', workOrderId)
        .eq('user_id', user?.id)
        .not('end_time', 'is', null);

      if (error) throw error;

      let total = 0;
      data?.forEach(entry => {
        if (entry.end_time) {
          const start = new Date(entry.start_time);
          const end = new Date(entry.end_time);
          const duration = (end.getTime() - start.getTime()) / 1000;
          const breakDuration = (entry.break_duration || 0) * 60; // Convert minutes to seconds
          total += duration - breakDuration;
        }
      });

      setTotalTime(total);
    } catch (error) {
      console.error('Error fetching total time:', error);
    }
  };

  const startTimer = async () => {
    try {
      const { data, error } = await supabase
        .from('work_order_time_entries')
        .insert({
          work_order_id: workOrderId,
          user_id: user?.id,
          start_time: new Date().toISOString(),
          notes: ''
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentEntry(data);
      setIsTracking(true);
      setElapsedTime(0);
      
      toast({
        title: "Timer startet",
        description: "Tidsregistrering er nå aktiv for denne arbeidsordren.",
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      toast({
        variant: "destructive",
        title: "Feil ved start av timer",
        description: "Kunne ikke starte tidsregistrering.",
      });
    }
  };

  const stopTimer = async () => {
    if (!currentEntry) return;

    try {
      const { error } = await supabase
        .from('work_order_time_entries')
        .update({
          end_time: new Date().toISOString(),
          notes: notes
        })
        .eq('id', currentEntry.id);

      if (error) throw error;

      setCurrentEntry(null);
      setIsTracking(false);
      setElapsedTime(0);
      setNotes('');
      await fetchTotalTime();
      
      toast({
        title: "Timer stoppet",
        description: "Tidsregistrering er lagret.",
      });
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast({
        variant: "destructive",
        title: "Feil ved stopp av timer",
        description: "Kunne ikke stoppe tidsregistrering.",
      });
    }
  };

  const updateNotes = async () => {
    if (!currentEntry) return;

    try {
      const { error } = await supabase
        .from('work_order_time_entries')
        .update({ notes })
        .eq('id', currentEntry.id);

      if (error) throw error;

      toast({
        title: "Notater lagret",
        description: "Dine notater er oppdatert.",
      });
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHours = (seconds: number) => {
    return (seconds / 3600).toFixed(2);
  };

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Tidsregistrering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pauseState.isOnPause ? (
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-orange-500 animate-pulse">
              {formatTime(pauseState.pauseElapsedTime)}
            </div>
            <p className="text-sm text-muted-foreground">På pause</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-primary">
              {formatTime(elapsedTime)}
            </div>
            <p className="text-sm text-muted-foreground">Aktiv tid</p>
          </div>
        )}

        <div className="text-center">
          <div className="text-lg font-semibold">
            {formatHours(totalTime + elapsedTime)} timer totalt
          </div>
          <p className="text-sm text-muted-foreground">Total registrert tid</p>
          {getTotalPauseTime() > 0 && (
            <p className="text-xs text-muted-foreground">
              ({formatTime(getTotalPauseTime())} pauser)
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {!isTracking ? (
            <Button onClick={startTimer} className="flex-1" size="lg">
              <Play className="h-4 w-4 mr-2" />
              Start Timer
            </Button>
          ) : pauseState.isOnPause ? (
            <Button 
              onClick={endPause} 
              disabled={isEndingPause}
              className="flex-1" 
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Fortsett arbeid
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => setShowPauseDialog(true)}
                disabled={isStartingPause}
                variant="outline" 
                className="flex-1" 
                size="lg"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button onClick={stopTimer} variant="destructive" className="flex-1" size="lg">
                <Square className="h-4 w-4 mr-2" />
                Stopp Timer
              </Button>
            </>
          )}
        </div>

        {isTracking && !pauseState.isOnPause && (
          <div className="space-y-2">
            <Textarea
              placeholder="Legg til notater for denne arbeidsperioden..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={updateNotes}
            />
          </div>
        )}

        <PauseHistoryView 
          breaks={breaks} 
          currentPauseElapsed={pauseState.isOnPause ? pauseState.pauseElapsedTime : undefined}
        />
      </CardContent>

      <PauseDialog
        open={showPauseDialog}
        onOpenChange={setShowPauseDialog}
        onStartPause={startPause}
        isLoading={isStartingPause}
      />
    </Card>
  );
}