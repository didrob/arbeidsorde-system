import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Package, Plus, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { FieldWorkerDashboard } from '@/components/FieldWorkerDashboard';
import { TopBar } from '@/components/TopBar';

interface WorkOrder {
  id: string;
  title: string;
  status: string;
  customer_id: string;
  created_at: string;
  customers?: {
    name: string;
  };
  customer_name?: string;
}

interface UserProfile {
  role: string;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  const [stats, setStats] = useState({
    totalWorkOrders: 0,
    completedToday: 0,
    pendingOrders: 0,
    activeWorkers: 0,
    totalRevenue: 0,
    avgCompletionTime: 0
  });

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

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
      
      // Transform data to include customer_name for easier access
      const transformedData = (data || []).map(order => ({
        ...order,
        customer_name: order.customers?.name || 'Ukjent kunde'
      }));
      
      setWorkOrders(transformedData);
    } catch (error) {
      console.error('Error fetching work orders:', error);
    } finally {
      setLoadingOrders(false);
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

  const fetchStats = async () => {
    try {
      const [
        { count: totalCount },
        { count: completedTodayCount },
        { count: pendingCount },
        { count: activeWorkerCount }
      ] = await Promise.all([
        supabase.from('work_orders').select('*', { count: 'exact', head: true }),
        supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('completed_at', new Date().toISOString().split('T')[0]),
        supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
      ]);

      setStats({
        totalWorkOrders: totalCount || 0,
        completedToday: completedTodayCount || 0,
        pendingOrders: pendingCount || 0,
        activeWorkers: activeWorkerCount || 0,
        totalRevenue: 125000, // Mock data
        avgCompletionTime: 4.2 // Mock data in hours
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchWorkOrders();
      fetchStats();
    }
  }, [user]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show field worker dashboard if user is a field worker
  if (userProfile?.role === 'field_worker') {
    return <FieldWorkerDashboard />;
  }

  // Admin/Manager Dashboard
  return (
    <>
      <TopBar 
        title="Dashboard" 
        onCreateClick={() => console.log('Opprett ny arbeidsordre')} 
      />
      <div className="flex-1 p-8 bg-background overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Totale ordrer</p>
                    <p className="text-2xl font-bold">{stats.totalWorkOrders}</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Fullført i dag</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ventende ordrer</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Aktive arbeidere</p>
                    <p className="text-2xl font-bold">{stats.activeWorkers}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Ny arbeidsordre</h3>
                    <p className="text-sm text-muted-foreground">Opprett en ny arbeidsordre</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Administrer kunder</h3>
                    <p className="text-sm text-muted-foreground">Kundedatabase og kontakter</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Lagerstyring</h3>
                    <p className="text-sm text-muted-foreground">Materialer og inventar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Work Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Siste arbeidsordrer
              </CardTitle>
              <CardDescription>
                Oversikt over de nyeste arbeidsordene i systemet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : workOrders.length > 0 ? (
                <div className="space-y-4">
                  {workOrders.map((order, index) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-primary font-bold text-sm">#{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{order.title}</h3>
                          <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {new Date(order.created_at).toLocaleDateString('nb-NO')}
                          </div>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ingen arbeidsordrer</h3>
                  <p className="text-muted-foreground">Start ved å opprette din første arbeidsordre</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Dashboard;