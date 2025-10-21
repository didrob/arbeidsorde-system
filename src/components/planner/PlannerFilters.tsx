import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SiteSelector } from '@/components/site/SiteSelector';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { nb } from 'date-fns/locale';

interface PlannerFiltersProps {
  selectedSiteId: string | undefined;
  onSiteChange: (siteId: string | undefined) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: 'day' | 'week';
  onViewModeChange: (mode: 'day' | 'week') => void;
}

export function PlannerFilters({
  selectedSiteId,
  onSiteChange,
  selectedDate,
  onDateChange,
  viewMode,
  onViewModeChange,
}: PlannerFiltersProps) {
  const handlePrevious = () => {
    if (viewMode === 'day') {
      onDateChange(subDays(selectedDate, 1));
    } else {
      onDateChange(subDays(selectedDate, 7));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      onDateChange(addDays(selectedDate, 1));
    } else {
      onDateChange(addDays(selectedDate, 7));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-card border-b border-border">
      {/* Site Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">Sted:</span>
        <SiteSelector
          selectedSiteId={selectedSiteId}
          onSiteChange={onSiteChange}
          className="w-[200px]"
        />
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, 'PPP', { locale: nb })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button variant="outline" onClick={handleToday}>
          I dag
        </Button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm font-medium text-foreground">Visning:</span>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={viewMode === 'day' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('day')}
          >
            Dag
          </Button>
          <Button
            variant={viewMode === 'week' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('week')}
          >
            Uke
          </Button>
        </div>
      </div>
    </div>
  );
}
