import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Clock, User } from 'lucide-react';

// Mock data for work orders with locations
const mockWorkOrders = [
  {
    id: '1',
    title: 'Reparasjon av tak',
    customer: 'Renovering AS',
    address: 'Storgata 15, 0155 Oslo',
    status: 'in_progress',
    assigned_to: 'Ole Hansen',
    coordinates: { lat: 59.9139, lng: 10.7522 }
  },
  {
    id: '2',
    title: 'Installasjon av vinduer',
    customer: 'Bolig Nord',
    address: 'Kirkegata 22, 0153 Oslo',
    status: 'pending',
    assigned_to: 'Kari Nordmann',
    coordinates: { lat: 59.9127, lng: 10.7461 }
  },
  {
    id: '3',
    title: 'Maling av fasade',
    customer: 'Bygg Sør',
    address: 'Torggata 8, 0181 Oslo',
    status: 'completed',
    assigned_to: 'Lars Pettersen',
    coordinates: { lat: 59.9106, lng: 10.7522 }
  }
];

export default function Map() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Venter';
      case 'in_progress': return 'Pågår';
      case 'completed': return 'Fullført';
      case 'cancelled': return 'Avbrutt';
      default: return status;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <TopBar title="Kart" />
      
      <div className="flex-1 p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map Placeholder */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Arbeidsordrer på kart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-full bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Kart kommer snart</h3>
                    <p className="text-muted-foreground">
                      Google Maps eller Leaflet integration vil vises her
                    </p>
                    <Button className="mt-4" variant="outline">
                      <Navigation className="h-4 w-4 mr-2" />
                      Åpne i Google Maps
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Work Orders List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Arbeidsordrer med lokasjon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockWorkOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium">{order.title}</h4>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{order.address}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{order.assigned_to}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Vis på kart
                        </Button>
                        <Button size="sm" variant="outline">
                          <Navigation className="h-4 w-4 mr-1" />
                          Veibeskrivelse
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistikk</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Totale oppdrag:</span>
                  <span className="font-semibold">{mockWorkOrders.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pågående:</span>
                  <span className="font-semibold text-blue-600">
                    {mockWorkOrders.filter(o => o.status === 'in_progress').length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fullført:</span>
                  <span className="font-semibold text-green-600">
                    {mockWorkOrders.filter(o => o.status === 'completed').length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Venter:</span>
                  <span className="font-semibold text-yellow-600">
                    {mockWorkOrders.filter(o => o.status === 'pending').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}