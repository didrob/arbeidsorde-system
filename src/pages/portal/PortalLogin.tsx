import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'asco-portal-site';

interface Site {
  id: string;
  name: string;
}

const PortalLogin = () => {
  const navigate = useNavigate();
  const { user, isCustomer } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'location' | 'login'>('location');
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in as customer
  useEffect(() => {
    if (user && isCustomer) {
      navigate('/portal', { replace: true });
    }
  }, [user, isCustomer, navigate]);

  // Load sites
  useEffect(() => {
    const fetchSites = async () => {
      const { data } = await supabase
        .from('sites')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (data) setSites(data);
    };
    fetchSites();
  }, []);

  // Restore saved site
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && sites.some(s => s.id === saved)) {
      setSelectedSite(saved);
      setStep('login');
    }
  }, [sites]);

  const handleSiteSelect = (siteId: string) => {
    setSelectedSite(siteId);
    localStorage.setItem(STORAGE_KEY, siteId);
    setStep('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ variant: 'destructive', title: 'Innlogging feilet', description: error.message });
      }
      // Auth state listener in useAuth will handle redirect
    } catch {
      toast({ variant: 'destructive', title: 'Feil', description: 'Noe gikk galt' });
    } finally {
      setLoading(false);
    }
  };

  const siteName = sites.find(s => s.id === selectedSite)?.name;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
        <ArrowLeft className="h-4 w-4" /> Tilbake
      </button>

      <img src="/logo-light.png" alt="ASCO" className="h-10 mb-8 dark:hidden" />
      <img src="/logo-dark.png" alt="ASCO" className="h-10 mb-8 hidden dark:block" />

      {step === 'location' ? (
        <Card className="w-full max-w-md shadow-brand-lg">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-center">Velg lokasjon</CardTitle>
            <p className="text-sm text-muted-foreground text-center">Hvor ønsker du tjenester?</p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {sites.map(site => (
              <Button
                key={site.id}
                variant="outline"
                className="h-20 flex flex-col gap-1 hover:border-primary hover:bg-primary/5"
                onClick={() => handleSiteSelect(site.id)}
              >
                <MapPin className="h-5 w-5 text-primary-text" />
                <span className="text-sm font-medium">{site.name}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md shadow-brand-lg">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-center">Kundeinnlogging</CardTitle>
            <button
              onClick={() => setStep('location')}
              className="flex items-center gap-1 text-sm text-primary-text hover:underline mx-auto"
            >
              <MapPin className="h-3 w-3" /> {siteName}
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="din@bedrift.no"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passord</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Logg inn
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/register-customer')}
                className="text-sm text-primary-text hover:underline"
              >
                Ny kunde? Registrer bedrift →
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PortalLogin;
