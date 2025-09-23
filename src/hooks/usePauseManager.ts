import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface WorkOrderBreak {
  id: string;
  time_entry_id: string;
  start_time: string;
  end_time: string | null;
  reason: string;
  notes: string | null;
}

export interface PauseState {
  isOnPause: boolean;
  currentBreak: WorkOrderBreak | null;
  pauseStartTime: Date | null;
  pauseElapsedTime: number;
}

export const PAUSE_REASONS = [
  { value: 'lunch', label: 'Lunsj' },
  { value: 'meeting', label: 'Møte' },
  { value: 'waiting_for_equipment', label: 'Venter på utstyr' },
  { value: 'waiting_for_materials', label: 'Venter på materialer' },
  { value: 'technical_issues', label: 'Tekniske problemer' },
  { value: 'travel', label: 'Reise' },
  { value: 'break', label: 'Pause' },
  { value: 'other', label: 'Annet' }
];

export function usePauseManager(timeEntryId: string | null) {
  const [pauseState, setPauseState] = useState<PauseState>({
    isOnPause: false,
    currentBreak: null,
    pauseStartTime: null,
    pauseElapsedTime: 0
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch breaks for current time entry
  const { data: breaks = [] } = useQuery({
    queryKey: ['work-order-breaks', timeEntryId],
    queryFn: async () => {
      if (!timeEntryId) return [];
      
      const { data, error } = await supabase
        .from('work_order_breaks')
        .select('*')
        .eq('time_entry_id', timeEntryId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data as WorkOrderBreak[];
    },
    enabled: !!timeEntryId
  });

  // Check for active break
  useEffect(() => {
    const activeBreak = breaks.find(b => !b.end_time);
    if (activeBreak) {
      setPauseState({
        isOnPause: true,
        currentBreak: activeBreak,
        pauseStartTime: new Date(activeBreak.start_time),
        pauseElapsedTime: 0
      });
    } else {
      setPauseState(prev => ({ ...prev, isOnPause: false, currentBreak: null }));
    }
  }, [breaks]);

  // Update elapsed time during pause
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (pauseState.isOnPause && pauseState.pauseStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - pauseState.pauseStartTime!.getTime()) / 1000);
        setPauseState(prev => ({ ...prev, pauseElapsedTime: elapsed }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pauseState.isOnPause, pauseState.pauseStartTime]);

  const startPauseMutation = useMutation({
    mutationFn: async ({ reason, notes }: { reason: string; notes?: string }) => {
      if (!timeEntryId) throw new Error('No active time entry');

      const { data, error } = await supabase
        .from('work_order_breaks')
        .insert({
          time_entry_id: timeEntryId,
          reason,
          notes: notes || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-breaks', timeEntryId] });
      toast({
        title: "Pause startet",
        description: "Pauseregistrering er aktiv.",
      });
    },
    onError: (error) => {
      console.error('Error starting pause:', error);
      toast({
        variant: "destructive",
        title: "Feil ved start av pause",
        description: "Kunne ikke starte pause.",
      });
    }
  });

  const endPauseMutation = useMutation({
    mutationFn: async (breakId: string) => {
      const { data, error } = await supabase
        .from('work_order_breaks')
        .update({ end_time: new Date().toISOString() })
        .eq('id', breakId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-breaks', timeEntryId] });
      toast({
        title: "Pause avsluttet",
        description: "Du har fortsatt arbeidet.",
      });
    },
    onError: (error) => {
      console.error('Error ending pause:', error);
      toast({
        variant: "destructive",
        title: "Feil ved avslutning av pause",
        description: "Kunne ikke avslutte pause.",
      });
    }
  });

  const startPause = (reason: string, notes?: string) => {
    startPauseMutation.mutate({ reason, notes });
  };

  const endPause = () => {
    if (pauseState.currentBreak) {
      endPauseMutation.mutate(pauseState.currentBreak.id);
    }
  };

  const getTotalPauseTime = () => {
    let total = 0;
    breaks.forEach(breakItem => {
      if (breakItem.end_time) {
        const start = new Date(breakItem.start_time);
        const end = new Date(breakItem.end_time);
        total += (end.getTime() - start.getTime()) / 1000;
      }
    });
    
    // Add current pause time if on pause
    if (pauseState.isOnPause) {
      total += pauseState.pauseElapsedTime;
    }
    
    return total;
  };

  return {
    pauseState,
    breaks,
    startPause,
    endPause,
    getTotalPauseTime,
    isStartingPause: startPauseMutation.isPending,
    isEndingPause: endPauseMutation.isPending
  };
}