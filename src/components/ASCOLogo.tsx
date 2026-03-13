import { Link } from 'react-router-dom';
import { AscoLogoMark } from '@/components/AscoLogoMark';

interface ASCOLogoProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export function ASCOLogo({ variant = 'light', className = '' }: ASCOLogoProps) {
  const logoSrc = variant === 'light' ? '/logo-light.png' : '/logo-dark.png';
  const color = variant === 'light' ? 'hsl(var(--foreground))' : 'hsl(var(--primary))';

  return (
    <Link to="/dashboard" className={`block shrink-0 ${className}`} aria-label="ASCO — Gå til forsiden">
      <img
        src={logoSrc}
        alt="ASCO"
        className="h-10 w-auto object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).classList.add('hidden');
          const fallback = e.currentTarget.nextElementSibling;
          if (fallback) (fallback as HTMLElement).classList.remove('hidden');
        }}
      />
      {/* SVG fallback */}
      <span className="hidden">
        <AscoLogoMark size={32} color={color} />
      </span>
    </Link>
  );
}
