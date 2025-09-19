import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Clock, Users, FileText, Download, Calendar } from 'lucide-react';

// Mock data for reports
const mockStats = {
  revenue: {
    current: 125000,
    previous: 98000,
    change: 27.6
  },
  hours: {
    current: 324,
    previous: 298,
    change: 8.7
  },
  projects: {
    current: 15,
    previous: 12,
    change: 25
  },
  efficiency: {
    current: 87,
    previous: 82,
    change: 6.1
  }
};

const mockProjects = [
  { name: 'Reparasjon av tak', hours: 45, revenue: 22500, efficiency: 92 },
  { name: 'Installasjon av vinduer', hours: 32, revenue: 16000, efficiency: 88 },
  { name: 'Maling av fasade', hours: 28, revenue: 14000, efficiency: 75 },
  { name: 'Renovering kjøkken', hours: 65, revenue: 32500, efficiency: 95 }
];

export default function Reports() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK'
    }).format(amount);
  };

  const StatCard = ({ title, value, change, icon: Icon, prefix = '', suffix = '' }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{prefix}{value}{suffix}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          {change > 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
          )}
          <span className={change > 0 ? 'text-green-500' : 'text-red-500'}>
            {Math.abs(change)}%
          </span>
          <span className="ml-1">fra forrige periode</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <TopBar title="Rapporter" />
      
      <div className="flex-1 p-8">
        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <Select defaultValue="month">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Velg tidsperiode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Denne uken</SelectItem>
              <SelectItem value="month">Denne måneden</SelectItem>
              <SelectItem value="quarter">Dette kvartalet</SelectItem>
              <SelectItem value="year">Dette året</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Velg medarbeider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle medarbeidere</SelectItem>
              <SelectItem value="ole">Ole Hansen</SelectItem>
              <SelectItem value="kari">Kari Nordmann</SelectItem>
              <SelectItem value="lars">Lars Pettersen</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="ml-auto">
            <Download className="h-4 w-4 mr-2" />
            Eksporter rapport
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Omsetning"
            value={mockStats.revenue.current.toLocaleString('nb-NO')}
            change={mockStats.revenue.change}
            icon={DollarSign}
            prefix="kr "
          />
          
          <StatCard
            title="Timer arbeidet"
            value={mockStats.hours.current}
            change={mockStats.hours.change}
            icon={Clock}
            suffix=" t"
          />
          
          <StatCard
            title="Aktive prosjekter"
            value={mockStats.projects.current}
            change={mockStats.projects.change}
            icon={FileText}
          />
          
          <StatCard
            title="Effektivitet"
            value={mockStats.efficiency.current}
            change={mockStats.efficiency.change}
            icon={TrendingUp}
            suffix="%"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Project Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Prosjektytelse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProjects.map((project, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium">{project.name}</h4>
                      <Badge variant={project.efficiency >= 90 ? 'default' : project.efficiency >= 80 ? 'secondary' : 'destructive'}>
                        {project.efficiency}% effektivitet
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Timer</div>
                        <div className="font-semibold">{project.hours} t</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Omsetning</div>
                        <div className="font-semibold">{formatCurrency(project.revenue)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Time Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Tidsfordeling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Produktivt arbeid</span>
                    <span>78%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Reise/transport</span>
                    <span>15%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Administrativt</span>
                    <span>7%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '7%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-2">Totalt denne måneden</div>
                <div className="text-2xl font-bold">{mockStats.hours.current} timer</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Siste aktivitet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium">Prosjekt fullført</div>
                  <div className="text-sm text-muted-foreground">Reparasjon av tak - Ole Hansen</div>
                </div>
                <div className="text-sm text-muted-foreground">2 timer siden</div>
              </div>
              
              <div className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium">Timer registrert</div>
                  <div className="text-sm text-muted-foreground">8.5 timer - Kari Nordmann</div>
                </div>
                <div className="text-sm text-muted-foreground">4 timer siden</div>
              </div>
              
              <div className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium">Nytt prosjekt startet</div>
                  <div className="text-sm text-muted-foreground">Installasjon av vinduer - Lars Pettersen</div>
                </div>
                <div className="text-sm text-muted-foreground">1 dag siden</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}