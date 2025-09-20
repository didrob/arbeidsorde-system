import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileNav } from '@/components/mobile/MobileNav';
import { SimpleSidebar } from '@/components/SimpleSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
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

  if (isMobile) {
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

  // Desktop/Tablet layout with sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SimpleSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}