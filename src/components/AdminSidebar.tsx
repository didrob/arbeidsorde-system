import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Clock,
  MapPin,
  BarChart3,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: LayoutDashboard,
    description: "Oversikt og statistikk"
  },
  { 
    title: "Arbeidsordrer", 
    url: "/work-orders", 
    icon: FileText,
    description: "Administrer arbeidsordrer"
  },
  { 
    title: "Kunder", 
    url: "/customers", 
    icon: Users,
    description: "Kundedatabase"
  },
  { 
    title: "Materialer", 
    url: "/materials", 
    icon: Package,
    description: "Lagerstyring"
  },
  { 
    title: "Tidssporing", 
    url: "/time-tracking", 
    icon: Clock,
    description: "Timeregistrering"
  },
  { 
    title: "Kart", 
    url: "/map", 
    icon: MapPin,
    description: "GPS oversikt"
  },
  { 
    title: "Rapporter", 
    url: "/reports", 
    icon: BarChart3,
    description: "Rapporter og analyse"
  },
  { 
    title: "Innstillinger", 
    url: "/settings", 
    icon: Settings,
    description: "Systeminnstillinger"
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const location = useLocation();
  const { signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-card border-r border-border shadow-card transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-72"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">WorkFlow</h2>
              <p className="text-sm text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="hover:bg-accent"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={cn(
              "flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200",
              "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
              "group relative",
              isActive(item.url)
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
            {!collapsed && (
              <>
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs opacity-70">{item.description}</div>
                </div>
              </>
            )}
            
            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-popover text-popover-foreground rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center"
          )}
        >
          <LogOut className={cn("h-5 w-5", !collapsed && "mr-3")} />
          {!collapsed && "Logg ut"}
        </Button>
      </div>
    </div>
  );
}