import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkOrderWizard } from '@/contexts/WorkOrderWizardContext';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface MobileNavProps {
  notificationCount?: number;
}

export function MobileNav({ notificationCount = 0 }: MobileNavProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { openWizard } = useWorkOrderWizard();

  // Hide nav on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const leftItems: NavItem[] = [
    { to: '/', icon: LayoutDashboard, label: 'Hjem' },
    { to: '/work-orders', icon: ClipboardList, label: 'Oppdrag' },
  ];

  const rightItems: NavItem[] = [
    { to: '/settings', icon: User, label: 'Profil' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isActive(item.to);

    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={cn(
          'flex flex-col items-center justify-center flex-1 px-2 py-2 rounded-lg',
          'transition-colors duration-200',
          active
            ? 'text-primary-text'
            : 'text-muted-grey hover:text-foreground'
        )}
      >
        <Icon className="h-5 w-5 mb-0.5" />
        <span className="text-[10px] font-medium">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border',
        'transition-transform duration-300 ease-in-out',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-end justify-around px-2 py-1">
        {/* Left nav items */}
        {leftItems.map(renderNavItem)}

        {/* Central FAB */}
        <div className="flex flex-col items-center justify-center flex-1 -mt-4">
          <button
            onClick={openWizard}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-asco-teal text-asco-teal-foreground shadow-brand-lg active:scale-95 transition-transform"
            aria-label="Ny arbeidsordre"
          >
            <Plus className="h-7 w-7" />
          </button>
          <span className="text-[10px] font-medium text-muted-grey mt-0.5">Ny</span>
        </div>

        {/* Right nav items */}
        {rightItems.map(renderNavItem)}
      </div>
    </nav>
  );
}
