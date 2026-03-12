import React, { Suspense, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWorkOrderWizard } from '@/contexts/WorkOrderWizardContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const LazyWorkOrderWizard = React.lazy(
  () => import('@/components/workorder-wizard/WorkOrderWizard')
);

export function GlobalWorkOrderWizardPortal() {
  const { isOpen, closeWizard } = useWorkOrderWizard();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = useCallback(async (data: any) => {
    if (!user) return;
    
    const { error } = await supabase.from('work_orders').insert({
      ...data,
      user_id: user.id,
      status: 'pending',
    });

    if (error) {
      toast.error('Kunne ikke opprette arbeidsordre');
      throw error;
    }

    toast.success('Arbeidsordre opprettet!');
    queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    closeWizard();
  }, [user, closeWizard, queryClient]);

  const handleSaveDraft = useCallback(async (data: any) => {
    if (!user) return;

    const { error } = await supabase.from('work_orders').insert({
      ...data,
      user_id: user.id,
      status: 'draft',
    });

    if (error) {
      toast.error('Kunne ikke lagre kladd');
      throw error;
    }

    toast.success('Kladd lagret!');
    queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    closeWizard();
  }, [user, closeWizard, queryClient]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/50 animate-in fade-in duration-200"
        onClick={closeWizard}
      />
      {/* Slide-in panel */}
      <div
        className={cn(
          "absolute top-0 right-0 h-full bg-background shadow-2xl animate-in slide-in-from-right duration-200 ease-out flex flex-col",
          isMobile ? "w-full" : "w-[480px]"
        )}
      >
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          }
        >
          <LazyWorkOrderWizard
            open={true}
            onClose={closeWizard}
            onSubmit={handleSubmit}
            onSaveDraft={handleSaveDraft}
            embedded
          />
        </Suspense>
      </div>
    </div>,
    document.body
  );
}