import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { MobileNav } from '@/components/mobile/MobileNav';
import { SimpleSidebar } from '@/components/SimpleSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GlobalWorkOrderButton } from '@/components/GlobalWorkOrderButton';
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
        <main className={cn(
          "flex-1",
          showMobileNav && "pb-20" // Space for bottom nav
        )}>
          {children}
        </main>
        
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
        <main className={cn(
          "flex-1",
          showMobileNav && "pb-20" // Space for bottom nav
        )}>
          {children}
        </main>
        
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
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}