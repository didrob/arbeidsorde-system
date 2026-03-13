import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { MobileNav } from '@/components/mobile/MobileNav';
import { SimpleSidebar } from '@/components/SimpleSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GlobalWorkOrderButton } from '@/components/GlobalWorkOrderButton';
import { ASCOLogo } from '@/components/ASCOLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
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
  const { isFieldWorker } = useAuth();

  // Field workers ALWAYS get mobile interface, regardless of screen size or device
  if (isFieldWorker) {
    return (
      <div className="min-h-screen bg-background">
        <header className="flex items-center justify-between bg-cobalt px-4 py-3">
          <ASCOLogo variant="light" />
        </header>
        <main className={cn(
          "flex-1",
          showMobileNav && "pb-20"
        )}>
          {children}
        </main>
        <GlobalWorkOrderButton />
        {showMobileNav && (
          <MobileNav notificationCount={notificationCount} />
        )}
      </div>
    );
  }

  // Regular mobile users get mobile interface when requested
  if (isMobile && showMobileNav) {
    return (
      <div className="min-h-screen bg-background">
        <header className="flex items-center justify-between bg-cobalt px-4 py-3">
          <ASCOLogo variant="light" />
        </header>
        <main className={cn(
          "flex-1",
          showMobileNav && "pb-20"
        )}>
          {children}
        </main>
        <GlobalWorkOrderButton />
        {showMobileNav && (
          <MobileNav notificationCount={notificationCount} />
        )}
      </div>
    );
  }

  // Desktop/Tablet layout with sidebar for admin/managers
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SimpleSidebar />
        <div className="flex-1 flex flex-col">
          {/* Global topbar with create button */}
          <header className="flex-shrink-0 flex items-center justify-end gap-2 bg-cobalt px-6 py-2">
            <ThemeToggle />
            <GlobalWorkOrderButton />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}