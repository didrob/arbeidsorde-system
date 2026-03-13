import React from 'react';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QuickOrderFABProps {
  onClick: () => void;
  queueCount?: number;
}

export const QuickOrderFAB: React.FC<QuickOrderFABProps> = ({ onClick, queueCount = 0 }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-50 flex items-center justify-center h-16 w-16 rounded-full bg-asco-teal text-cobalt shadow-lg active:scale-95 transition-transform"
      aria-label="Ny ordre"
    >
      <Plus size={28} strokeWidth={2.5} />
      {queueCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {queueCount}
        </Badge>
      )}
    </button>
  );
};
