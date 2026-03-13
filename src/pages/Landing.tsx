import { useNavigate } from 'react-router-dom';
import { Users, Building2 } from 'lucide-react';
import { PublicLayout } from '@/components/public/PublicLayout';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <PublicLayout showFooter variant="landing">
      {/* Hero logo */}
      <div className="flex flex-col items-center">
        <img src="/logo-light.png" alt="ASCO" className="h-14 w-auto object-contain mb-8" />

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
          className="w-[280px] h-[220px] bg-black/40 border border-white/20 rounded-[16px] px-12 py-14 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:border-white/30 hover:-translate-y-0.5 cursor-pointer"
        >
          <Users className="h-10 w-10 text-white/80" />
          <div className="text-center">
            <span className="font-heading text-xl font-bold text-white block mb-1">
              Ansatt
            </span>
            <span className="text-sm text-pale-blue whitespace-nowrap">
              Logg inn som ASCO-medarbeider
            </span>
          </div>
        </button>

        {/* Kundeportal */}
        <button
          onClick={() => navigate('/portal/login')}
          className="w-[280px] h-[220px] bg-black/40 border border-[rgba(0,253,199,0.3)] rounded-[16px] px-12 py-14 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:border-asco-teal hover:-translate-y-0.5 cursor-pointer"
        >
          <Building2 className="h-10 w-10 text-asco-teal" />
          <div className="text-center">
            <span className="font-heading text-xl font-bold text-white block mb-1">
              Kundeportal
            </span>
            <span className="text-sm text-pale-blue whitespace-nowrap">
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
