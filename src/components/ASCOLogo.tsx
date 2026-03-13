import { Link } from 'react-router-dom';
import { AscoLogoMark } from '@/components/AscoLogoMark';
import { useTheme } from '@/hooks/useTheme';

interface ASCOLogoProps {
  /** 'light' = always white logo, 'dark' = always cobalt logo, 'auto' = theme-aware */
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
}

export function ASCOLogo({ variant = 'auto', className = '' }: ASCOLogoProps) {
  const { isDark } = useTheme();

  const resolvedVariant = variant === 'auto'
    ? (isDark ? 'light' : 'dark')
    : variant;

  const logoSrc = resolvedVariant === 'light' ? '/logo-light.png' : '/logo-dark.png';
  const color = resolvedVariant === 'light' ? '#FFFFFF' : 'hsl(232, 21%, 20%)';

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
