import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface PublicLayoutProps {
  children: ReactNode;
  showBack?: boolean;
  showFooter?: boolean;
}

function AscoLogoSmall() {
  return (
    <span className="font-heading text-xl font-bold tracking-[0.2em] text-white select-none">
      <span className="relative inline-block">
        A
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-asco-teal" />
      </span>
      SCO
    </span>
  );
}

export function PublicLayout({ children, showBack = false, showFooter = false }: PublicLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background: solid cobalt + radial gradient for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, hsl(232 21% 24%) 0%, hsl(232 25% 15%) 70%)',
        }}
      />

      {/* Subtle teal glow behind content */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 500px 300px at 50% 55%, rgba(0,253,199,0.035) 0%, transparent 70%)',
        }}
      />

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
        <ThemeToggle />
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
