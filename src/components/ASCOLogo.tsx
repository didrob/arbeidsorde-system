import { Link } from 'react-router-dom';

interface ASCOLogoProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export function ASCOLogo({ variant = 'light', className = '' }: ASCOLogoProps) {
  const logoSrc = variant === 'light' ? '/logo-light.png' : '/logo-dark.png';

  return (
    <Link to="/" className={`block shrink-0 ${className}`} aria-label="ASCO — Gå til forsiden">
      <img
        src={logoSrc}
        alt="ASCO"
        className="h-10 w-auto object-contain"
        onError={(e) => {
          // Hide broken image, show text fallback
          (e.currentTarget as HTMLImageElement).classList.add('hidden');
          const fallback = e.currentTarget.nextElementSibling;
          if (fallback) fallback.classList.remove('hidden');
        }}
      />
      {/* Text fallback */}
      <span className="hidden font-heading text-2xl font-normal tracking-wider uppercase relative">
        <span className="relative">
          A
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-asco-teal" />
        </span>
        SCO
      </span>
    </Link>
  );
}
