import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BulkWorkOrderEditor } from './BulkWorkOrderEditor';
import { ApprovalWorkflow } from './ApprovalWorkflow';
import { AdvancedDataExport } from '../export/AdvancedDataExport';
import { useWorkOrders } from '@/hooks/useApi';
import { 
  Settings, 
  Edit, 
  CheckCircle, 
  Download, 
  BarChart, 
  Users, 
  FileText,
  Zap,
  AlertTriangle
} from 'lucide-react';

export function BackofficeHub() {
  const [selectedOrders, setSelectedOrders] = useState<any[]>([]);
  const [isBulkEditorOpen, setIsBulkEditorOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: workOrders = [] } = useWorkOrders();

  // Mock data for demonstration
  const stats = {
    pendingApprovals: 12,
    activeTimeEntries: 8,
    overdueOrders: 3,
    todaysCompletions: 15
  };

  const quickActions = [
    {
      id: 'bulk-edit',
      title: 'Bulk rediger arbeidsordrer',
      description: 'Rediger flere arbeidsordrer samtidig',
      icon: <Edit className="h-5 w-5" />,
      action: () => setIsBulkEditorOpen(true),
      disabled: selectedOrders.length === 0,
      badge: selectedOrders.length > 0 ? `${selectedOrders.length} valgt` : null
    },
    {
      id: 'export-data',
      title: 'Avansert dataexport',
      description: 'Eksporter tilpassede rapporter',
      icon: <Download className="h-5 w-5" />,
      action: () => setIsExportDialogOpen(true),
    },
    {
      id: 'approval-workflow',
      title: 'Godkjenningsarbeidsflyt',
      description: 'Behandle ventende godkjenninger',
      icon: <CheckCircle className="h-5 w-5" />,
      action: () => setActiveTab('approvals'),
      badge: stats.pendingApprovals > 0 ? `${stats.pendingApprovals} venter` : null
    }
  ];

  const handleOrderSelection = (orders: any[]) => {
    setSelectedOrders(orders);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backoffice</h1>
          <p className="text-muted-foreground">Administrer og godkjenn arbeidsordrer og tidsregistreringer</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Innstillinger
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Venter godkjenning</p>
                <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Aktive tidsregistreringer</p>
                <p className="text-2xl font-bold">{stats.activeTimeEntries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Forsinkede ordrer</p>
                <p className="text-2xl font-bold">{stats.overdueOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">Fullført i dag</p>
                <p className="text-2xl font-bold">{stats.todaysCompletions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Hurtighandlinger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => (
              <Card 
                key={action.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  action.disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => !action.disabled && action.action()}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{action.title}</h3>
                      {action.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="approvals">
            Godkjenninger
            {stats.pendingApprovals > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.pendingApprovals}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bulk-actions">Bulk handlinger</TabsTrigger>
          <TabsTrigger value="reports">Rapporter</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Nylige aktiviteter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Arbeidsordre #12345 fullført av John</span>
                    <span className="text-muted-foreground ml-auto">5 min siden</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Tidsjustering krever godkjenning</span>
                    <span className="text-muted-foreground ml-auto">15 min siden</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Ny arbeidsordre opprettet</span>
                    <span className="text-muted-foreground ml-auto">1 time siden</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Produktivitetsmetrikker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Gjennomsnittlig fullføringsgrad</span>
                      <span className="font-medium">87%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Estimatnøyaktighet</span>
                      <span className="font-medium">73%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '73%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="approvals">
          <ApprovalWorkflow />
        </TabsContent>

        <TabsContent value="bulk-actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk handlinger</CardTitle>
              <p className="text-sm text-muted-foreground">
                Velg arbeidsordrer fra listen nedenfor for å utføre handlinger på flere ordrer samtidig.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setIsBulkEditorOpen(true)}
                    disabled={selectedOrders.length === 0}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Rediger valgte ({selectedOrders.length})
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedOrders(workOrders.slice(0, 5))}
                  >
                    Velg 5 første
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedOrders([])}
                  >
                    Fjern alle
                  </Button>
                </div>
                
                {/* Mock order selection list */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Arbeidsordrer ({workOrders.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {workOrders.slice(0, 10).map((order) => (
                      <div 
                        key={order.id}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted/50 ${
                          selectedOrders.some(selected => selected.id === order.id) ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => {
                          if (selectedOrders.some(selected => selected.id === order.id)) {
                            setSelectedOrders(prev => prev.filter(selected => selected.id !== order.id));
                          } else {
                            setSelectedOrders(prev => [...prev, order]);
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedOrders.some(selected => selected.id === order.id)}
                          readOnly
                        />
                        <div className="flex-1">
                          <div className="font-medium">{order.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.customer?.name} • {order.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Rapporter og Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={() => setIsExportDialogOpen(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Start avansert export
                </Button>
                <p className="text-sm text-muted-foreground">
                  Opprett tilpassede rapporter med fleksible filtre, datoperioder og formater.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BulkWorkOrderEditor
        selectedOrders={selectedOrders}
        isOpen={isBulkEditorOpen}
        onClose={() => setIsBulkEditorOpen(false)}
        onUpdate={() => {
          // Refresh data
          setSelectedOrders([]);
        }}
      />

      <AdvancedDataExport
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
    </div>
  );
}