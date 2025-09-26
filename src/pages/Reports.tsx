import { useState, useEffect } from 'react';
import { useWorkOrders } from '@/hooks/useApi';
import { supabase } from '@/integrations/supabase/client';
import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, Users, BarChart, Download, Eye } from 'lucide-react';
import { WorkOrderDetails } from '@/components/WorkOrderDetails';
import { SiteSelector } from '@/components/site/SiteSelector';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import { MobileOptimizedChart } from '@/components/charts/MobileOptimizedChart';
import { MobileDataTable } from '@/components/mobile/MobileDataTable';
import { MobileStatsGrid } from '@/components/mobile/MobileStatsGrid';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ProjectStats {
  id: string;
  title: string;
  customer_name: string;
  estimated_hours: number;
  actual_hours: number;
  efficiency: number;
  status: string;
  revenue: number;
}

export default function Reports() {
  const [timeFilter, setTimeFilter] = useState('last_30_days');
  const [userFilter, setUserFilter] = useState('all');
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(undefined);
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalRevenue: 0,
    totalHours: 0,
    totalProjects: 0,
    avgEfficiency: 0
  });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [siteComparisonData, setSiteComparisonData] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  const { data: workOrders } = useWorkOrders();

  useEffect(() => {
    calculateStats();
    fetchTrendData();
    fetchSiteComparison();
  }, [timeFilter, selectedSiteId]);

  const calculateStats = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('work_orders')
        .select(`
          *,
          customers (name),
          work_order_time_entries (
            start_time,
            end_time
          )
        `)
        .eq('status', 'completed');

      if (selectedSiteId) {
        query = query.eq('site_id', selectedSiteId);
      }

      const { data: workOrdersWithTime, error } = await query;

      if (error) throw error;

      const stats: ProjectStats[] = [];
      let totalRevenue = 0;
      let totalActual = 0;
      let totalEfficiencies = 0;
      let projectCount = 0;

      workOrdersWithTime?.forEach((order: any) => {
        const estimatedHours = order.estimated_hours || 0;
        let actualHours = 0;

        if (order.work_order_time_entries) {
          actualHours = order.work_order_time_entries.reduce((total: number, entry: any) => {
            if (entry.start_time && entry.end_time) {
              const start = new Date(entry.start_time);
              const end = new Date(entry.end_time);
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              return total + hours;
            }
            return total;
          }, 0);
        }

        const efficiency = actualHours > 0 ? Math.round((estimatedHours / actualHours) * 100) : 0;
        const revenue = order.price_value || (estimatedHours * 800);

        stats.push({
          id: order.id,
          title: order.title,
          customer_name: order.customers?.name || 'Ukjent kunde',
          estimated_hours: estimatedHours,
          actual_hours: actualHours,
          efficiency,
          status: order.status,
          revenue
        });

        totalRevenue += revenue;
        totalActual += actualHours;
        if (efficiency > 0) {
          totalEfficiencies += efficiency;
          projectCount++;
        }
      });

      setProjectStats(stats);
      setOverallStats({
        totalRevenue,
        totalHours: totalActual,
        totalProjects: stats.length,
        avgEfficiency: projectCount > 0 ? Math.round(totalEfficiencies / projectCount) : 0
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendData = async () => {
    try {
      let query = supabase
        .from('work_orders')
        .select('completed_at, price_value')
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .order('completed_at');

      if (selectedSiteId) {
        query = query.eq('site_id', selectedSiteId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by month for trend analysis
      const monthlyData = (data || []).reduce((acc: any, order: any) => {
        const month = new Date(order.completed_at).toLocaleString('nb-NO', { 
          year: 'numeric', 
          month: 'short' 
        });
        if (!acc[month]) {
          acc[month] = { month, revenue: 0, count: 0 };
        }
        acc[month].revenue += order.price_value || 0;
        acc[month].count += 1;
        return acc;
      }, {});

      setTrendData(Object.values(monthlyData));
    } catch (error) {
      console.error('Error fetching trend data:', error);
    }
  };

  const fetchSiteComparison = async () => {
    try {
      const { data, error } = await supabase
        .from('site_revenue_stats')
        .select('*')
        .order('total_revenue', { ascending: false })
        .limit(8);
      
      if (error) throw error;
      setSiteComparisonData(data || []);
    } catch (error) {
      console.error('Error fetching site comparison:', error);
    }
  };

  const handleViewDetails = async (projectStat: ProjectStats) => {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          customers (*),
          work_order_time_entries (*),
          work_order_materials (
            *,
            materials (*)
          )
        `)
        .eq('id', projectStat.id)
        .single();

      if (error) throw error;
      
      setSelectedProject(data);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching work order details:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK'
    }).format(amount);
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600 bg-green-50';
    if (efficiency >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const StatCard = ({ title, value, icon: Icon, format = 'number' }: {
    title: string;
    value: number;
    icon: any;
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">
                {format === 'currency' ? formatCurrency(value) : 
                 format === 'percentage' ? `${value}%` : 
                 value.toLocaleString('nb-NO')}
              </p>
            </div>
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <TopBar 
        title="Rapporter" 
        actions={
          <SiteSelector 
            selectedSiteId={selectedSiteId} 
            onSiteChange={setSelectedSiteId}
          />
        }
      />
      
      <div className="flex-1 p-4 md:p-8">
        {/* Filters */}
        <div className={cn(
          "flex gap-4 mb-8",
          isMobile && "flex-col"
        )}>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className={isMobile ? "w-full" : "w-48"}>
              <SelectValue placeholder="Velg tidsperiode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Siste 7 dager</SelectItem>
              <SelectItem value="last_30_days">Siste 30 dager</SelectItem>
              <SelectItem value="last_90_days">Siste 90 dager</SelectItem>
              <SelectItem value="year_to_date">År til dato</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className={isMobile ? "w-full" : "w-auto"}>
            <Download className="h-4 w-4 mr-2" />
            Eksporter
          </Button>
        </div>

        {/* Overview Statistics */}
        <MobileStatsGrid 
          stats={[
            {
              title: "Total omsetning",
              value: overallStats.totalRevenue,
              icon: (
                <span className="h-full w-full flex items-center justify-center text-muted-foreground text-2xl font-semibold">
                  kr
                </span>
              ),
              format: "currency"
            },
            {
              title: "Total timer arbeidet", 
              value: overallStats.totalHours,
              icon: <Clock className="h-full w-full text-muted-foreground" />,
            },
            {
              title: "Fullførte prosjekter",
              value: overallStats.totalProjects,
              icon: <BarChart className="h-full w-full text-muted-foreground" />,
            },
            {
              title: "Gjennomsnittlig effektivitet",
              value: overallStats.avgEfficiency,
              icon: <TrendingUp className="h-full w-full text-muted-foreground" />,
              format: "percentage"
            }
          ]}
          className="mb-8"
        />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
          {/* Revenue Trend Chart */}
          <MobileOptimizedChart
            title="Omsetningstrend"
            description="Månedlig omsetningsutvikling"
            config={{
              revenue: {
                label: "Omsetning",
                color: "hsl(var(--chart-1))",
              },
            }}
            mobileHeight="h-[160px]"
            desktopHeight="h-[200px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${Math.round(value/1000)}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--color-revenue)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </MobileOptimizedChart>

          {/* Site Comparison Chart */}
          <MobileOptimizedChart
            title="Site-sammenligning"
            description="Omsetning per site"
            config={{
              total_revenue: {
                label: "Omsetning",
                color: "hsl(var(--chart-2))",
              },
            }}
            mobileHeight="h-[160px]"
            desktopHeight="h-[200px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={siteComparisonData}>
                <XAxis 
                  dataKey="site_name" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${Math.round(value/1000)}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="total_revenue" 
                  fill="var(--color-total_revenue)" 
                  radius={[2, 2, 0, 0]}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </MobileOptimizedChart>
        </div>

        {/* Project Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className={isMobile ? "text-base" : "text-lg"}>
              Prosjektytelse med effektivitetsanalyse
            </CardTitle>
          </CardHeader>
          <CardContent className={isMobile ? "px-2" : "p-6"}>
            <MobileDataTable
              data={projectStats}
              columns={[
                {
                  key: 'title',
                  label: 'Prosjekt',
                  render: (_, item) => (
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.customer_name}</div>
                    </div>
                  ),
                },
                {
                  key: 'estimated_hours',
                  label: 'Estimert tid',
                  render: (value) => `${value.toFixed(1)}t`,
                  mobileHidden: true,
                },
                {
                  key: 'actual_hours',
                  label: 'Faktisk tid',
                  render: (value) => `${value.toFixed(1)}t`,
                  mobileHidden: true,
                },
                {
                  key: 'efficiency',
                  label: 'Effektivitet',
                  render: (value) => (
                    <Badge className={`${getEfficiencyColor(value)} border-0`}>
                      {value}%
                    </Badge>
                  ),
                },
                {
                  key: 'revenue',
                  label: 'Omsetning',
                  render: (value) => (
                    <span className="font-medium">{formatCurrency(value)}</span>
                  ),
                },
              ]}
              onRowClick={handleViewDetails}
              loading={loading}
              emptyMessage="Ingen fullførte prosjekter funnet for valgt periode."
            />
          </CardContent>
        </Card>

        <WorkOrderDetails 
          workOrder={selectedProject}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
        />
      </div>
    </div>
  );
}