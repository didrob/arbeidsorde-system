import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Settings,
  LogOut,
  Clock,
  MapPin,
  BarChart3,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
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

export function AppSidebar() {
  const { state: sidebarState } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    return isActive(path)
      ? "bg-primary text-primary-foreground font-medium shadow-sm"
      : "hover:bg-accent hover:text-accent-foreground";
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar
      className={cn(
        "transition-all duration-300",
        sidebarState === "collapsed" ? "w-14" : "w-72"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border p-4">
        {sidebarState !== "collapsed" && (
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
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel>Hovedmeny</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={getNavClassName(item.url)}>
                    <NavLink to={item.url} className="flex items-center space-x-3 w-full">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {sidebarState !== "collapsed" && (
                        <div className="flex-1 text-left">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs opacity-70">{item.description}</div>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            sidebarState === "collapsed" ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className={cn("h-5 w-5", sidebarState !== "collapsed" && "mr-3")} />
          {sidebarState !== "collapsed" && "Logg ut"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}