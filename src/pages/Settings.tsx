import { useState } from 'react';
import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { UserManagement } from '@/components/admin/UserManagement';
import { PendingUsersView } from '@/components/admin/PendingUsersView';
import { OrganizationManagement } from '@/components/admin/OrganizationManagement';
import { SiteManagement } from '@/components/admin/SiteManagement';
import { RoleGuard } from '@/components/access/RoleGuard';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { User, Bell, Shield, Palette, Database, Save, Users, Clock, Building2, MapPin, Download, Smartphone, Calendar, CheckCircle } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { profile, loading, updating, updateProfile } = useUserProfile();
  const { installPWA, canInstall, isInstalled, isInstalling, isIOS } = usePWAInstall();
  const [notifications, setNotifications] = useState(true);
  const [emailReports, setEmailReports] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: ''
  });

  // Update form when profile loads
  useState(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || ''
      });
    }
  });

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    const result = await updateProfile({
      full_name: profileForm.full_name.trim() || null,
      phone: profileForm.phone.trim() || null
    });

    if (result?.success) {
      // Update local form state with saved data
      setProfileForm({
        full_name: profile.full_name || '',
        phone: profile.phone || ''
      });
    }
  };

  const handleSaveNotifications = () => {
    toast({ title: 'Varslinger oppdatert', description: 'Varslingsinnstillinger er lagret' });
  };

  const handleInstallPWA = async () => {
    try {
      await installPWA();
      if (!isIOS) {
        toast({ title: 'App installert', description: 'Appen er nå installert på enheten din' });
      }
    } catch (error) {
      toast({ 
        title: 'Installasjon feilet', 
        description: 'Kunne ikke installere appen. Prøv igjen senere.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <TopBar title="Innstillinger" />
      
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* User Management - Only for System Administrators */}
          <RoleGuard allowedRoles={['system_admin']} showMessage={false}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Brukeradministrasjon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="users" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="users" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Alle brukere
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Ventende
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="users">
                    <UserManagement />
                  </TabsContent>
                  <TabsContent value="pending">
                    <PendingUsersView />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </RoleGuard>

          {/* System Administration - Only for System Administrators */}
          <RoleGuard allowedRoles={['system_admin']} showMessage={false}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Systemadministrasjon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="organizations" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="organizations" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Organisasjoner
                    </TabsTrigger>
                    <TabsTrigger value="sites" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Sites
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="organizations">
                    <OrganizationManagement />
                  </TabsContent>
                  <TabsContent value="sites">
                    <SiteManagement />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
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
              {loading ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center space-y-4">
                    <Skeleton className="w-24 h-24 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-10" />
                  </div>
                </div>
              ) : profile ? (
                <>
                  {/* Avatar Upload */}
                  <div className="flex justify-center">
                    <AvatarUpload profile={profile} />
                  </div>

                  <Separator />

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Personlig informasjon</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Fullt navn</Label>
                        <Input 
                          id="fullName" 
                          placeholder="Ditt fulle navn"
                          value={profileForm.full_name}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">E-post</Label>
                        <Input id="email" type="email" value={user?.email || ''} disabled />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input 
                          id="phone" 
                          placeholder="+47 xxx xx xxx"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role">Rolle</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="role" 
                            value={profile.role === 'system_admin' ? 'Systemadministrator' : 
                                   profile.role === 'site_manager' ? 'Site Manager' :
                                   profile.role === 'field_worker' ? 'Feltarbeider' : 
                                   profile.role} 
                            disabled 
                          />
                          <Badge variant={profile.role === 'system_admin' ? 'default' : 'secondary'}>
                            {profile.role === 'system_admin' ? 'SysAdmin' : 
                             profile.role === 'site_manager' ? 'Manager' :
                             profile.role === 'field_worker' ? 'Worker' : 
                             profile.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Work Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Arbeidsinformasjon</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Organisasjon</Label>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {profile.organization?.name || 'Ikke tilordnet'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Site</Label>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {profile.site?.name || 'Ikke tilordnet'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Account Status */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Kontostatus</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Konto opprettet</Label>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(profile.created_at).toLocaleDateString('nb-NO')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <CheckCircle className={`w-4 h-4 ${profile.is_active ? 'text-status-complete' : 'text-destructive'}`} />
                          <span className="text-sm">
                            {profile.is_active ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={handleSaveProfile} disabled={updating}>
                    <Save className="h-4 w-4 mr-2" />
                    {updating ? 'Lagrer...' : 'Lagre profil'}
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Kunne ikke laste profildata</p>
                </div>
              )}
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

          {/* PWA Installation */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                <CardTitle>App-installasjon</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isInstalled ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-green-900">App er installert</div>
                    <div className="text-sm text-green-700">
                      Appen kjører som en installert app på enheten din
                    </div>
                  </div>
                </div>
              ) : canInstall ? (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {isIOS ? 
                      'For å installere appen på iOS: Trykk på Del-knappen i Safari og velg "Legg til på hjemskjerm"' :
                      'Installer appen for raskere tilgang og offline-funksjonalitet'
                    }
                  </div>
                  {!isIOS && (
                    <Button onClick={handleInstallPWA} disabled={isInstalling}>
                      <Download className="h-4 w-4 mr-2" />
                      {isInstalling ? 'Installerer...' : 'Installer app'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  App-installasjon er ikke tilgjengelig i denne nettleseren
                </div>
              )}
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