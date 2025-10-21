import { ScrollArea } from '@/components/ui/scroll-area';
import { ResourceCard } from './ResourceCard';
import { ResourceWithUtilization } from '@/lib/plannerUtils';
import { cn } from '@/lib/utils';

interface ResourceColumnProps {
  title: string;
  icon: string;
  resources: ResourceWithUtilization[];
  onResourceClick: (personnelId: string) => void;
  colorClass?: string;
}

export function ResourceColumn({ 
  title, 
  icon, 
  resources, 
  onResourceClick,
  colorClass 
}: ResourceColumnProps) {
  return (
    <div className="flex flex-col h-full border-r last:border-r-0">
      {/* Column header */}
      <div className={cn('p-4 border-b bg-muted/50', colorClass)}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <h2 className="font-semibold text-sm">{title}</h2>
            <p className="text-xs text-muted-foreground">{resources.length} ressurser</p>
          </div>
        </div>
      </div>

      {/* Column content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {resources.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Ingen ressurser
            </div>
          ) : (
            resources.map(resource => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onClick={() => onResourceClick(resource.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
