import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PublicLayout } from '@/components/public/PublicLayout';
import { GlassCard } from '@/components/public/GlassCard';

const STORAGE_KEY = 'asco-portal-site';

interface Site {
  id: string;
  name: string;
}

const testCustomers = [
  { label: '🔑 Kari Koordinator', sub: 'Alcoa', email: 'kari@alcoa-test.no', password: 'Test1234!' },
  { label: '🔑 Ole Driftsen', sub: 'Equinor', email: 'ole@equinor-test.no', password: 'Test1234!' },
];

const PortalLogin = () => {
  const navigate = useNavigate();
  const { user, isCustomer } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const showTest = searchParams.get('test') === 'true';
  const [step, setStep] = useState<'location' | 'login'>('location');
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isCustomer) {
      navigate('/portal', { replace: true });
    }
  }, [user, isCustomer, navigate]);

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
    } catch {
      toast({ variant: 'destructive', title: 'Feil', description: 'Noe gikk galt' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (testEmail: string, testPassword: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: testEmail, password: testPassword });
      if (error) {
        toast({ variant: 'destructive', title: 'Innlogging feilet', description: error.message });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Feil', description: 'Noe gikk galt' });
    } finally {
      setLoading(false);
    }
  };

  const siteName = sites.find(s => s.id === selectedSite)?.name;

  return (
    <PublicLayout showBack>
      {step === 'location' ? (
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="font-heading text-2xl md:text-3xl mb-2 text-white">
              Velg lokasjon
            </h1>
            <p className="text-pale-blue">Hvor ønsker du tjenester?</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {sites.map(site => (
              <button key={site.id} onClick={() => handleSiteSelect(site.id)} className="text-left">
                <GlassCard
                  className={`flex flex-col items-center justify-center gap-2 p-6 min-h-[120px] cursor-pointer ${
                    selectedSite === site.id ? 'border-asco-teal ring-2 ring-asco-teal/30' : ''
                  }`}
                >
                  <MapPin className="h-6 w-6 text-asco-teal" />
                  <span className="text-sm font-medium text-white">{site.name}</span>
                </GlassCard>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <GlassCard className="w-full max-w-md p-8">
          <div className="flex flex-col items-center mb-6">
            <img src="/logo-light.png" alt="ASCO" className="h-12 w-auto object-contain mb-2" />
            <p className="text-sm mb-1 text-pale-blue">Kundeportal</p>
            <button
              onClick={() => setStep('location')}
              className="flex items-center gap-1 text-xs text-asco-teal hover:underline"
            >
              <MapPin className="h-3 w-3" /> {siteName}
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/80">E-post</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="din@bedrift.no"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Passord</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-asco-teal text-asco-teal-foreground hover:bg-asco-teal/90"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Logg inn
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/register-customer')}
              className="text-sm text-asco-teal hover:underline"
            >
              Ny kunde? Registrer bedrift →
            </button>
          </div>
        </GlassCard>
      )}

      {showTest && (
        <div className="w-full max-w-md mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="h-4 w-4 text-white/40" />
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Testbrukere — kun for utvikling</span>
          </div>
          <div className="grid gap-2">
            {testCustomers.map((u) => (
              <button
                key={u.email}
                onClick={() => handleQuickLogin(u.email, u.password)}
                disabled={loading}
                className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm text-white/70 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 text-left"
              >
                <span>{u.label}</span>
                <span className="text-xs text-white/30">{u.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </PublicLayout>
  );
};

export default PortalLogin;
