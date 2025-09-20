import { ReactNode } from "react";
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
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background">
        <div className="flex items-center justify-between w-full px-6">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <h1 className="text-lg font-semibold">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {showCreateButton && (
              <Button onClick={onCreateClick}>
                <Plus className="h-4 w-4 mr-2" />
                Opprett ny
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}