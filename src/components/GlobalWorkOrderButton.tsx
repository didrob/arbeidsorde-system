import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkOrderWizard } from '@/contexts/WorkOrderWizardContext';
import { useIsMobile } from '@/hooks/use-mobile';

export function GlobalWorkOrderButton() {
  const { openWizard } = useWorkOrderWizard();
  const isMobile = useIsMobile();

  // Mobile: FAB is now in MobileNav bottom bar, don't render separate FAB
  if (isMobile) {
    return null;
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
