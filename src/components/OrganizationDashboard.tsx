import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSiteFilter } from '@/hooks/useSiteFilter';
import { api } from '@/lib/api';
import { TopBar } from '@/components/TopBar';
import { SiteSelector } from '@/components/site/SiteSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DashboardKPICard } from '@/components/dashboard/DashboardKPICard';
import { DashboardQuickActions } from '@/components/dashboard/DashboardQuickActions';
import { DashboardActivityFeed } from '@/components/dashboard/DashboardActivityFeed';
import { MobileOptimizedChart } from '@/components/charts/MobileOptimizedChart';
import { 
  Building2, 
  Users, 
  Package, 
  Wrench, 
  FileText, 
  TrendingUp, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
  Activity
} from 'lucide-react';

export function OrganizationDashboard() {
  const { user } = useAuth();
  const { selectedSiteId, setSelectedSiteId } = useSiteFilter();
  const [orgData, setOrgData] = useState({
    customers: [],
    materials: [],
    equipment: [],
    personnel: [],
    workOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

<<<<<<< Updated upstream
  // Derived, client-side filtered data by selected site
  const filteredData = selectedSiteId ? {
    customers: orgData.customers.filter((c: any) => c.site_id === selectedSiteId),
    materials: orgData.materials.filter((m: any) => m.site_id === selectedSiteId),
    equipment: orgData.equipment.filter((e: any) => e.site_id === selectedSiteId),
    personnel: orgData.personnel.filter((p: any) => p.site_id === selectedSiteId),
    workOrders: orgData.workOrders.filter((o: any) => o.site_id === selectedSiteId)
  } : orgData;
=======
  // Debug logging
  console.log('OrganizationDashboard render - selectedSiteId:', selectedSiteId);
  console.log('OrganizationDashboard render - loading:', loading);
>>>>>>> Stashed changes

  useEffect(() => {
    fetchOrgData();
  }, [selectedSiteId]); // Re-fetch when selectedSiteId changes

  const fetchOrgData = async () => {
    try {
      console.log('fetchOrgData called with selectedSiteId:', selectedSiteId);
      setLoading(true);
      
      // If a specific site is selected, use regular API methods with site filtering
      // Otherwise, use organization-level methods for aggregated data
      if (selectedSiteId) {
        console.log('Using site-specific API calls for site:', selectedSiteId);
        const [customersRes, materialsRes, equipmentRes, personnelRes, workOrdersRes] = await Promise.all([
          api.getCustomers(selectedSiteId),
          api.getMaterials(selectedSiteId),
          api.getEquipment(selectedSiteId),
          api.getPersonnel(selectedSiteId),
          api.getWorkOrders(undefined, selectedSiteId)
        ]);

        // Check if all responses are successful
        const allSuccessful = [customersRes, materialsRes, equipmentRes, personnelRes, workOrdersRes]
          .every(res => res.success);

        if (allSuccessful) {
          setOrgData({
            customers: customersRes.data || [],
            materials: materialsRes.data || [],
            equipment: equipmentRes.data || [],
            personnel: personnelRes.data || [],
            workOrders: workOrdersRes.data || []
          });
        } else {
          console.error('Some API calls failed:', { customersRes, materialsRes, equipmentRes, personnelRes, workOrdersRes });
        }
      } else {
        console.log('Using organization-level API calls for aggregated data');
        // No site selected - show aggregated data from all sites
        const [customersRes, materialsRes, equipmentRes, personnelRes, workOrdersRes] = await Promise.all([
          api.getOrgCustomers(),
          api.getOrgMaterials(),
          api.getOrgEquipment(),
          api.getOrgPersonnel(),
          api.getOrgWorkOrders()
        ]);

        // Check if all responses are successful
        const allSuccessful = [customersRes, materialsRes, equipmentRes, personnelRes, workOrdersRes]
          .every(res => res.success);

        if (allSuccessful) {
          setOrgData({
            customers: customersRes.data || [],
            materials: materialsRes.data || [],
            equipment: equipmentRes.data || [],
            personnel: personnelRes.data || [],
            workOrders: workOrdersRes.data || []
          });
        } else {
          console.error('Some API calls failed:', { customersRes, materialsRes, equipmentRes, personnelRes, workOrdersRes });
        }
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Venter', variant: 'secondary' as const },
      in_progress: { label: 'Pågår', variant: 'default' as const },
      completed: { label: 'Fullført', variant: 'outline' as const },
      cancelled: { label: 'Avbrutt', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-background">
        <div className="p-6">
          <div className="text-center">Laster organisasjonsdata...</div>
        </div>
      </div>
    );
  }

  // Generate stats for KPI cards with enhanced data
  const workOrderStats = {
    total: filteredData.workOrders.length,
    completed: filteredData.workOrders.filter((wo: any) => wo.status === 'completed').length,
    inProgress: filteredData.workOrders.filter((wo: any) => wo.status === 'in_progress').length,
    pending: filteredData.workOrders.filter((wo: any) => wo.status === 'pending').length
  };

  const completionRate = workOrderStats.total > 0 
    ? Math.round((workOrderStats.completed / workOrderStats.total) * 100) 
    : 0;

  // Chart data for work orders by status
  const workOrderStatusData = [
    { name: 'Fullført', value: workOrderStats.completed, color: 'hsl(var(--chart-2))' },
    { name: 'Pågår', value: workOrderStats.inProgress, color: 'hsl(var(--chart-1))' },
    { name: 'Venter', value: workOrderStats.pending, color: 'hsl(var(--chart-3))' }
  ].filter(item => item.value > 0);

  // Chart data for resources by site
  const resourcesBySiteMap: Record<string, number> = filteredData.workOrders.reduce(
    (acc: Record<string, number>, order: any) => {
      const siteName = order.site_name || 'Ukjent site';
      acc[siteName] = (acc[siteName] || 0) + 1;
      return acc;
    },
    {}
  );
  const resourcesBySiteData: { name: string; value: number; color: string }[] = Object.entries(resourcesBySiteMap).map(
    ([site, count], index) => ({
      name: site,
      value: Number(count),
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    })
  );

  return (
<<<<<<< Updated upstream
    <div className="flex-1 flex flex-col min-h-screen bg-gradient-surface">
      <TopBar 
        title="Dashboard" 
        actions={
          <SiteSelector 
            selectedSiteId={selectedSiteId} 
            onSiteChange={setSelectedSiteId}
          />
        }
      />
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Organisasjonsoversikt
                </h1>
                <p className="text-muted-foreground mt-1">
                  {selectedSiteId ? 'Data for valgt site' : 'Aggregerte data fra alle sites i organisasjonen'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  Live data
                </Badge>
              </div>
            </div>
          </div>
=======
    <div className="flex-1 flex flex-col bg-background">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {selectedSiteId ? 'Site-oversikt' : 'Organisasjonsoversikt'}
          </h1>
          <p className="text-muted-foreground">
            {selectedSiteId 
              ? 'Data fra valgt site' 
              : 'Aggregerte data fra alle sites i organisasjonen'
            }
          </p>
        </div>
>>>>>>> Stashed changes

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardKPICard
              title="Totalt arbeidsordrer"
              value={workOrderStats.total}
              icon={<FileText className="h-5 w-5 text-primary" />}
              trend={{
                value: 12,
                direction: 'up',
                label: 'denne uken'
              }}
              comparison={{
                value: workOrderStats.total - 3,
                label: 'forrige uke'
              }}
              status={workOrderStats.total > 10 ? 'success' : 'warning'}
              action={{
                label: 'Se alle',
                onClick: () => window.location.href = '/work-orders'
              }}
            />

            <DashboardKPICard
              title="Fullføringsgrad"
              value={completionRate}
              format="percentage"
              icon={<CheckCircle2 className="h-5 w-5 text-success" />}
              trend={{
                value: 5,
                direction: 'up',
                label: 'vs forrige måned'
              }}
              status={completionRate >= 80 ? 'success' : completionRate >= 60 ? 'default' : 'destructive'}
            />

            <DashboardKPICard
              title="Aktive ressurser"
              value={filteredData.personnel.length + filteredData.equipment.length}
              icon={<Users className="h-5 w-5 text-primary" />}
              comparison={{
                value: `${filteredData.personnel.length} personell, ${filteredData.equipment.length} utstyr`,
                label: 'fordeling'
              }}
              action={{
                label: 'Administrer',
                onClick: () => window.location.href = '/resources'
              }}
            />

            <DashboardKPICard
              title="Kundebase"
              value={filteredData.customers.length}
              icon={<Building2 className="h-5 w-5 text-primary" />}
              trend={{
                value: 8,
                direction: 'up',
                label: 'nye denne måneden'
              }}
              status="success"
              action={{
                label: 'Se kunder',
                onClick: () => window.location.href = '/customers'
              }}
            />
          </div>

          {/* Quick Actions */}
          <DashboardQuickActions />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Charts Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Work Orders Status Chart */}
              {workOrderStatusData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Status oversikt</span>
                    </CardTitle>
                    <CardDescription>
                      Fordeling av arbeidsordrer etter status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {workOrderStatusData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">{item.value}</span>
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  backgroundColor: item.color,
                                  width: `${(item.value / workOrderStats.total) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Resources by Site Chart */}
              {resourcesBySiteData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Arbeidsordrer per site</span>
                    </CardTitle>
                    <CardDescription>
                      Aktivitetsfordeling på tvers av sites
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {resourcesBySiteData.map((item, index) => {
                        const maxValue = Math.max(...resourcesBySiteData.map(d => d.value as number));
                        return (
                          <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div 
                                className="w-4 h-4 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-sm font-medium truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <span className="text-sm text-muted-foreground">{item.value}</span>
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all"
                                  style={{ 
                                    backgroundColor: item.color,
                                    width: `${((item.value as number) / maxValue) * 100}%`
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Activity Feed */}
            <div className="space-y-6">
              <DashboardActivityFeed className="h-fit" />
              
              {/* Quick Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hurtigstatistikk</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Materialer registrert</span>
                    <Badge variant="outline">{filteredData.materials.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Utstyr tilgjengelig</span>
                    <Badge variant="outline">{filteredData.equipment.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ordre i kø</span>
                    <Badge variant={workOrderStats.pending > 5 ? "destructive" : "outline"}>
                      {workOrderStats.pending}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pågående arbeider</span>
                    <Badge variant="default">{workOrderStats.inProgress}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Detailed Data Tabs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Detaljert oversikt</span>
              </CardTitle>
              <CardDescription>
                Utforsk data på tvers av organisasjonen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="customers">Kunder ({filteredData.customers.length})</TabsTrigger>
                  <TabsTrigger value="materials">Materialer ({filteredData.materials.length})</TabsTrigger>
                  <TabsTrigger value="equipment">Utstyr ({filteredData.equipment.length})</TabsTrigger>
                  <TabsTrigger value="workorders">Arbeidsordrer ({filteredData.workOrders.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="customers" className="mt-6">
                  <div className="space-y-4">
                    {filteredData.customers.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Ingen kunder funnet</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Legg til kunde
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {filteredData.customers.slice(0, 10).map((customer: any) => (
                          <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-medium">{customer.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {customer.site_name} • {customer.organization_name}
                                </p>
                                {customer.email && (
                                  <p className="text-xs text-muted-foreground">{customer.email}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline">Aktiv</Badge>
                          </div>
                        ))}
                        {filteredData.customers.length > 10 && (
                          <Button variant="outline" className="w-full">
                            Se alle {filteredData.customers.length} kunder
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="materials" className="mt-6">
                  <div className="space-y-4">
                    {filteredData.materials.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Ingen materialer registrert</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Legg til material
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {filteredData.materials.slice(0, 10).map((material: any) => (
                          <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                                <Package className="h-5 w-5 text-success" />
                              </div>
                              <div>
                                <h3 className="font-medium">{material.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {material.site_name} • {material.unit}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {material.price ? `${material.price} kr` : 'Pris ikke satt'}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">På lager</Badge>
                          </div>
                        ))}
                        {filteredData.materials.length > 10 && (
                          <Button variant="outline" className="w-full">
                            Se alle {filteredData.materials.length} materialer
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="equipment" className="mt-6">
                  <div className="space-y-4">
                    {filteredData.equipment.length === 0 ? (
                      <div className="text-center py-8">
                        <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Ingen utstyr registrert</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Legg til utstyr
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {filteredData.equipment.slice(0, 10).map((equipment: any) => (
                          <div key={equipment.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                                <Wrench className="h-5 w-5 text-warning" />
                              </div>
                              <div>
                                <h3 className="font-medium">{equipment.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {equipment.site_name} • {equipment.category}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {equipment.standard_rate ? `${equipment.standard_rate} kr/time` : 'Rate ikke satt'}
                                </p>
                              </div>
                            </div>
                            <Badge variant={equipment.is_active ? "default" : "secondary"}>
                              {equipment.is_active ? "Tilgjengelig" : "Ikke tilgjengelig"}
                            </Badge>
                          </div>
                        ))}
                        {filteredData.equipment.length > 10 && (
                          <Button variant="outline" className="w-full">
                            Se alt {filteredData.equipment.length} utstyr
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="workorders" className="mt-6">
                  <div className="space-y-4">
                    {filteredData.workOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Ingen arbeidsordrer funnet</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Opprett arbeidsordre
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {filteredData.workOrders.slice(0, 10).map((order: any) => (
                          <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{order.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {order.customer_name} • {order.site_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Opprettet: {new Date(order.created_at).toLocaleDateString('nb-NO')}
                                </p>
                              </div>
                            </div>
                            <div className="ml-4">
                              {getStatusBadge(order.status)}
                            </div>
                          </div>
                        ))}
                        {filteredData.workOrders.length > 10 && (
                          <Button variant="outline" className="w-full">
                            Se alle {filteredData.workOrders.length} arbeidsordrer
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
