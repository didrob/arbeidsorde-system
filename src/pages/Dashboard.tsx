import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Package, Plus, Clock, MapPin, AlertCircle, TrendingUp, CheckCircle, Timer } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { FieldWorkerDashboard } from '@/components/FieldWorkerDashboard';
import { AdminSidebar } from '@/components/AdminSidebar';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    <div className="flex min-h-screen bg-gradient-surface">
      {/* Sidebar */}
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
                <p className="text-lg text-muted-foreground">
                  Velkommen tilbake! Her er dagens oversikt.
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-3">
                <Button size="lg" className="shadow-elegant hover:shadow-hover transition-all duration-300">
                  <Plus className="h-5 w-5 mr-2" />
                  Ny arbeidsordre
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-primary text-primary-foreground shadow-elegant hover:shadow-hover transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-foreground/80 text-sm font-medium">Totale ordrer</p>
                    <p className="text-3xl font-bold">{stats.totalWorkOrders}</p>
                    <p className="text-primary-foreground/80 text-xs mt-1">
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      +12% fra forrige måned
                    </p>
                  </div>
                  <FileText className="h-12 w-12 text-primary-foreground/80" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-hover transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Fullført i dag</p>
                    <p className="text-3xl font-bold text-success">{stats.completedToday}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      <CheckCircle className="inline h-3 w-3 mr-1" />
                      Av {stats.totalWorkOrders} totalt
                    </p>
                  </div>
                  <CheckCircle className="h-12 w-12 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-hover transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Ventende ordrer</p>
                    <p className="text-3xl font-bold text-warning">{stats.pendingOrders}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      <Timer className="inline h-3 w-3 mr-1" />
                      Krever oppmerksomhet
                    </p>
                  </div>
                  <AlertCircle className="h-12 w-12 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-hover transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Aktive arbeidere</p>
                    <p className="text-3xl font-bold text-foreground">{stats.activeWorkers}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      <Users className="inline h-3 w-3 mr-1" />
                      I felt akkurat nå
                    </p>
                  </div>
                  <Users className="h-12 w-12 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-hover transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Ny arbeidsordre</h3>
                    <p className="text-muted-foreground">Opprett en ny arbeidsordre</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-hover transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-secondary/10 rounded-xl group-hover:bg-secondary/20 transition-colors">
                    <Users className="h-8 w-8 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Administrer kunder</h3>
                    <p className="text-muted-foreground">Kundedatabase og kontakter</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-hover transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors">
                    <Package className="h-8 w-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Lagerstyring</h3>
                    <p className="text-muted-foreground">Materialer og inventar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Work Orders */}
          <Card className="shadow-card">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Clock className="h-6 w-6 text-primary" />
                Siste arbeidsordrer
              </CardTitle>
              <CardDescription>
                Oversikt over de nyeste arbeidsordene i systemet
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : workOrders.length > 0 ? (
                <div className="divide-y divide-border">
                  {workOrders.map((order, index) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-6 hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <span className="text-primary font-bold text-sm">#{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">{order.title}</h3>
                          <p className="text-muted-foreground">{order.customer_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <div className="text-sm font-medium text-foreground">
                            {new Date(order.created_at).toLocaleDateString('nb-NO')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleTimeString('nb-NO', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Ingen arbeidsordrer</h3>
                  <p className="text-muted-foreground">Start ved å opprette din første arbeidsordre</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="md:hidden fixed bottom-6 right-6">
        <Button size="lg" className="h-14 w-14 rounded-full shadow-elegant hover:shadow-hover transition-all duration-300">
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;