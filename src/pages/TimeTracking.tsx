import { useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Search, Download } from 'lucide-react';

// Mock data for time entries
const mockTimeEntries = [
  {
    id: '1',
    user_name: 'Ole Hansen',
    work_order_title: 'Reparasjon av tak',
    start_time: '2024-01-15T08:00:00Z',
    end_time: '2024-01-15T16:30:00Z',
    break_duration: 30,
    notes: 'Fullført reparasjon av hovedtak'
  },
  {
    id: '2',
    user_name: 'Kari Nordmann',
    work_order_title: 'Installasjon av vinduer',
    start_time: '2024-01-15T09:00:00Z',
    end_time: '2024-01-15T17:00:00Z',
    break_duration: 45,
    notes: 'Installert 6 vinduer i første etasje'
  },
  {
    id: '3',
    user_name: 'Lars Pettersen',
    work_order_title: 'Maling av fasade',
    start_time: '2024-01-14T07:30:00Z',
    end_time: '2024-01-14T15:45:00Z',
    break_duration: 60,
    notes: 'Ferdig med første strøk på sørveggen'
  }
];

export default function TimeTracking() {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('all');

  const filteredEntries = mockTimeEntries.filter((entry) => {
    const matchesSearch = entry.work_order_title.toLowerCase().includes(search.toLowerCase()) ||
                         entry.user_name.toLowerCase().includes(search.toLowerCase());
    const matchesUser = userFilter === 'all' || entry.user_name === userFilter;
    return matchesSearch && matchesUser;
  });

  const calculateHours = (startTime: string, endTime: string, breakDuration: number) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const workMinutes = totalMinutes - breakDuration;
    return (workMinutes / 60).toFixed(1);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('nb-NO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO');
  };

  const getTotalHours = () => {
    return filteredEntries.reduce((total, entry) => {
      return total + parseFloat(calculateHours(entry.start_time, entry.end_time, entry.break_duration));
    }, 0).toFixed(1);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <TopBar title="Tidssporing" />
      
      <div className="flex-1 p-8">
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timer i dag</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.5</div>
              <p className="text-xs text-muted-foreground">
                +12% fra i går
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive medarbeidere</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                av 5 totalt
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Denne uken</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156.2</div>
              <p className="text-xs text-muted-foreground">
                timer totalt
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Søk etter oppgaver eller medarbeidere..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer etter medarbeider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle medarbeidere</SelectItem>
              <SelectItem value="Ole Hansen">Ole Hansen</SelectItem>
              <SelectItem value="Kari Nordmann">Kari Nordmann</SelectItem>
              <SelectItem value="Lars Pettersen">Lars Pettersen</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Eksporter
          </Button>
        </div>

        {/* Time Entries */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tidsregistreringer</CardTitle>
              <Badge variant="secondary">
                {getTotalHours()} timer totalt
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{entry.work_order_title}</h4>
                        <Badge variant="outline">{entry.user_name}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>📅 {formatDate(entry.start_time)}</span>
                        <span>🕐 {formatTime(entry.start_time)} - {formatTime(entry.end_time)}</span>
                        <span>⏸️ {entry.break_duration} min pause</span>
                      </div>
                      
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground">{entry.notes}</p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold text-primary">
                        {calculateHours(entry.start_time, entry.end_time, entry.break_duration)} t
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Arbeidstimer
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}