import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { PublicLayout } from '@/components/public/PublicLayout';
import { GlassCard } from '@/components/public/GlassCard';
import { KeyRound } from 'lucide-react';

const testUsers = [
  { label: '🔑 Anders Admin', sub: 'system_admin', email: 'admin@asco-test.no', password: 'Test1234!' },
  { label: '🔑 Linda Leder', sub: 'Tananger', email: 'leder.tananger@asco-test.no', password: 'Test1234!' },
  { label: '🔑 Jonas Disponent', sub: 'Mosjøen', email: 'disponent.mosjoen@asco-test.no', password: 'Test1234!' },
  { label: '🔑 Erik Feltarbeider', sub: 'Tananger', email: 'felt.tananger@asco-test.no', password: 'Test1234!' },
  { label: '🔑 Marte Feltarbeider', sub: 'Farsund', email: 'felt.farsund@asco-test.no', password: 'Test1234!' },
];

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const showTest = searchParams.get('test') === 'true';

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  };

  const handleQuickLogin = async (testEmail: string, testPassword: string) => {
    setLoading(true);
    setEmail(testEmail);
    setPassword(testPassword);
    await signIn(testEmail, testPassword);
    setLoading(false);
  };

  return (
    <PublicLayout showBack>
      <GlassCard className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo-light.png" alt="ASCO" className="h-12 w-auto object-contain mb-2" />
          <p className="text-sm text-pale-blue">Ansattportal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">E-post</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="din.epost@asco.no"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">Passord</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Skriv inn passord"
              minLength={6}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-asco-teal text-asco-teal-foreground hover:bg-asco-teal/90"
            disabled={loading}
          >
            {loading ? 'Logger inn...' : 'Logg inn'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/40">
          Har du ikke konto? Kontakt administrator
        </p>
      </GlassCard>

      {showTest && (
        <div className="w-full max-w-md mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="h-4 w-4 text-white/40" />
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Testbrukere — kun for utvikling</span>
          </div>
          <div className="grid gap-2">
            {testUsers.map((u) => (
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

export default Auth;
