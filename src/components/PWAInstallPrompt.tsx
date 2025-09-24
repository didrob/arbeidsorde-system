import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Share, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';

export function PWAInstallPrompt() {
  const { showInstallPrompt, installPWA, dismissInstallPrompt, isInstalling, isIOS } = usePWAInstall();

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
              {isIOS ? (
                <Share className="h-5 w-5 text-primary" />
              ) : (
                <Download className="h-5 w-5 text-primary" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                {isIOS ? 'Legg til på hjemskjermen' : 'Installer app'}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {isIOS 
                  ? 'Trykk på del-ikonet og velg "Legg til på hjemskjermen"'
                  : 'Legg til på hjemskjermen for raskere tilgang og bedre opplevelse'
                }
              </p>
              
              {isIOS && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 p-2 bg-muted/30 rounded">
                  <Smartphone className="h-4 w-4" />
                  <span>Safari → Del → Legg til på hjemskjermen</span>
                </div>
              )}
              
              <div className="flex gap-2">
                {!isIOS && (
                  <Button 
                    size="sm" 
                    onClick={installPWA}
                    disabled={isInstalling}
                    className="flex-1 focus-ring"
                  >
                    {isInstalling ? 'Installerer...' : 'Installer'}
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => dismissInstallPrompt(false)}
                  className="focus-ring"
                  disabled={isInstalling}
                >
                  Senere
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => dismissInstallPrompt(true)}
                  className="focus-ring"
                  disabled={isInstalling}
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