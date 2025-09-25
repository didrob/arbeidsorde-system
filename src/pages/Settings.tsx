import { useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { UserManagement } from '@/components/admin/UserManagement';
import { RoleGuard } from '@/components/access/RoleGuard';
import { User, Bell, Shield, Palette, Database, Save } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);
  const [emailReports, setEmailReports] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleSaveProfile = () => {
    toast({ title: 'Profil oppdatert', description: 'Dine innstillinger er lagret' });
  };

  const handleSaveNotifications = () => {
    toast({ title: 'Varslinger oppdatert', description: 'Varslingsinnstillinger er lagret' });
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <TopBar title="Innstillinger" />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* User Management - Only for system admins */}
          <RoleGuard allowedRoles={['system_admin']} showMessage={false}>
            <UserManagement />
          </RoleGuard>

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Profil</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Fullt navn</Label>
                  <Input id="fullName" placeholder="Ditt fulle navn" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input id="email" type="email" value={user?.email || ''} disabled />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" placeholder="+47 xxx xx xxx" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Rolle</Label>
                  <div className="flex items-center gap-2">
                    <Input id="role" value="Administrator" disabled />
                    <Badge variant="secondary">Admin</Badge>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleSaveProfile}>
                <Save className="h-4 w-4 mr-2" />
                Lagre profil
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Varslinger</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">Push-varslinger</div>
                    <div className="text-sm text-muted-foreground">
                      Motta varslinger om nye arbeidsordrer og oppdateringer
                    </div>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-base">E-post rapporter</div>
                    <div className="text-sm text-muted-foreground">
                      Motta ukentlige rapporter på e-post
                    </div>
                  </div>
                  <Switch checked={emailReports} onCheckedChange={setEmailReports} />
                </div>
              </div>
              
              <Button onClick={handleSaveNotifications}>
                <Save className="h-4 w-4 mr-2" />
                Lagre innstillinger
              </Button>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle>Utseende</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-base">Mørk modus</div>
                  <div className="text-sm text-muted-foreground">
                    Bytt til mørkt tema for bedre synlighet i dårlig lys
                  </div>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Sikkerhet</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Nåværende passord</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                
                <div>
                  <Label htmlFor="newPassword">Nytt passord</Label>
                  <Input id="newPassword" type="password" />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Bekreft nytt passord</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
              </div>
              
              <Button variant="outline">
                Endre passord
              </Button>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>Systeminformasjon</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground">Versjon</div>
                  <div className="font-medium">v1.0.0</div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Sist oppdatert</div>
                  <div className="font-medium">15. januar 2024</div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Database</div>
                  <div className="font-medium">PostgreSQL 15.0</div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Server status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Online</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}