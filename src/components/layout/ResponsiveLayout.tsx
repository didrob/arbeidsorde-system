import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNav } from '@/components/mobile/MobileNav';
import { SimpleSidebar } from '@/components/SimpleSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GlobalWorkOrderButton } from '@/components/GlobalWorkOrderButton';
import { ASCOLogo } from '@/components/ASCOLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SiteSelector } from '@/components/site/SiteSelector';
import { useSiteFilter } from '@/hooks/useSiteFilter';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: ReactNode;
  showMobileNav?: boolean;
  notificationCount?: number;
}

export function ResponsiveLayout({ 
  children, 
  showMobileNav = true,
  notificationCount = 0 
}: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();
  const { selectedSiteId, setSelectedSiteId } = useSiteFilter();

  // Mobile layout
  if (isMobile && showMobileNav) {
    return (
      <div className="min-h-screen bg-background">
        <header className="flex items-center justify-between bg-cobalt px-4 py-3">
          <ASCOLogo variant="light" />
          <SiteSelector
            selectedSiteId={selectedSiteId}
            onSiteChange={setSelectedSiteId}
            className="text-primary-foreground"
          />
        </header>
        <main className={cn("flex-1", showMobileNav && "pb-24")}>
          {children}
        </main>
        {showMobileNav && <MobileNav notificationCount={notificationCount} />}
      </div>
    );
  }

  // Desktop layout
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SimpleSidebar />
        <div className="flex-1 flex flex-col">
          <header className="flex-shrink-0 flex items-center justify-between gap-2 bg-cobalt px-6 py-2">
            <SiteSelector
              selectedSiteId={selectedSiteId}
              onSiteChange={setSelectedSiteId}
              className="text-primary-foreground"
            />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <GlobalWorkOrderButton />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
