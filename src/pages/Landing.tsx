import { useNavigate } from 'react-router-dom';
import { Building2, Users, Phone, AlertTriangle } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-8 flex justify-center">
        <img src="/logo-light.png" alt="ASCO" className="h-12 dark:hidden" />
        <img src="/logo-dark.png" alt="ASCO" className="h-12 hidden dark:block" />
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <h1 className="font-heading text-2xl md:text-3xl text-foreground text-center mb-2">
          Velkommen til ASCO
        </h1>
        <p className="text-muted-foreground text-center mb-10 max-w-md">
          Bestill tjenester og følg dine oppdrag
        </p>

        {/* Two entry boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-10">
          {/* Employee box */}
          <button
            onClick={() => navigate('/auth')}
            className="group flex flex-col items-center justify-center gap-4 p-8 rounded-brand bg-secondary text-secondary-foreground hover:bg-cobalt-light transition-colors min-h-[200px] shadow-brand-lg"
          >
            <Users className="h-12 w-12 text-asco-teal" />
            <div className="text-center">
              <span className="font-heading text-xl block mb-1">Ansatt</span>
              <span className="text-sm opacity-80">Logg inn som ASCO-medarbeider</span>
            </div>
          </button>

          {/* Customer portal box */}
          <button
            onClick={() => navigate('/portal/login')}
            className="group flex flex-col items-center justify-center gap-4 p-8 rounded-brand bg-primary text-primary-foreground hover:opacity-90 transition-opacity min-h-[200px] shadow-brand-lg"
          >
            <Building2 className="h-12 w-12" />
            <div className="text-center">
              <span className="font-heading text-xl block mb-1">Kundeportal</span>
              <span className="text-sm opacity-80">Bestill tjenester og følg ordrer</span>
            </div>
          </button>
        </div>

        {/* Register link */}
        <button
          onClick={() => navigate('/register-customer')}
          className="text-primary-text hover:underline text-sm font-medium"
        >
          Ny kunde? Registrer bedrift →
        </button>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4">
        <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>Kontakt: 38 39 57 00</span>
          </div>
          <div className="flex items-center gap-2 text-status-urgent">
            <AlertTriangle className="h-4 w-4" />
            <span>Hasteordrer: Ring direkte</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
