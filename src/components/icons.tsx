// Inline SVG icon set — minimal stroke
type IconProps = { size?: number };

export const Icons = {
  Logo: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 11 L8 4 L14 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ fill: 'none' }} />
      <circle cx="8" cy="9" r="1.2" fill="currentColor" />
    </svg>
  ),

  Arrow: ({ size = 14 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  Play: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M3 2 L10 6 L3 10 Z" fill="currentColor" />
    </svg>
  ),

  Lock: ({ size = 22 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="1.2" fill="currentColor" />
    </svg>
  ),

  Camera: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 10l5-2v8l-5-2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),

  Tour: ({ size = 16 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 8 12 4 20 8 V16 L12 20 4 16 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 8 12 12 20 8 M12 12 V20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),

  Home: ({ size = 22 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 11 12 4 20 11 V20 H4 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 20v-5h4v5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),

  Sensor: ({ size = 22 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M8 12a4 4 0 0 1 8 0M5 12a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  Thermo: ({ size = 22 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M11 4a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0V4z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="13" cy="17" r="1.5" fill="currentColor" />
    </svg>
  ),

  AV: ({ size = 22 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  Marketing: ({ size = 22 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 12a9 9 0 0 1 9-9v9h9a9 9 0 1 1-18 0z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),

  Bulb: ({ size = 22 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3a6 6 0 0 0-3 11.4V17h6v-2.6A6 6 0 0 0 12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 17h6M10 20h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  Cloud: ({ size = 22 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 17.5a4 4 0 0 1-.4-7.96A6 6 0 0 1 18 10.5a4 4 0 0 1 0 7H7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),

  Building: ({ size = 22 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3" width="14" height="18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  Check: ({ size = 12 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6 5 8.5 9.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
} as const;

export type IconName = keyof typeof Icons;
