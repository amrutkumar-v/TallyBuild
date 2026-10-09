interface BrandMarkProps {
  size?: number;
}

export function BrandMark({ size = 34 }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="8" fill="var(--color-accent)" />
      <g stroke="var(--color-shell)" strokeWidth="2.6" strokeLinecap="round">
        <line x1="9" y1="9" x2="9" y2="23" />
        <line x1="14" y1="9" x2="14" y2="23" />
        <line x1="19" y1="9" x2="19" y2="23" />
        <line x1="24" y1="9" x2="24" y2="23" />
        <line x1="6.5" y1="24.5" x2="26.5" y2="7.5" />
      </g>
    </svg>
  );
}
