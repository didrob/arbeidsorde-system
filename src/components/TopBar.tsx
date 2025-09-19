import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TopBarProps {
  title: string;
  onCreateClick?: () => void;
}

export function TopBar({ title, onCreateClick }: TopBarProps) {
  return (
    <header className="bg-background border-b border-border px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        </div>
        {onCreateClick && (
          <Button onClick={onCreateClick} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Opprett ny
          </Button>
        )}
      </div>
    </header>
  );
}