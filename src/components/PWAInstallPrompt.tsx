import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';

export function PWAInstallPrompt() {
  const { showInstallPrompt, installPWA, dismissInstallPrompt } = usePWAInstall();

  if (!showInstallPrompt) return null;

  return (
    <div className={cn(
      "fixed bottom-20 left-4 right-4 z-50 animate-slide-up safe-area-margin-bottom",
      "md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
    )}>
      <Card className="border-primary bg-primary/5 shadow-elegant">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <Download className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                Installer app
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Legg til på hjemskjermen for raskere tilgang og bedre opplevelse
              </p>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={installPWA}
                  className="flex-1 focus-ring"
                >
                  Installer
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={dismissInstallPrompt}
                  className="focus-ring"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}