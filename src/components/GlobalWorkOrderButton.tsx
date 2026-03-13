import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkOrderWizard } from '@/contexts/WorkOrderWizardContext';
import { useIsMobile } from '@/hooks/use-mobile';

export function GlobalWorkOrderButton() {
  const { openWizard } = useWorkOrderWizard();
  const isMobile = useIsMobile();

  // Mobile: FAB in bottom-right corner
  if (isMobile) {
    return (
      <button
        onClick={openWizard}
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-asco-teal text-asco-teal-foreground shadow-lg active:scale-95 transition-transform"
        aria-label="Ny arbeidsordre"
      >
        <Plus className="h-6 w-6" />
      </button>
    );
  }

  // Desktop: Button in topbar
  return (
    <Button
      onClick={openWizard}
      className="bg-asco-teal text-asco-teal-foreground hover:bg-asco-teal/90 rounded-lg font-medium"
    >
      <Plus className="h-4 w-4 mr-1" />
      Ny ordre
    </Button>
  );
}
