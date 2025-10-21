import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  FileText,
  Wrench,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'work_order' | 'user' | 'invoice' | 'equipment' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  user?: {
    name: string;
    initials: string;
  };
  status?: 'success' | 'warning' | 'error' | 'info';
  metadata?: Record<string, any>;
}

interface DashboardActivityFeedProps {
  className?: string;
  maxItems?: number;
}

export function DashboardActivityFeed({ 
  className, 
  maxItems = 10 
}: DashboardActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with real API call
  useEffect(() => {
    const mockActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'work_order',
        title: 'Arbeidsordre #WO-2024-001 fullført',
        description: 'Vedlikehold av truck - site Mosjøen',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        user: { name: 'Ola Nordmann', initials: 'ON' },
        status: 'success'
      },
      {
        id: '2',
        type: 'user',
        title: 'Ny bruker registrert',
        description: 'Kari Hansen lagt til som feltarbeider',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        user: { name: 'Admin', initials: 'AD' },
        status: 'info'
      },
      {
        id: '3',
        type: 'work_order',
        title: 'Arbeidsordre #WO-2024-002 startet',
        description: 'Reparasjon av kran - site Sandnessjøen',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        user: { name: 'Per Hansen', initials: 'PH' },
        status: 'info'
      },
      {
        id: '4',
        type: 'equipment',
        title: 'Utstyr trenger vedlikehold',
        description: 'Gravemaskin XY-123 har utløpt service',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        status: 'warning'
      },
      {
        id: '5',
        type: 'invoice',
        title: 'Faktura #INV-2024-056 sendt',
        description: 'Kunde: ASCO Transport AS - 45,600 kr',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
        user: { name: 'Line Svendsen', initials: 'LS' },
        status: 'success'
      }
    ];

    // Simulate API delay
    setTimeout(() => {
      setActivities(mockActivities);
      setLoading(false);
    }, 500);
  }, []);

  const getActivityIcon = (type: string, status?: string) => {
    switch (type) {
      case 'work_order':
        return status === 'success' ? 
          <CheckCircle2 className="h-4 w-4 text-success" /> :
          <Clock className="h-4 w-4 text-primary" />;
      case 'user':
        return <UserPlus className="h-4 w-4 text-primary" />;
      case 'invoice':
        return <FileText className="h-4 w-4 text-success" />;
      case 'equipment':
        return <Wrench className="h-4 w-4 text-warning" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'border-l-success';
      case 'warning':
        return 'border-l-warning';
      case 'error':
        return 'border-l-destructive';
      default:
        return 'border-l-primary';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Siste aktivitet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Siste aktivitet</CardTitle>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, maxItems).map((activity) => (
            <div
              key={activity.id}
              className={cn(
                "flex items-start space-x-3 p-3 border-l-2 bg-gradient-to-r from-background to-muted/20 rounded-r-lg transition-colors hover:from-muted/10",
                getStatusColor(activity.status)
              )}
            >
              <div className="flex-shrink-0 mt-1">
                {activity.user ? (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs font-medium">
                      {activity.user.initials}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp, { 
                      addSuffix: true, 
                      locale: nb 
                    })}
                  </span>
                  {activity.user && (
                    <span className="text-xs text-muted-foreground">
                      av {activity.user.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full">
            Se all aktivitet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}