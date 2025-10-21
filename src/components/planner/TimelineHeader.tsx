interface TimelineHeaderProps {
  viewMode: 'day' | 'week';
  selectedDate: Date;
}

export function TimelineHeader({ viewMode, selectedDate }: TimelineHeaderProps) {
  if (viewMode === 'day') {
    // Show hours from 6 AM to 8 PM
    const hours = Array.from({ length: 15 }, (_, i) => i + 6);
    
    return (
      <div className="flex border-b border-border bg-muted/50 sticky top-0 z-10">
        {hours.map((hour) => (
          <div
            key={hour}
            className="flex-1 min-w-[80px] p-2 text-center border-r border-border last:border-r-0"
          >
            <span className="text-xs font-medium text-muted-foreground">
              {hour.toString().padStart(2, '0')}:00
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Week view - show days
  const days = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
  
  return (
    <div className="flex border-b border-border bg-muted/50 sticky top-0 z-10">
      {days.map((day, index) => (
        <div
          key={day}
          className="flex-1 min-w-[100px] p-3 text-center border-r border-border last:border-r-0"
        >
          <span className="text-sm font-medium text-foreground">{day}</span>
        </div>
      ))}
    </div>
  );
}
