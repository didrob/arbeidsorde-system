import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { LayoutDashboard, FileText, PlusCircle, User, LogOut, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'asco-portal-site';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/portal', icon: LayoutDashboard },
  { label: 'Mine ordrer', path: '/portal/orders', icon: FileText },
  { label: 'Ny bestilling', path: '/portal/new-order', icon: PlusCircle },
];

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [customerName, setCustomerName] = useState<string>('');
  const [siteName, setSiteName] = useState<string>('');

  useEffect(() => {
    const loadContext = async () => {
      // Get customer name
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('customer_id, full_name')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.customer_id) {
          const { data: customer } = await supabase
            .from('customers')
            .select('name')
            .eq('id', profile.customer_id)
            .single();
          if (customer) setCustomerName(customer.name);
        }
      }

      // Get site name
      const siteId = localStorage.getItem(STORAGE_KEY);
      if (siteId) {
        const { data: site } = await supabase
          .from('sites')
          .select('name')
          .eq('id', siteId)
          .single();
        if (site) setSiteName(site.name);
      }
    };
    loadContext();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="bg-card dark:bg-secondary text-foreground dark:text-secondary-foreground border-b border-border px-4 py-3 flex items-center justify-between shadow-brand-sm">
        <div className="flex items-center gap-3">
          <img src={document.documentElement.classList.contains('dark') ? '/logo-light.png' : '/logo-dark.png'} alt="ASCO" className="h-8" />
          {!isMobile && customerName && (
            <span className="text-sm font-medium opacity-80">{customerName}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {siteName && (
            <span className="text-xs flex items-center gap-1 opacity-70">
              <MapPin className="h-3 w-3" /> {siteName}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-cobalt-light"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Desktop tabs */}
      {!isMobile && (
        <nav className="border-b border-border bg-card px-4">
          <div className="max-w-5xl mx-auto flex gap-1">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive(item.path)
                    ? 'border-primary text-primary-text'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Content */}
      <main className={`flex-1 ${isMobile ? 'pb-20' : ''}`}>
        <div className="max-w-5xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 z-50 pb-safe-bottom">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 min-w-[60px] ${
                  isActive(item.path) ? 'text-primary-text' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
