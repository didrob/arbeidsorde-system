import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSiteFilter } from '@/hooks/useSiteFilter';
import { api } from '@/lib/api';
import { TopBar } from '@/components/TopBar';
import { SiteSelector } from '@/components/site/SiteSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Package, Wrench, FileText, TrendingUp } from 'lucide-react';

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

  // Derived, client-side filtered data by selected site
  const filteredData = selectedSiteId ? {
    customers: orgData.customers.filter((c: any) => c.site_id === selectedSiteId),
    materials: orgData.materials.filter((m: any) => m.site_id === selectedSiteId),
    equipment: orgData.equipment.filter((e: any) => e.site_id === selectedSiteId),
    personnel: orgData.personnel.filter((p: any) => p.site_id === selectedSiteId),
    workOrders: orgData.workOrders.filter((o: any) => o.site_id === selectedSiteId)
  } : orgData;

  useEffect(() => {
    fetchOrgData();
  }, []);

  const fetchOrgData = async () => {
    try {
      const [customersRes, materialsRes, equipmentRes, personnelRes, workOrdersRes] = await Promise.all([
        api.getOrgCustomers(),
        api.getOrgMaterials(),
        api.getOrgEquipment(),
        api.getOrgPersonnel(),
        api.getOrgWorkOrders()
      ]);

      setOrgData({
        customers: customersRes.data || [],
        materials: materialsRes.data || [],
        equipment: equipmentRes.data || [],
        personnel: personnelRes.data || [],
        workOrders: workOrdersRes.data || []
      });
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

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <TopBar 
        title="Organisasjonsoversikt" 
        actions={
          <SiteSelector 
            selectedSiteId={selectedSiteId} 
            onSiteChange={setSelectedSiteId}
          />
        }
      />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Organisasjonsoversikt</h1>
          <p className="text-muted-foreground">{selectedSiteId ? 'Data for valgt site' : 'Aggregerte data fra alle sites i organisasjonen'}</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt kunder</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredData.customers.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt materialer</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredData.materials.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt utstyr</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredData.equipment.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totalt personell</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredData.personnel.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="customers">Kunder</TabsTrigger>
            <TabsTrigger value="materials">Materialer</TabsTrigger>
            <TabsTrigger value="equipment">Utstyr</TabsTrigger>
            <TabsTrigger value="workorders">Arbeidsordrer</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Arbeidsordrer per site</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(
                      filteredData.workOrders.reduce((acc: any, order: any) => {
                        const siteName = order.site_name || 'Ukjent site';
                        acc[siteName] = (acc[siteName] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([site, count]) => (
                      <div key={site} className="flex justify-between">
                        <span>{site}</span>
                        <Badge variant="outline">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status fordeling</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(
                      filteredData.workOrders.reduce((acc: any, order: any) => {
                        acc[order.status] = (acc[order.status] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([status, count]) => (
                      <div key={status} className="flex justify-between">
                        <span className="capitalize">{status}</span>
                        <Badge variant="outline">{count as number}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alle kunder i organisasjonen</CardTitle>
                <CardDescription>{selectedSiteId ? 'Kunder for valgt site' : 'Kunder fra alle sites'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredData.customers.map((customer: any) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {customer.site_name} • {customer.organization_name}
                        </p>
                        {customer.email && (
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alle materialer i organisasjonen</CardTitle>
                <CardDescription>{selectedSiteId ? 'Materialer for valgt site' : 'Materialer fra alle sites'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredData.materials.map((material: any) => (
                    <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{material.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {material.site_name} • {material.organization_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Enhet: {material.unit} • Pris: {material.price ? `${material.price} kr` : 'Ikke satt'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alt utstyr i organisasjonen</CardTitle>
                <CardDescription>{selectedSiteId ? 'Utstyr for valgt site' : 'Utstyr fra alle sites'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredData.equipment.map((equipment: any) => (
                    <div key={equipment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{equipment.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {equipment.site_name} • {equipment.organization_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Type: {equipment.type} • Status: {equipment.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workorders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alle arbeidsordrer i organisasjonen</CardTitle>
                <CardDescription>{selectedSiteId ? 'Arbeidsordrer for valgt site' : 'Arbeidsordrer fra alle sites'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredData.workOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{order.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {order.site_name} • {order.organization_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Kunde: {order.customer_name} • Opprettet: {new Date(order.created_at).toLocaleDateString('nb-NO')}
                        </p>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
