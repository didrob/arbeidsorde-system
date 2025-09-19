import { ReactNode } from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
}

export function PageLayout({
  children,
  title,
  description,
  actions,
  showCreateButton = false,
  onCreateClick
}: PageLayoutProps) {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
          {showCreateButton && (
            <Button onClick={onCreateClick} className="ml-auto">
              <Plus className="h-4 w-4 mr-2" />
              Opprett ny
            </Button>
          )}
        </div>
      </header>
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {description && (
            <div className="mb-6">
              <p className="text-muted-foreground">{description}</p>
            </div>
          )}
          {children}
        </div>
      </div>
    </SidebarInset>
  );
}