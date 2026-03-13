import { useNavigate } from 'react-router-dom';
import { Users, Building2 } from 'lucide-react';
import { PublicLayout } from '@/components/public/PublicLayout';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout showFooter>
      {/* Hero logo */}
      <div className="flex flex-col items-center">
        <span className="font-heading text-5xl font-bold tracking-[0.3em] text-white select-none mb-8">
          <span className="relative inline-block">
            A
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-asco-teal" />
          </span>
          SCO
        </span>

        <h1 className="font-heading text-2xl md:text-[32px] text-white text-center mb-2">
          Velkommen til ASCO
        </h1>
        <p className="text-pale-blue text-base text-center max-w-md">
          Bestill tjenester og følg dine oppdrag
        </p>
      </div>

      {/* Entry boxes */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
        {/* Ansatt */}
        <button
          onClick={() => navigate('/auth')}
          className="w-[260px] h-[220px] bg-white/[0.06] border border-white/[0.12] rounded-[16px] px-10 py-12 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:border-white/30 cursor-pointer"
        >
          <Users className="h-10 w-10 text-white/80" />
          <div className="text-center">
            <span className="font-heading text-xl font-bold text-white block mb-1">
              Ansatt
            </span>
            <span className="text-sm text-pale-blue">
              Logg inn som ASCO-medarbeider
            </span>
          </div>
        </button>

        {/* Kundeportal */}
        <button
          onClick={() => navigate('/portal/login')}
          className="w-[260px] h-[220px] bg-white/[0.06] border border-[rgba(0,253,199,0.3)] rounded-[16px] px-10 py-12 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:border-asco-teal cursor-pointer"
        >
          <Building2 className="h-10 w-10 text-asco-teal" />
          <div className="text-center">
            <span className="font-heading text-xl font-bold text-white block mb-1">
              Kundeportal
            </span>
            <span className="text-sm text-pale-blue">
              Bestill tjenester og følg ordrer
            </span>
          </div>
        </button>
      </div>

      {/* Register link */}
      <button
        onClick={() => navigate('/register-customer')}
        className="mt-8 text-asco-teal hover:underline text-sm font-medium"
      >
        Ny kunde? Registrer bedrift →
      </button>
    </PublicLayout>
  );
};

export default Landing;
