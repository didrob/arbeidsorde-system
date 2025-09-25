import { ReactNode, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileDataTableProps<T> {
  data: T[];
  columns: {
    key: keyof T;
    label: string;
    render?: (value: any, item: T) => ReactNode;
    mobileHidden?: boolean;
  }[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function MobileDataTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  loading = false,
  emptyMessage = "Ingen data tilgjengelig"
}: MobileDataTableProps<T>) {
  const isMobile = useIsMobile();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Desktop view - traditional table
  if (!isMobile) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 pb-2 border-b font-medium text-sm text-muted-foreground"
             style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((column) => (
            <div key={String(column.key)}>{column.label}</div>
          ))}
        </div>
        {data.map((item) => (
          <div 
            key={item.id} 
            className={cn(
              "grid gap-4 py-3 border-b last:border-b-0",
              onRowClick && "cursor-pointer hover:bg-accent/50 transition-colors"
            )}
            style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
            onClick={() => onRowClick?.(item)}
          >
            {columns.map((column) => (
              <div key={String(column.key)} className="text-sm">
                {column.render ? column.render(item[column.key], item) : String(item[column.key])}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Mobile view - card-based with expandable details
  const primaryColumns = columns.filter(col => !col.mobileHidden);
  const secondaryColumns = columns.filter(col => col.mobileHidden);

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const isExpanded = expandedRows.has(item.id);
        
        return (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-4">
              {/* Primary content - always visible */}
              <div className="space-y-2">
                {primaryColumns.map((column) => (
                  <div key={String(column.key)} className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground min-w-0 flex-1">
                      {column.label}:
                    </span>
                    <div className="text-sm font-medium text-right min-w-0 flex-1">
                      {column.render ? column.render(item[column.key], item) : String(item[column.key])}
                    </div>
                  </div>
                ))}
              </div>

              {/* Expansion toggle and secondary content */}
              {secondaryColumns.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 h-8 text-xs"
                    onClick={() => toggleRow(item.id)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Skjul detaljer
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-3 w-3 mr-1" />
                        Vis flere detaljer
                      </>
                    )}
                  </Button>
                  
                  {isExpanded && (
                    <div className="pt-3 border-t border-border space-y-2">
                      {secondaryColumns.map((column) => (
                        <div key={String(column.key)} className="flex justify-between items-start">
                          <span className="text-sm font-medium text-muted-foreground min-w-0 flex-1">
                            {column.label}:
                          </span>
                          <div className="text-sm text-right min-w-0 flex-1">
                            {column.render ? column.render(item[column.key], item) : String(item[column.key])}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Action button */}
              {onRowClick && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => onRowClick(item)}
                >
                  Se detaljer
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}