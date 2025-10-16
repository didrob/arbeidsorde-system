import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSiteFilter } from '@/hooks/useSiteFilter';
import { SiteSelector } from '@/components/site/SiteSelector';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Package, Plus, Clock, AlertCircle, CheckCircle, BarChart3, TrendingUp } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { FieldWorkerDashboard } from '@/components/FieldWorkerDashboard';
import { OrganizationDashboard } from '@/components/OrganizationDashboard';
import { TopBar } from '@/components/TopBar';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MobileOptimizedChart } from '@/components/charts/MobileOptimizedChart';
import { MobileStatsGrid } from '@/components/mobile/MobileStatsGrid';

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
  // Site segregation is now handled by RLS - selectedSiteId is only for UI display
  const { selectedSiteId, setSelectedSiteId } = useSiteFilter();
  const [siteStats, setSiteStats] = useState<any[]>([]);
  const [statusChartData, setStatusChartData] = useState<any[]>([]);
  const [showOrgView, setShowOrgView] = useState(true); // Move this to top level
  
  // Safe navigation hook usage
  let navigate: (path: string) => void;
  try {
    const routerNavigate = useNavigate();
    navigate = (path: string) => {
      try {
        routerNavigate(path);
      } catch (e) {
        console.error('Router navigation failed, using window.location:', e);
        window.location.href = path;
      }
    };
  } catch (error) {
    console.error('Navigation hook error, using fallback:', error);
    navigate = (path: string) => {
      window.location.href = path;
    };
  }
  
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
      let query = supabase
        .from('work_orders')
        .select(`
          id,
          title,
          status,
          customer_id,
          created_at,
          site_id,
          customers (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (selectedSiteId) {
        query = query.eq('site_id', selectedSiteId);
      }

      const { data, error } = await query;

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
      // Build base queries
      let workOrdersQuery = supabase.from('work_orders').select('*', { count: 'exact', head: true });
      let completedTodayQuery = supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', new Date().toISOString().split('T')[0]);
      let pendingQuery = supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Apply site filter if selected
      if (selectedSiteId) {
        workOrdersQuery = workOrdersQuery.eq('site_id', selectedSiteId);
        completedTodayQuery = completedTodayQuery.eq('site_id', selectedSiteId);
        pendingQuery = pendingQuery.eq('site_id', selectedSiteId);
      }

      const [
        { count: totalCount },
        { count: completedTodayCount },
        { count: pendingCount },
        { count: activeWorkerCount }
      ] = await Promise.all([
        workOrdersQuery,
        completedTodayQuery,
        pendingQuery,
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

  const fetchSiteStats = async () => {
    try {
      let query = supabase
        .from('site_work_order_stats')
        .select('*')
        .order('total_orders', { ascending: false });
        
      // If a specific site is selected, only show that site's stats
      if (selectedSiteId) {
        query = query.eq('site_id', selectedSiteId);
      } else {
        query = query.limit(5);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setSiteStats(data || []);
    } catch (error) {
      console.error('Error fetching site stats:', error);
    }
  };

  const fetchStatusChartData = async () => {
    try {
      let query = supabase
        .from('work_orders')
        .select('status')
        .eq('is_deleted', false);

      if (selectedSiteId) {
        query = query.eq('site_id', selectedSiteId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const statusCounts = (data || []).reduce((acc: any, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status === 'pending' ? 'Venter' : 
              status === 'in_progress' ? 'Pågår' :
              status === 'completed' ? 'Ferdig' : 'Avbrutt',
        value: count,
        fill: status === 'pending' ? 'hsl(var(--chart-1))' :
              status === 'in_progress' ? 'hsl(var(--chart-2))' :
              status === 'completed' ? 'hsl(var(--chart-3))' : 'hsl(var(--chart-4))'
      }));

      setStatusChartData(chartData);
    } catch (error) {
      console.error('Error fetching status chart data:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchWorkOrders();
      fetchStats();
      fetchSiteStats();
      fetchStatusChartData();
    }
  }, [user, selectedSiteId]);

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

  // Show loading state while userProfile is being fetched
  if (!userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster brukerprofil...</p>
        </div>
      </div>
    );
  }

  // Show field worker dashboard if user is a field worker
  if (userProfile.role === 'field_worker') {
    return <FieldWorkerDashboard />;
  }

  // Show organization dashboard for system admins (but allow them to switch to normal dashboard)
  if (userProfile.role === 'system_admin') {
    // Debug logging
    console.log('Dashboard render - userProfile:', userProfile);
    console.log('Dashboard render - showOrgView:', showOrgView);
    
    return (
      <>
        <TopBar 
          title="Dashboard" 
          actions={
            <div className="flex items-center gap-4">
              <Button
                variant={showOrgView ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOrgView(true)}
              >
                Organisasjon
              </Button>
              <Button
                variant={!showOrgView ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOrgView(false)}
              >
                Hovedside
              </Button>
              <SiteSelector 
                selectedSiteId={selectedSiteId} 
                onSiteChange={setSelectedSiteId}
              />
            </div>
          }
        />
        {showOrgView ? <OrganizationDashboard /> : (
          <div className="flex-1 p-4 md:p-8 bg-background overflow-auto">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Normal dashboard content for system admin */}
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-4">System Admin Dashboard</h2>
                <p className="text-muted-foreground">Du har tilgang til alle funksjoner i systemet</p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Admin/Manager Dashboard
  return (
    <>
      <TopBar 
        title="Oversikt" 
        actions={
          <SiteSelector 
            selectedSiteId={selectedSiteId} 
            onSiteChange={setSelectedSiteId}
          />
        }
      />
      <div className="flex-1 p-4 md:p-8 bg-background overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Key Performance Indicators */}
          <MobileStatsGrid 
            stats={[
              {
                title: "Totale ordrer",
                value: stats.totalWorkOrders,
                icon: <FileText className="h-full w-full text-primary" />,
              },
              {
                title: "Fullført i dag", 
                value: stats.completedToday,
                icon: <CheckCircle className="h-full w-full text-green-600" />,
                color: "success"
              },
              {
                title: "Ventende ordrer",
                value: stats.pendingOrders, 
                icon: <AlertCircle className="h-full w-full text-orange-600" />,
                color: "warning"
              },
              {
                title: "Aktive arbeidere",
                value: stats.activeWorkers,
                icon: <Users className="h-full w-full text-primary" />,
              }
            ]}
          />

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Site Performance Chart */}
            <MobileOptimizedChart
              title="Arbeidsordrer per site"
              description={selectedSiteId ? "Filtrert visning" : "Alle tilgjengelige sites"}
              icon={<BarChart3 className="h-5 w-5" />}
              config={{
                total_orders: {
                  label: "Antall ordrer",
                  color: "hsl(var(--chart-1))",
                },
              }}
              mobileHeight="h-[180px]"
              desktopHeight="h-[220px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={siteStats}>
                  <XAxis 
                    dataKey="site_name" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="total_orders" 
                    fill="var(--color-total_orders)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </MobileOptimizedChart>

            {/* Status Distribution Chart */}
            <MobileOptimizedChart
              title="Statusoversikt"
              description={selectedSiteId ? "Filtrert på valgt site" : "Alle arbeidsordrer"}
              icon={<TrendingUp className="h-5 w-5" />}
              config={{
                pending: {
                  label: "Venter",
                  color: "hsl(var(--chart-1))",
                },
                in_progress: {
                  label: "Pågår", 
                  color: "hsl(var(--chart-2))",
                },
                completed: {
                  label: "Ferdig",
                  color: "hsl(var(--chart-3))",
                },
                cancelled: {
                  label: "Avbrutt",
                  color: "hsl(var(--chart-4))",
                },
              }}
              mobileHeight="h-[180px]"
              desktopHeight="h-[220px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="75%"
                    innerRadius="45%"
                    fill="#8884d8"
                    paddingAngle={1}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </MobileOptimizedChart>
          </div>

          {/* Recent Work Orders */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Nylige arbeidsordrer
              </CardTitle>
              <CardDescription>
                {selectedSiteId ? "Arbeidsordrer for valgt site" : "Alle tilgjengelige arbeidsordrer"}
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
                  <p className="text-muted-foreground mb-4">
                    {selectedSiteId ? "Ingen ordrer funnet for valgt site" : "Ingen arbeidsordrer tilgjengelig"}
                  </p>
                  <Button 
                    onClick={() => navigate('/work-orders')} 
                    className="mt-2"
                  >
                    Opprett arbeidsordre
                  </Button>
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