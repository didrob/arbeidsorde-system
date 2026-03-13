import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  onCreateClick?: () => void;
  createLabel?: string;
  actions?: ReactNode;
}

export function TopBar({ title, onCreateClick, createLabel = "Opprett ny", actions }: TopBarProps) {
  const isMobile = useIsMobile();
  
  return (
    <header className={cn(
      "bg-background border-b border-border",
      isMobile ? "px-4 py-4" : "px-8 py-6"
    )}>
      <div className={cn(
        "flex items-center justify-between",
        isMobile && actions && "flex-col gap-3 items-start"
      )}>
        <div className={cn(
          "flex items-center gap-4",
          isMobile && actions && "w-full justify-between"
        )}>
          <h1 className={cn(
            "font-semibold text-foreground",
            isMobile ? "text-xl" : "text-2xl"
          )}>
            {title}
          </h1>
          {isMobile && onCreateClick && (
            <Button 
              onClick={onCreateClick} 
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline">{createLabel}</span>
            </Button>
          )}
        </div>
        
        {actions && (
          <div className={isMobile ? "w-full" : "flex-shrink-0"}>
            {actions}
          </div>
        )}
        
        {!isMobile && onCreateClick && (
          <Button onClick={onCreateClick} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Opprett ny
          </Button>
        )}
      </div>
    </header>
  );
}