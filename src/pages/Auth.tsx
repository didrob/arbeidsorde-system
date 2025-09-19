import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import truckBackground from '@/assets/truck-background.jpg';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      await signIn(email, password);
    } else {
      await signUp(email, password, fullName);
    }

    setLoading(false);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${truckBackground})` }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40" />
      
      <Card className="w-full max-w-md mx-4 relative z-10 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Arbeidsordre System
          </CardTitle>
          <CardDescription>
            {isLogin ? 'Logg inn på din konto' : 'Opprett ny konto'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Fullt navn</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Skriv inn ditt fulle navn"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="din.epost@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Skriv inn passord"
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Behandler...' : isLogin ? 'Logg inn' : 'Opprett konto'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground"
            >
              {isLogin 
                ? 'Har du ikke konto? Opprett en her'
                : 'Har du allerede konto? Logg inn her'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;