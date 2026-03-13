import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerOrders, useCustomerOrderStats } from '@/hooks/useCustomerOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, FileText, Clock, Activity } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Ventende', variant: 'outline' },
  in_progress: { label: 'Pågår', variant: 'default' },
  completed: { label: 'Fullført', variant: 'secondary' },
  cancelled: { label: 'Kansellert', variant: 'destructive' },
};

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: stats } = useCustomerOrderStats();
  const { data: recentOrders } = useCustomerOrders('all');

  const lastFive = recentOrders?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="font-heading text-2xl text-foreground">
          Velkommen{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}
        </h1>
        <p className="text-muted-foreground text-sm">Oversikt over dine bestillinger</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-brand-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-brand bg-primary/10">
                <FileText className="h-5 w-5 text-primary-text" />
              </div>
              <div>
                <p className="text-2xl font-heading text-foreground">{stats?.active ?? 0}</p>
                <p className="text-sm text-muted-foreground">Aktive ordrer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-brand-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-brand bg-primary/10">
                <Clock className="h-5 w-5 text-primary-text" />
              </div>
              <div>
                <p className="text-2xl font-heading text-foreground">{stats?.thisMonth ?? 0}</p>
                <p className="text-sm text-muted-foreground">Denne måneden</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-brand-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-brand bg-primary/10">
                <Activity className="h-5 w-5 text-primary-text" />
              </div>
              <div>
                <p className="text-2xl font-heading text-foreground">
                  {stats?.lastActivity
                    ? formatDistanceToNow(new Date(stats.lastActivity), { addSuffix: true, locale: nb })
                    : '—'}
                </p>
                <p className="text-sm text-muted-foreground">Siste aktivitet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New order CTA */}
      <Button
        onClick={() => navigate('/portal/new-order')}
        className="w-full md:w-auto h-14 text-base font-heading gap-2"
        size="lg"
      >
        <PlusCircle className="h-5 w-5" />
        Ny bestilling
      </Button>

      {/* Recent orders */}
      <Card className="shadow-brand-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-lg">Siste ordrer</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/portal/orders')} className="text-primary-text">
            Se alle →
          </Button>
        </CardHeader>
        <CardContent>
          {lastFive.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Ingen ordrer ennå</p>
          ) : (
            <div className="space-y-3">
              {lastFive.map(order => {
                const status = statusMap[order.status] || statusMap.pending;
                return (
                  <button
                    key={order.id}
                    onClick={() => navigate('/portal/orders')}
                    className="w-full flex items-center justify-between p-3 rounded-brand hover:bg-accent transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">{order.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.created_at), 'd. MMM yyyy', { locale: nb })}
                      </p>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDashboard;
