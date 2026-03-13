import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, AlertTriangle } from 'lucide-react';


interface PublicLayoutProps {
  children: ReactNode;
  showBack?: boolean;
  showFooter?: boolean;
  variant?: 'landing' | 'form';
}

function AscoLogoSmall() {
  return (
    <span className="font-heading text-xl font-bold tracking-[0.15em] text-white select-none">
      <span className="relative inline-block">
        A
        <span className="absolute -bottom-0.5 left-0 h-2 w-2 rounded-full bg-asco-teal" />
      </span>
      SCO
    </span>
  );
}

export function PublicLayout({ children, showBack = false, showFooter = false, variant = 'form' }: PublicLayoutProps) {
  const navigate = useNavigate();
  const isLanding = variant === 'landing';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Cobalt base fallback */}
      <div className="absolute inset-0 bg-cobalt" />

      {/* Industrial background image */}
      <img
        src="/bg-industrial.jpg"
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover object-center ${
          isLanding ? 'opacity-[0.50]' : 'opacity-[0.35]'
        }`}
      />

      {/* Cobalt overlay */}
      <div
        className={`absolute inset-0 ${
          isLanding ? 'bg-[rgba(41,44,63,0.65)]' : 'bg-[rgba(41,44,63,0.75)]'
        }`}
      />

      {/* Gradient overlay for landing */}
      <div className={`absolute inset-0 bg-gradient-to-b ${
        isLanding
          ? 'from-[rgba(30,32,48,0.95)] via-[rgba(41,44,63,0.80)] to-[rgba(41,44,63,0.75)]'
          : 'from-[rgba(30,32,48,0.95)] via-transparent to-[rgba(41,44,63,0.85)]'
      }`} />

      {/* Topbar */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="ASCO — Gå til forsiden">
            <AscoLogoSmall />
          </Link>
          {showBack && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Tilbake til forsiden</span>
            </button>
          )}
        </div>
        
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {children}
      </main>

      {/* Footer */}
      {showFooter && (
        <footer className="relative z-10 border-t border-white/10 py-6 px-4">
          <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <a
              href="tel:+4738395700"
              className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span>Kontakt: 38 39 57 00</span>
            </a>
            <div className="flex items-center gap-2 text-status-urgent">
              <AlertTriangle className="h-4 w-4" />
              <span>Hasteordrer: Ring direkte</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
