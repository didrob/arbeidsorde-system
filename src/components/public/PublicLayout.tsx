import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

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

function WorldMapDots() {
  // Simplified world map dot pattern — ~50 dots positioned to suggest continents
  const dots = [
    // North America
    {cx:18,cy:28},{cx:22,cy:30},{cx:15,cy:32},{cx:20,cy:34},{cx:25,cy:32},{cx:12,cy:26},{cx:16,cy:24},{cx:24,cy:28},
    // South America
    {cx:28,cy:52},{cx:30,cy:56},{cx:27,cy:60},{cx:29,cy:64},{cx:26,cy:48},{cx:31,cy:50},
    // Europe
    {cx:48,cy:24},{cx:50,cy:28},{cx:52,cy:26},{cx:46,cy:30},{cx:54,cy:30},{cx:50,cy:22},
    // Africa
    {cx:50,cy:42},{cx:52,cy:46},{cx:48,cy:50},{cx:54,cy:52},{cx:50,cy:56},{cx:46,cy:44},{cx:56,cy:48},
    // Asia
    {cx:62,cy:24},{cx:66,cy:28},{cx:70,cy:26},{cx:74,cy:30},{cx:68,cy:22},{cx:72,cy:34},{cx:78,cy:28},{cx:64,cy:32},{cx:76,cy:24},{cx:80,cy:32},
    // Oceania
    {cx:80,cy:56},{cx:84,cy:58},{cx:82,cy:62},{cx:78,cy:54},{cx:86,cy:54},
    // Middle East
    {cx:58,cy:34},{cx:60,cy:38},{cx:56,cy:36},
  ];

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 80"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={0.6} className="fill-asco-teal opacity-[0.04]" />
      ))}
    </svg>
  );
}

export function PublicLayout({ children, showBack = false, showFooter = false, variant = 'form' }: PublicLayoutProps) {
  const navigate = useNavigate();
  const isLanding = variant === 'landing';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, hsl(232 21% 24%) 0%, hsl(232 25% 15%) 70%)',
        }}
      />

      {/* Landing-only effects */}
      {isLanding && (
        <>
          {/* Teal glow — top right */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(600px 600px at 75% 20%, rgba(0,253,199,0.07), transparent)',
            }}
          />
          {/* Cobalt-light glow — bottom left */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(500px 500px at 20% 80%, rgba(50,54,80,0.15), transparent)',
            }}
          />
          {/* Center glow behind boxes */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(400px 300px at 50% 55%, rgba(0,253,199,0.04), transparent)',
            }}
          />
          {/* Subtle rounded rectangle frame */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[min(800px,90vw)] h-[500px] border border-white/[0.04] rounded-[32px]" />
          </div>
          {/* World map dots */}
          <WorldMapDots />
        </>
      )}

      {/* Form-only: single centered glow */}
      {!isLanding && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 500px 300px at 50% 55%, rgba(0,253,199,0.035) 0%, transparent 70%)',
          }}
        />
      )}

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
