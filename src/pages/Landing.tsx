import { useNavigate } from 'react-router-dom';
import { Building2, Users } from 'lucide-react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { GlassCard } from '@/components/public/GlassCard';
import { useTheme } from '@/hooks/useTheme';

const Landing = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <PublicLayout showFooter>
      {/* Hero */}
      <div className="flex flex-col items-center mb-10">
        <img
          src={isDark ? '/logo-dark.png' : '/logo-light.png'}
          alt="ASCO"
          className="h-14 md:h-16 mb-6"
        />
        <h1
          className={`font-heading text-2xl md:text-4xl text-center mb-2 ${
            isDark ? 'text-white' : 'text-foreground'
          }`}
        >
          Velkommen til ASCO
        </h1>
        <p
          className={`text-center max-w-md ${
            isDark ? 'text-white/60' : 'text-muted-foreground'
          }`}
        >
          Bestill tjenester og følg dine oppdrag
        </p>
      </div>

      {/* Entry boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-10">
        {/* Employee */}
        <button onClick={() => navigate('/auth')} className="text-left">
          <GlassCard className="flex flex-col items-center justify-center gap-4 p-8 min-h-[200px] hover:border-asco-teal/40 cursor-pointer">
            <Users
              className={`h-12 w-12 ${isDark ? 'text-white/80' : 'text-cobalt'}`}
            />
            <div className="text-center">
              <span
                className={`font-heading text-xl block mb-1 ${
                  isDark ? 'text-white' : 'text-foreground'
                }`}
              >
                Ansatt
              </span>
              <span className={isDark ? 'text-sm text-white/50' : 'text-sm text-muted-foreground'}>
                Logg inn som ASCO-medarbeider
              </span>
            </div>
          </GlassCard>
        </button>

        {/* Customer portal */}
        <button onClick={() => navigate('/portal/login')} className="text-left">
          <GlassCard
            accent
            className="flex flex-col items-center justify-center gap-4 p-8 min-h-[200px] hover:border-asco-teal/60 cursor-pointer"
          >
            <Building2 className="h-12 w-12 text-asco-teal" />
            <div className="text-center">
              <span
                className={`font-heading text-xl block mb-1 ${
                  isDark ? 'text-white' : 'text-foreground'
                }`}
              >
                Kundeportal
              </span>
              <span className={isDark ? 'text-sm text-white/50' : 'text-sm text-muted-foreground'}>
                Bestill tjenester og følg ordrer
              </span>
            </div>
          </GlassCard>
        </button>
      </div>

      {/* Register link */}
      <button
        onClick={() => navigate('/register-customer')}
        className="text-primary-text hover:underline text-sm font-medium"
      >
        Ny kunde? Registrer bedrift →
      </button>
    </PublicLayout>
  );
};

export default Landing;
