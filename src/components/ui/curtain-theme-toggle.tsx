import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Curtain theme toggle — sun/moon icon button. Clicking drops a curtain in
// the destination theme's page color from the top of the viewport, switches
// the theme under cover, then lifts the curtain. Controlled component:
// owners pass current theme + onChange, so it plugs into existing state
// (in this app: the useTweaks store driving body.dataset.theme).
// ─────────────────────────────────────────────────────────────────────────────

export type ToggleTheme = 'light' | 'dark';

interface Props {
  /** Current theme as the rest of the app sees it. */
  theme: ToggleTheme;
  /** Called when the curtain has fully covered the viewport — apply the
   *  theme change here so the user only sees the new theme uncovered. */
  onChange: (next: ToggleTheme) => void;
  /** Curtain color to use when the destination is `light`. */
  lightBg?: string;
  /** Curtain color to use when the destination is `dark`. */
  darkBg?: string;
  /** Duration of one curtain stroke (fall, then rise) in ms. */
  duration?: number;
  /** Diameter of the icon button in px. */
  size?: number;
}

type Phase = 'idle' | 'falling' | 'rising';
const EASING = 'cubic-bezier(0.76, 0, 0.24, 1)';

export function CurtainThemeToggle({
  theme,
  onChange,
  lightBg = '#EFEBE0',  // var(--paper) on :root
  darkBg = '#07070A',   // var(--paper) on [data-theme="dark"]
  duration = 550,
  size = 32,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const curtainColorRef = useRef<string>('');

  const toggle = useCallback(() => {
    if (phase !== 'idle') return;
    const next: ToggleTheme = theme === 'light' ? 'dark' : 'light';
    curtainColorRef.current = next === 'light' ? lightBg : darkBg;
    setPhase('falling');

    // After the curtain has fully covered, swap theme then start the rise.
    setTimeout(() => {
      onChange(next);
      setPhase('rising');
      setTimeout(() => setPhase('idle'), duration + 60);
    }, duration);
  }, [phase, theme, duration, onChange, lightBg, darkBg]);

  const isDark = theme === 'dark';
  const scale = pressed ? 0.96 : hovered ? 1.06 : 1;

  const curtainStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: curtainColorRef.current,
    transformOrigin: 'top',
    transform: phase === 'falling' ? 'scaleY(1)' : 'scaleY(0)',
    transition: phase !== 'idle' ? `transform ${duration}ms ${EASING}` : 'none',
    zIndex: 9997,
    pointerEvents: 'none',
    willChange: 'transform',
  };

  return (
    <>
      <div aria-hidden="true" style={curtainStyle} />
      <button
        type="button"
        className="theme-toggle-btn"
        onClick={toggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setPressed(false); }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={isDark}
        style={{
          width: size,
          height: size,
          transform: `scale(${scale})`,
        }}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
    </>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="1"     x2="12" y2="3"     />
      <line x1="12" y1="21"    x2="12" y2="23"    />
      <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"  />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1"     y1="12"    x2="3"     y2="12"    />
      <line x1="21"    y1="12"    x2="23"    y2="12"    />
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
    </svg>
  );
}
