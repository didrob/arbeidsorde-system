import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { PublicLayout } from '@/components/public/PublicLayout';
import { GlassCard } from '@/components/public/GlassCard';
import { useTheme } from '@/hooks/useTheme';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn } = useAuth();
  const { isDark } = useTheme();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  };

  return (
    <PublicLayout showBack>
      <GlassCard className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <img
            src={isDark ? '/logo-dark.png' : '/logo-light.png'}
            alt="ASCO"
            className="h-10 mb-3"
          />
          <p className={isDark ? 'text-sm text-white/50' : 'text-sm text-muted-foreground'}>
            Ansattportal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className={isDark ? 'text-white/80' : 'text-foreground'}
            >
              E-post
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="din.epost@asco.no"
              className={
                isDark
                  ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
                  : ''
              }
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className={isDark ? 'text-white/80' : 'text-foreground'}
            >
              Passord
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Skriv inn passord"
              minLength={6}
              className={
                isDark
                  ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
                  : ''
              }
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

        <p
          className={`mt-6 text-center text-sm ${
            isDark ? 'text-white/40' : 'text-muted-foreground'
          }`}
        >
          Har du ikke konto? Kontakt administrator
        </p>
      </GlassCard>
    </PublicLayout>
  );
};

export default Auth;
