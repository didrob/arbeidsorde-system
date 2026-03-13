import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface PublicLayoutProps {
  children: ReactNode;
  showBack?: boolean;
  showFooter?: boolean;
}

export function PublicLayout({ children, showBack = false, showFooter = false }: PublicLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Layer 1: Base cobalt gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, hsl(232 25% 15%) 0%, hsl(232 21% 20%) 50%, hsl(232 23% 25%) 100%)',
        }}
      />

      {/* Layer 2: Industrial background image at low opacity */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.12]"
        style={{ backgroundImage: "url('/bg-industrial.jpg')" }}
      />

      {/* Layer 3: Dark gradient overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(30,32,48,0.7) 0%, rgba(30,32,48,0.4) 40%, rgba(30,32,48,0.6) 100%)',
        }}
      />

      {/* Layer 4: Subtle teal grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,253,199,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,253,199,0.06) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Layer 5: Teal glow behind content */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 600px 400px at 50% 55%, rgba(0,253,199,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Topbar */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="block shrink-0" aria-label="ASCO — Gå til forsiden">
            <img
              src="/logo-dark.png"
              alt="ASCO"
              className="h-8 md:h-10 w-auto object-contain"
            />
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
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
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
