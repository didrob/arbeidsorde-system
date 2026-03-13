import { ASCOLogo } from '@/components/ASCOLogo';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Clock,
  MapPin,
  BarChart3,
  Settings,
  LogOut,
  Wrench,
  Receipt,
  Calendar,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useSiteFilter } from "@/hooks/useSiteFilter";
import { useUserAccessibleSites } from "@/hooks/useOrganizations";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Arbeidsordrer", url: "/work-orders", icon: FileText },
  { title: "Kunder", url: "/customers", icon: Users },
  { title: "Materialer", url: "/materials", icon: Package },
  { title: "Ressurser", url: "/resources", icon: Wrench },
  { title: "Planlegger", url: "/planner", icon: Calendar },
  { title: "Tidssporing", url: "/time-tracking", icon: Clock },
  { title: "Kart", url: "/map", icon: MapPin },
  { title: "Rapporter", url: "/reports", icon: BarChart3 },
  { title: "Fakturaer", url: "/invoices", icon: Receipt },
  { title: "Innstillinger", url: "/settings", icon: Settings },
];

export function SimpleSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { selectedSiteId } = useSiteFilter();
  const { data: accessibleSites } = useUserAccessibleSites();

  const currentSiteName = selectedSiteId
    ? accessibleSites?.find(s => s.site_id === selectedSiteId)?.site_name
    : 'Alle lokasjoner';

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Logo/Header */}
      <div className="p-6 border-b border-border">
        <ASCOLogo variant="light" />
        {currentSiteName && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className={!selectedSiteId ? 'text-primary' : ''}>{currentSiteName}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={() =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.url)
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logg ut
        </Button>
      </div>
    </div>
  );
}
