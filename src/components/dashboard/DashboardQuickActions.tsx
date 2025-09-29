import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, Settings, Calendar, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline';
  disabled?: boolean;
}

interface DashboardQuickActionsProps {
  className?: string;
}

export function DashboardQuickActions({ className }: DashboardQuickActionsProps) {
  const quickActions: QuickAction[] = [
    {
      id: 'new-work-order',
      label: 'Ny arbeidsordre',
      icon: <Plus className="h-4 w-4" />,
      onClick: () => {
        // Navigate to work order creation
        window.location.href = '/work-orders';
      },
      variant: 'default'
    },
    {
      id: 'view-reports',
      label: 'Se rapporter',
      icon: <BarChart3 className="h-4 w-4" />,
      onClick: () => {
        window.location.href = '/reports';
      },
      variant: 'outline'
    },
    {
      id: 'manage-customers',
      label: 'Administrer kunder',
      icon: <Users className="h-4 w-4" />,
      onClick: () => {
        window.location.href = '/customers';
      },
      variant: 'outline'
    },
    {
      id: 'schedule',
      label: 'Timeplan',
      icon: <Calendar className="h-4 w-4" />,
      onClick: () => {
        // Navigate to scheduling
        console.log('Navigate to scheduling');
      },
      variant: 'outline'
    },
    {
      id: 'invoices',
      label: 'Fakturaer',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => {
        window.location.href = '/invoices';
      },
      variant: 'outline'
    },
    {
      id: 'settings',
      label: 'Innstillinger',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => {
        window.location.href = '/settings';
      },
      variant: 'secondary'
    }
  ];

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Hurtighandlinger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="flex flex-col items-center justify-center h-auto py-4 px-3 space-y-2 text-xs"
            >
              {action.icon}
              <span className="text-center leading-tight">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}