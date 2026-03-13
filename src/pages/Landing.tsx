import { useNavigate } from 'react-router-dom';
import { Building2, Users } from 'lucide-react';
import { PublicLayout } from '@/components/public/PublicLayout';
import { GlassCard } from '@/components/public/GlassCard';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout showFooter>
      {/* Hero */}
      <div className="flex flex-col items-center mb-10">
        <img
          src="/logo-dark.png"
          alt="ASCO"
          className="h-14 md:h-20 mb-6"
        />
        <h1 className="font-heading text-2xl md:text-4xl text-center mb-2 text-white">
          Velkommen til ASCO
        </h1>
        <p className="text-center max-w-md text-pale-blue">
          Bestill tjenester og følg dine oppdrag
        </p>
      </div>

      {/* Entry boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-10">
        {/* Employee */}
        <button onClick={() => navigate('/auth')} className="text-left">
          <GlassCard className="flex flex-col items-center justify-center gap-4 p-8 min-h-[200px] min-w-[280px] cursor-pointer">
            <Users className="h-12 w-12 text-white/80" />
            <div className="text-center">
              <span className="font-heading text-xl block mb-1 text-white">
                Ansatt
              </span>
              <span className="text-sm text-pale-blue">
                Logg inn som ASCO-medarbeider
              </span>
            </div>
          </GlassCard>
        </button>

        {/* Customer portal */}
        <button onClick={() => navigate('/portal/login')} className="text-left">
          <GlassCard
            accent
            className="flex flex-col items-center justify-center gap-4 p-8 min-h-[200px] min-w-[280px] cursor-pointer"
          >
            <Building2 className="h-12 w-12 text-asco-teal" />
            <div className="text-center">
              <span className="font-heading text-xl block mb-1 text-white">
                Kundeportal
              </span>
              <span className="text-sm text-pale-blue">
                Bestill tjenester og følg ordrer
              </span>
            </div>
          </GlassCard>
        </button>
      </div>

      {/* Register link */}
      <button
        onClick={() => navigate('/register-customer')}
        className="text-asco-teal hover:underline text-sm font-medium"
      >
        Ny kunde? Registrer bedrift →
      </button>
    </PublicLayout>
  );
};

export default Landing;
