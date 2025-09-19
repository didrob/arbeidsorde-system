import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Truck, Users, Package, LogOut } from 'lucide-react';

interface WorkOrder {
  id: string;
  title: string;
  status: string;
  customer_id: string;
  created_at: string;
  customers: {
    name: string;
  };
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          id,
          title,
          status,
          customer_id,
          created_at,
          customers (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setWorkOrders(data || []);
    } catch (error) {
      console.error('Error fetching work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Venter', variant: 'secondary' as const },
      in_progress: { label: 'Pågår', variant: 'default' as const },
      completed: { label: 'Ferdig', variant: 'outline' as const },
      cancelled: { label: 'Avbrutt', variant: 'destructive' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Arbeidsordre System</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Velkommen, {user?.email}
            </span>
            <Button variant="outline" onClick={signOut} size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logg ut
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Plus className="h-5 w-5 mr-2 text-primary" />
                Ny Arbeidsordre
              </CardTitle>
              <CardDescription>
                Opprett en ny arbeidsordre for en kunde
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Kunder
              </CardTitle>
              <CardDescription>
                Administrer kunder og kundeavtaler
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Package className="h-5 w-5 mr-2 text-primary" />
                Materialer
              </CardTitle>
              <CardDescription>
                Oversikt over materialer og priser
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Work Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Nyeste Arbeidsordrer</CardTitle>
            <CardDescription>
              Oversikt over de siste arbeidesordrene
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Laster arbeidsordrer...
              </div>
            ) : workOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Ingen arbeidsordrer funnet
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Opprett din første arbeidsordre
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {workOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{order.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Kunde: {order.customers?.name || 'Ukjent'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('nb-NO')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;