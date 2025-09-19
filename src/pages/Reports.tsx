import { useState, useEffect } from 'react';
import { useWorkOrders } from '@/hooks/useApi';
import { supabase } from '@/integrations/supabase/client';
import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, DollarSign, Users, BarChart, Download, Eye } from 'lucide-react';
import { WorkOrderDetails } from '@/components/WorkOrderDetails';

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
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalRevenue: 0,
    totalHours: 0,
    totalProjects: 0,
    avgEfficiency: 0
  });
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { data: workOrders } = useWorkOrders();

  useEffect(() => {
    calculateStats();
  }, [timeFilter]);

  const calculateStats = async () => {
    try {
      setLoading(true);
      
      const { data: workOrdersWithTime, error } = await supabase
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
      <TopBar title="Rapporter" />
      
      <div className="flex-1 p-8">
        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Velg tidsperiode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Siste 7 dager</SelectItem>
              <SelectItem value="last_30_days">Siste 30 dager</SelectItem>
              <SelectItem value="last_90_days">Siste 90 dager</SelectItem>
              <SelectItem value="year_to_date">År til dato</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Eksporter
          </Button>
        </div>

        {/* Overview Statistics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard 
            title="Total omsetning" 
            value={overallStats.totalRevenue} 
            icon={DollarSign}
            format="currency"
          />
          <StatCard 
            title="Total timer arbeidet" 
            value={overallStats.totalHours} 
            icon={Clock}
          />
          <StatCard 
            title="Fullførte prosjekter" 
            value={overallStats.totalProjects} 
            icon={BarChart}
          />
          <StatCard 
            title="Gjennomsnittlig effektivitet" 
            value={overallStats.avgEfficiency} 
            icon={TrendingUp}
            format="percentage"
          />
        </div>

        {/* Project Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Prosjektytelse med effektivitetsanalyse</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : projectStats.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-6 gap-4 pb-2 border-b font-medium text-sm text-muted-foreground">
                  <div>Prosjekt</div>
                  <div>Estimert tid</div>
                  <div>Faktisk tid</div>
                  <div>Effektivitet</div>
                  <div>Omsetning</div>
                  <div>Handlinger</div>
                </div>
                {projectStats.map((project) => (
                  <div key={project.id} className="grid grid-cols-6 gap-4 py-3 border-b last:border-b-0">
                    <div>
                      <div className="font-medium">{project.title}</div>
                      <div className="text-sm text-muted-foreground">{project.customer_name}</div>
                    </div>
                    <div className="text-sm">
                      {project.estimated_hours.toFixed(1)}t
                    </div>
                    <div className="text-sm">
                      {project.actual_hours.toFixed(1)}t
                    </div>
                    <div>
                      <Badge className={`${getEfficiencyColor(project.efficiency)} border-0`}>
                        {project.efficiency}%
                      </Badge>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(project.revenue)}
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(project)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detaljer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Ingen fullførte prosjekter funnet for valgt periode.
              </div>
            )}
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