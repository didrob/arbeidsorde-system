interface AscoLogoMarkProps {
  size?: number;
  color?: string;
  className?: string;
}

/**
 * ASCO logo rendered as inline SVG.
 * The "A" is an inverted-V (no crossbar / tent shape).
 * A teal dot sits directly below the left foot of the A.
 */
export function AscoLogoMark({ size = 40, color = 'white', className = '' }: AscoLogoMarkProps) {
  // Aspect ratio: the SVG viewBox is 100×32 (wide enough for "ASCO" + dot)
  const width = (size / 32) * 100;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 36"
      width={width}
      height={size * (36 / 32)}
      className={className}
      aria-label="ASCO"
      role="img"
    >
      {/* A — inverted V, no crossbar */}
      <path
        d="M 2 28 L 13 4 L 24 28"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Teal dot — directly under the left foot of A */}
      <circle cx="4" cy="34" r="3" fill="#00FDC7" />

      {/* SCO — rendered as text */}
      <text
        x="28"
        y="28"
        fontFamily="var(--font-heading, 'Inter', sans-serif)"
        fontWeight="700"
        fontSize="26"
        letterSpacing="3"
        fill={color}
      >
        SCO
      </text>
    </svg>
  );
}
