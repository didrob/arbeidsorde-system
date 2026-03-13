import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';

interface PublicLayoutProps {
  children: ReactNode;
  showBack?: boolean;
  showFooter?: boolean;
}

export function PublicLayout({ children, showBack = false, showFooter = false }: PublicLayoutProps) {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col relative ${
        isDark ? 'public-bg public-grid-pattern' : 'public-bg-light public-grid-pattern-light'
      }`}
    >
      {/* Topbar */}
      <header className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="block shrink-0" aria-label="ASCO — Gå til forsiden">
            <img
              src={isDark ? '/logo-dark.png' : '/logo-light.png'}
              alt="ASCO"
              className="h-8 md:h-10 w-auto object-contain"
            />
          </Link>
          {showBack && (
            <button
              onClick={() => navigate('/')}
              className={`flex items-center gap-1 text-sm transition-colors ${
                isDark
                  ? 'text-white/60 hover:text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
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
              className={`flex items-center gap-2 transition-colors ${
                isDark ? 'text-white/60 hover:text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
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
